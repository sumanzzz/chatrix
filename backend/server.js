/**
 * Chatrix Backend Server
 * Real-time anonymous chatrooms with Socket.IO
 * 
 * Features:
 * - Anonymous user management
 * - Room creation and management
 * - Real-time messaging
 * - WebRTC voice support
 * - Admin controls (kick/ban)
 * - Rate limiting
 * - In-memory storage (with Redis adapter comments)
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { setupSocketHandlers } from './socketHandlers.js';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] // Replace with your production domain
    : ['http://localhost:3001', 'http://127.0.0.1:3001'],
  credentials: true
};

// Socket.IO configuration
const io = new Server(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling']
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Rate limiting for API endpoints
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api', limiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API endpoint to get rooms (for non-Socket.IO clients)
app.get('/api/rooms', (req, res) => {
  try {
    const { search, tags } = req.query;
    const filter = {};
    
    if (search) filter.search = search;
    if (tags) filter.tags = tags.split(',');
    
    // Import roomManager here to avoid circular dependency
    import('./rooms.js').then(({ default: roomManager }) => {
      const rooms = roomManager.getRooms(filter);
      res.json({ success: true, rooms });
    });
  } catch (error) {
    console.error('Error getting rooms via API:', error);
    res.status(500).json({ success: false, error: 'Failed to get rooms' });
  }
});

// API endpoint to get all tags
app.get('/api/tags', async (req, res) => {
  try {
    const { default: roomManager } = await import('./rooms.js');
    const tags = roomManager.getAllTags();
    res.json({ success: true, tags });
  } catch (error) {
    console.error('Error getting tags via API:', error);
    res.status(500).json({ success: false, error: 'Failed to get tags' });
  }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('../frontend/dist'));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

// Setup Socket.IO handlers
setupSocketHandlers(io);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    success: false, 
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message 
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Chatrix server running on port ${PORT}`);
  console.log(`📡 Socket.IO enabled with CORS for frontend`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🔗 Frontend should connect to: http://localhost:${PORT}`);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
