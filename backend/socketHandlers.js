/**
 * Socket.IO Event Handlers
 * Handles all real-time communication events
 */

import roomManager from './rooms.js';

// Rate limiting: track message counts per socket
const messageCounts = new Map();
const RATE_LIMIT = 100; // messages per minute
const RATE_WINDOW = 60000; // 1 minute

/**
 * Check if user has exceeded rate limit
 */
function checkRateLimit(socketId) {
  const now = Date.now();
  const userCounts = messageCounts.get(socketId) || { count: 0, resetTime: now + RATE_WINDOW };
  
  if (now > userCounts.resetTime) {
    userCounts.count = 0;
    userCounts.resetTime = now + RATE_WINDOW;
  }
  
  if (userCounts.count >= RATE_LIMIT) {
    return false;
  }
  
  userCounts.count++;
  messageCounts.set(socketId, userCounts);
  return true;
}

/**
 * Setup socket event handlers
 */
export function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Handle room creation
    socket.on('create_room', (data, callback) => {
      try {
        const { name, tags = [], locked = false, password } = data;
        
        if (!name || name.trim().length === 0) {
          return callback({ success: false, error: 'Room name is required' });
        }

        if (name.length > 50) {
          return callback({ success: false, error: 'Room name too long (max 50 characters)' });
        }

        if (tags.length > 10) {
          return callback({ success: false, error: 'Too many tags (max 10)' });
        }

        const room = roomManager.createRoom({
          name: name.trim(),
          tags: tags.map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0),
          locked,
          password
        }, socket.id);

        // Join the room
        socket.join(room.id);

        callback({
          success: true,
          room: {
            id: room.id,
            name: room.name,
            tags: room.tags,
            locked: room.locked,
            userCount: room.users.size
          }
        });

        // Notify all clients about new room
        io.emit('room_list', {
          rooms: roomManager.getRooms()
        });

      } catch (error) {
        console.error('Error creating room:', error);
        callback({ success: false, error: 'Failed to create room' });
      }
    });

    // Handle getting rooms list
    socket.on('get_rooms', (data, callback) => {
      try {
        const rooms = roomManager.getRooms(data || {});
        callback({ success: true, rooms });
      } catch (error) {
        console.error('Error getting rooms:', error);
        callback({ success: false, error: 'Failed to get rooms' });
      }
    });

    // Quick join first matching open room
    socket.on('quick_join', (data, callback) => {
      try {
        const preferredTags = data?.tags || [];
        const target = roomManager.quickJoin(preferredTags);
        if (!target) return callback({ success: false, reason: 'No open rooms available' });
        callback({ success: true, roomId: target.id });
      } catch (error) {
        console.error('Error quick joining:', error);
        callback({ success: false, reason: 'Quick join failed' });
      }
    });

    // Handle joining a room
    socket.on('join_room', (data, callback) => {
      try {
        const { roomId, password } = data;
        
        if (!roomId) {
          return callback({ success: false, error: 'Room ID is required' });
        }

        // Leave current room if in one
        const currentRoom = roomManager.getUserRoom(socket.id);
        if (currentRoom) {
          const prevUser = currentRoom.users.get(socket.id);
          socket.leave(currentRoom.id);
          roomManager.leaveRoom(socket.id);

          // Notify room about user leaving
          socket.to(currentRoom.id).emit('user_left', {
            roomId: currentRoom.id,
            user: { anonName: prevUser?.anonName, socketId: socket.id }
          });
        }

        const result = roomManager.joinRoom(roomId, socket.id, password);
        
        if (!result.success) {
          return callback(result);
        }

        // Join the socket room
        socket.join(roomId);

        // Notify room about new user
        socket.to(roomId).emit('user_joined', {
          roomId,
          user: { anonName: result.assignedName, socketId: socket.id },
        });

        // Send room messages to the joining user
        const messages = roomManager.getRoomMessages(roomId);
        socket.emit('room_messages', { roomId, messages });

        callback(result);

      } catch (error) {
        console.error('Error joining room:', error);
        callback({ success: false, error: 'Failed to join room' });
      }
    });

    // Handle leaving a room
    socket.on('leave_room', (data, callback) => {
      try {
        const currentRoom = roomManager.getUserRoom(socket.id);
        if (!currentRoom) {
          return callback({ success: false, error: 'Not in any room' });
        }

        const result = roomManager.leaveRoom(socket.id);
        if (result.success) {
          const prevUser = currentRoom.users.get(socket.id);
          socket.leave(currentRoom.id);

          // Notify room about user leaving
          socket.to(currentRoom.id).emit('user_left', {
            roomId: currentRoom.id,
            user: { anonName: prevUser?.anonName, socketId: socket.id }
          });
        }

        callback(result);

      } catch (error) {
        console.error('Error leaving room:', error);
        callback({ success: false, error: 'Failed to leave room' });
      }
    });

    // Handle sending messages
    socket.on('send_message', (data, callback) => {
      try {
        const { roomId, text } = data;
        
        if (!roomId || !text || text.trim().length === 0) {
          return callback({ success: false, error: 'Room ID and message text are required' });
        }

        if (text.length > 1000) {
          return callback({ success: false, error: 'Message too long (max 1000 characters)' });
        }

        // Check rate limit
        if (!checkRateLimit(socket.id)) {
          return callback({ success: false, error: 'Rate limit exceeded. Please slow down.' });
        }

        const currentRoom = roomManager.getUserRoom(socket.id);
        if (!currentRoom || currentRoom.id !== roomId) {
          return callback({ success: false, error: 'Not in this room' });
        }

        const result = roomManager.addMessage(roomId, socket.id, text.trim(), data.clientTempId);
        
        if (!result.success) {
          return callback(result);
        }

        // Broadcast message to room
        io.to(roomId).emit('message', { roomId, message: result.message });

        callback({ success: true, message: result.message });

      } catch (error) {
        console.error('Error sending message:', error);
        callback({ success: false, error: 'Failed to send message' });
      }
    });

    // Speech transcript from client
    socket.on('speech_transcript', async (data, callback) => {
      try {
        const { roomId, transcript, detectedLang } = data;
        if (!roomId || !transcript) return callback({ success: false, error: 'Missing transcript or roomId' });
        const currentRoom = roomManager.getUserRoom(socket.id);
        if (!currentRoom || currentRoom.id !== roomId) return callback({ success: false, error: 'Not in this room' });

        const addRes = roomManager.addTranscript(roomId, socket.id, transcript, detectedLang);
        if (!addRes.success) return callback(addRes);

        // Optional translation proxy
        let translated = null;
        let detected = detectedLang || null;
        if (process.env.TRANSLATION_API_URL && process.env.TRANSLATION_API_KEY) {
          try {
            const resp = await fetch(process.env.TRANSLATION_API_URL, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.TRANSLATION_API_KEY}`
              },
              body: JSON.stringify({ text: transcript })
            });
            if (resp.ok) {
              const data = await resp.json();
              translated = data.translated || null;
              detected = data.detectedLang || detected;
            }
          } catch (e) {
            console.warn('Translation proxy failed');
          }
        }

        const payload = {
          id: addRes.item.id,
          from: addRes.item.from,
          socketId: socket.id,
          transcript,
          detectedLang: detected,
          translated,
          timestamp: addRes.item.timestamp
        };
        io.to(roomId).emit('speech_transcript_broadcast', { roomId, transcript: payload });
        callback({ success: true, transcriptId: addRes.item.id });
      } catch (error) {
        console.error('Error handling speech transcript:', error);
        callback({ success: false, error: 'Failed to handle transcript' });
      }
    });

    // Handle WebRTC signaling
    socket.on('webrtc-signal', (data) => {
      const { roomId, signal, targetSocketId } = data;
      const currentRoom = roomManager.getUserRoom(socket.id);
      
      if (currentRoom && currentRoom.id === roomId) {
        socket.to(targetSocketId).emit('webrtc-signal', {
          signal,
          fromSocketId: socket.id
        });
      }
    });

    // Handle admin actions - kick user
    socket.on('kick_user', (data, callback) => {
      try {
        const { roomId, targetSocketId } = data;
        
        if (!roomManager.isRoomOwner(roomId, socket.id)) {
          return callback({ success: false, error: 'Only room owner can kick users' });
        }

        const result = roomManager.kickUser(roomId, targetSocketId, socket.id);
        
        if (result.success) {
          // Notify the kicked user
          io.to(targetSocketId).emit('kicked', {
            roomId,
            reason: 'You have been kicked from the room'
          });
          
          // Notify room about the kick
          socket.to(roomId).emit('user_kicked', { roomId, user: result.kickedUser });
        }

        callback(result);

      } catch (error) {
        console.error('Error kicking user:', error);
        callback({ success: false, error: 'Failed to kick user' });
      }
    });

    // Handle admin actions - ban user
    socket.on('ban_user', (data, callback) => {
      try {
        const { roomId, targetSocketId } = data;
        
        if (!roomManager.isRoomOwner(roomId, socket.id)) {
          return callback({ success: false, error: 'Only room owner can ban users' });
        }

        const result = roomManager.banUser(roomId, targetSocketId, socket.id);
        
        if (result.success) {
          // Notify the banned user
          io.to(targetSocketId).emit('banned', {
            roomId,
            reason: 'You have been banned from this room'
          });
          
          // Notify room about the ban
          socket.to(roomId).emit('user_banned', { roomId, user: result.bannedUser });
        }

        callback(result);

      } catch (error) {
        console.error('Error banning user:', error);
        callback({ success: false, error: 'Failed to ban user' });
      }
    });

    // Handle getting room info
    socket.on('get_room_state', (data, callback) => {
      try {
        const { roomId } = data;
        const room = roomManager.getRoom(roomId);
        
        if (!room) {
          return callback({ success: false, error: 'Room not found' });
        }

        callback({
          success: true,
          room: {
            id: room.id,
            name: room.name,
            tags: room.tags,
            locked: room.locked,
            userCount: room.users.size,
            users: Array.from(room.users.entries()).map(([socketId, u]) => ({ ...u, socketId })),
            isOwner: roomManager.isRoomOwner(roomId, socket.id)
          }
        });

      } catch (error) {
        console.error('Error getting room info:', error);
        callback({ success: false, error: 'Failed to get room info' });
      }
    });

    // Handle getting all tags
    socket.on('get_tags', (callback) => {
      try {
        const tags = roomManager.getAllTags();
        callback({ success: true, tags });
      } catch (error) {
        console.error('Error getting tags:', error);
        callback({ success: false, error: 'Failed to get tags' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);

      const currentRoom = roomManager.getUserRoom(socket.id);
      if (currentRoom) {
        const prevUser = currentRoom.users.get(socket.id);
        // Notify room about user leaving
        socket.to(currentRoom.id).emit('user_left', { roomId: currentRoom.id, user: { anonName: prevUser?.anonName, socketId: socket.id } });
      }
      
      // Clean up user data
      roomManager.cleanupUser(socket.id);
      messageCounts.delete(socket.id);
    });
  });
}
