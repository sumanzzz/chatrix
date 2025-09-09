# Chatrix Frontend

React-based frontend for Chatrix real-time anonymous chatrooms.

## 🚀 Features

- **Real-time Chat**: Socket.IO powered instant messaging
- **Voice Chat**: WebRTC peer-to-peer voice communication
- **Room Management**: Create, join, and manage chat rooms
- **Admin Controls**: Kick/ban users, manage room settings
- **Responsive Design**: Works on desktop and mobile
- **Red Theme**: Distinctive full-red background design

## 🛠️ Tech Stack

- **React 18**: Modern React with hooks
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **Socket.IO Client**: Real-time communication
- **WebRTC**: Voice chat functionality
- **Lucide React**: Beautiful icons

## 📦 Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🏗️ Project Structure

```
src/
├── components/          # React components
│   ├── RoomList.jsx    # Room browsing and joining
│   ├── CreateRoom.jsx  # Room creation form
│   ├── ChatRoom.jsx    # Main chat interface
│   ├── MessageList.jsx # Message display
│   ├── UserList.jsx    # User management
│   ├── VoiceToggle.jsx # Voice chat controls
│   ├── AdminControls.jsx # Admin functions
│   └── RoomFilters.jsx # Search and filtering
├── contexts/           # React contexts
│   ├── SocketContext.jsx # Socket.IO connection
│   ├── RoomContext.jsx   # Room management
│   └── VoiceContext.jsx  # Voice chat state
├── App.jsx            # Main application
├── main.jsx          # Application entry point
└── index.css         # Global styles and theme
```

## 🎨 Theming

The app uses a custom red theme with Tailwind CSS:

```css
/* CSS Variables */
--chatrix-bg: #ff0000;        /* Pure red background */
--chatrix-dark: #c10a0a;      /* Darker red for cards */
--chatrix-darker: #8b0000;    /* Darkest red for messages */
--chatrix-light: #ff4444;     /* Light red for accents */
--chatrix-text: #ffffff;      /* White text */
--chatrix-border: #ff6666;    /* Red borders */
```

### Customizing Colors

1. **CSS Variables**: Modify `src/index.css`
2. **Tailwind Config**: Update `tailwind.config.js`
3. **Component Classes**: Use `chatrix-*` utility classes

## 🔌 Socket.IO Integration

### Connection Setup
```javascript
import { useSocket } from './contexts/SocketContext';

const MyComponent = () => {
  const socket = useSocket();
  
  // Emit events
  socket.emit('create_room', roomData, callback);
  
  // Listen for events
  useEffect(() => {
    socket.on('message', handleMessage);
    return () => socket.off('message', handleMessage);
  }, []);
};
```

### Available Events
- `create_room` - Create a new room
- `join_room` - Join an existing room
- `leave_room` - Leave current room
- `message` - Send/receive messages
- `webrtc-signal` - Voice chat signaling

## 🎤 Voice Chat

### WebRTC Implementation
```javascript
import { useVoice } from './contexts/VoiceContext';

const VoiceComponent = () => {
  const { 
    isVoiceEnabled, 
    isMuted, 
    initializeVoice, 
    toggleMute 
  } = useVoice();
  
  // Enable voice chat
  const handleEnableVoice = async () => {
    try {
      await initializeVoice();
    } catch (error) {
      console.error('Voice initialization failed:', error);
    }
  };
};
```

### Voice Features
- **Microphone Access**: Request user permission
- **Peer Connections**: WebRTC for audio streaming
- **Mute/Unmute**: Toggle microphone on/off
- **Status Indicators**: Show speaking status

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Mobile Features
- Touch-friendly buttons
- Responsive chat interface
- Optimized user list
- Mobile-optimized modals

## 🧪 Testing

### Manual Testing
1. **Multiple Tabs**: Open multiple browser tabs
2. **Real-time Updates**: Test message synchronization
3. **Voice Chat**: Test microphone permissions
4. **Mobile**: Test on mobile devices

### Browser Support
- **Chrome**: Full support (recommended)
- **Firefox**: Full support
- **Safari**: Full support
- **Edge**: Full support

## 🚀 Deployment

### Development
```bash
npm run dev
# Runs on http://localhost:3001
```

### Production Build
```bash
npm run build
# Creates dist/ folder with optimized build
```

### Environment Variables
```env
VITE_SERVER_URL=http://localhost:3000
```

## 🔧 Configuration

### Vite Config
```javascript
// vite.config.js
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    proxy: {
      '/api': 'http://localhost:3000',
      '/socket.io': 'http://localhost:3000'
    }
  }
});
```

### Tailwind Config
```javascript
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'chatrix-red': '#ff0000',
        // ... custom colors
      }
    }
  }
};
```

## 🐛 Troubleshooting

### Common Issues

**Socket Connection Failed**
- Check if backend server is running
- Verify CORS settings
- Check network connectivity

**Voice Chat Not Working**
- Ensure microphone permissions
- Check browser WebRTC support
- Try different browser

**Styling Issues**
- Clear browser cache
- Check Tailwind CSS compilation
- Verify CSS variables

**Build Errors**
- Check Node.js version (18+)
- Clear node_modules and reinstall
- Check for TypeScript errors

### Debug Mode
```bash
# Enable debug logging
NODE_ENV=development npm run dev
```

## 📚 Component Documentation

### RoomList
- Displays available rooms
- Search and filtering
- Join room functionality

### CreateRoom
- Room creation form
- Tag management
- Password protection

### ChatRoom
- Main chat interface
- Message display
- User management
- Admin controls

### MessageList
- Real-time message display
- User avatars and timestamps
- System notifications

### UserList
- Active users display
- Voice status indicators
- Admin controls

### VoiceToggle
- Voice chat controls
- Microphone permissions
- Mute/unmute functionality

## 🤝 Contributing

1. Follow React best practices
2. Use TypeScript for type safety
3. Write responsive components
4. Test on multiple browsers
5. Follow the red theme guidelines

## 📄 License

MIT License - see LICENSE file for details
