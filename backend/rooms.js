/**
 * Room Management Module
 * Handles in-memory storage of chat rooms and user management
 * 
 * Tradeoffs:
 * - In-memory storage means rooms reset on server restart
 * - For production scaling, uncomment Redis adapter sections
 */

import crypto from 'crypto';

class RoomManager {
  constructor() {
    this.rooms = new Map();
    this.anonymousCounter = 0;
    this.userSessions = new Map(); // socketId -> { anonName, currentRoom }
    this.kickedUsers = new Map(); // socketId -> { roomId, kickedAt }
    this.kickTimeout = 60000; // 1 minute
  }

  /**
   * Generate unique room ID
   */
  generateRoomId() {
    return crypto.randomBytes(8).toString('hex');
  }

  /**
   * Get next anonymous name
   */
  getNextAnonymousName() {
    this.anonymousCounter++;
    return `anonymous${this.anonymousCounter}`;
  }

  /**
   * Create a new room
   */
  createRoom(roomData, ownerSocketId) {
    const roomId = this.generateRoomId();
    const room = {
      id: roomId,
      name: roomData.name,
      tags: roomData.tags || [],
      locked: roomData.locked || false,
      passwordHash: roomData.locked && roomData.password ? 
        crypto.createHash('sha256').update(roomData.password).digest('hex') : null,
      ownerSocketId,
      users: new Map(),
      banned: new Set(),
      createdAt: new Date(),
      messages: [],
      transcripts: []
    };

    this.rooms.set(roomId, room);
    return room;
  }

  /**
   * Get all rooms with optional filtering
   */
  getRooms(filter = {}) {
    let rooms = Array.from(this.rooms.values()).map(room => ({
      id: room.id,
      name: room.name,
      tags: room.tags,
      locked: room.locked,
      userCount: room.users.size,
      createdAt: room.createdAt
    }));

    // Filter by search/query term
    const term = (filter.search || filter.query || '').toLowerCase();
    if (term) {
      rooms = rooms.filter(room => 
        room.name.toLowerCase().includes(term)
      );
    }

    // Filter by tags
    if (filter.tags && filter.tags.length > 0) {
      rooms = rooms.filter(room => 
        filter.tags.some(tag => room.tags.includes(tag))
      );
    }

    return rooms;
  }

  /**
   * Quick join: pick first open room matching tags
   */
  quickJoin(preferredTags = []) {
    const rooms = this.getRooms({});
    const candidates = rooms
      .map(r => this.rooms.get(r.id))
      .filter(r => r && !r.locked);
    let filtered = candidates;
    if (preferredTags && preferredTags.length) {
      filtered = candidates.filter(r => preferredTags.some(t => r.tags.includes(t)));
    }
    const target = (filtered[0] || candidates[0]) || null;
    if (!target) return null;
    return target;
  }

  /**
   * Join a room
   */
  joinRoom(roomId, socketId, password = null) {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    // Check if user is banned
    if (room.banned.has(socketId)) {
      return { success: false, error: 'You are banned from this room' };
    }

    // Check if room is locked and password is correct
    if (room.locked) {
      if (!password) {
        return { success: false, error: 'Room is locked, password required' };
      }
      const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
      if (passwordHash !== room.passwordHash) {
        return { success: false, error: 'Incorrect password' };
      }
    }

    // Check if user is currently kicked
    const kickedData = this.kickedUsers.get(socketId);
    if (kickedData && kickedData.roomId === roomId) {
      const timeSinceKick = Date.now() - kickedData.kickedAt;
      if (timeSinceKick < this.kickTimeout) {
        return { success: false, error: 'You are temporarily kicked from this room' };
      }
    }

    // Assign anonymous name if not already assigned
    let anonName = this.userSessions.get(socketId)?.anonName;
    if (!anonName) {
      anonName = this.getNextAnonymousName();
    }

    // Update user session
    this.userSessions.set(socketId, {
      anonName,
      currentRoom: roomId
    });

    // Add user to room
    room.users.set(socketId, { anonName, joinedAt: new Date() });

    return {
      success: true,
      room: {
        id: room.id,
        name: room.name,
        tags: room.tags,
        locked: room.locked,
        userCount: room.users.size
      },
      assignedName: anonName,
      users: Array.from(room.users.values())
    };
  }

  /**
   * Leave a room
   */
  leaveRoom(socketId) {
    const userSession = this.userSessions.get(socketId);
    if (!userSession || !userSession.currentRoom) {
      return { success: false, error: 'Not in any room' };
    }

    const room = this.rooms.get(userSession.currentRoom);
    if (room) {
      room.users.delete(socketId);
      
      // Clean up empty rooms after 5 minutes
      if (room.users.size === 0) {
        setTimeout(() => {
          if (room.users.size === 0) {
            this.rooms.delete(room.id);
          }
        }, 300000); // 5 minutes
      }
    }

    this.userSessions.delete(socketId);
    return { success: true };
  }

  /**
   * Ban a user from a room
   */
  banUser(roomId, targetSocketId, adminSocketId) {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    if (room.ownerSocketId !== adminSocketId) {
      return { success: false, error: 'Only room owner can ban users' };
    }

    const targetUser = room.users.get(targetSocketId);
    if (!targetUser) {
      return { success: false, error: 'User not in room' };
    }

    // Add to banned list
    room.banned.add(targetSocketId);
    
    // Remove from room
    room.users.delete(targetSocketId);

    return { success: true, bannedUser: targetUser.anonName };
  }

  /**
   * Kick a user from a room
   */
  kickUser(roomId, targetSocketId, adminSocketId) {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    if (room.ownerSocketId !== adminSocketId) {
      return { success: false, error: 'Only room owner can kick users' };
    }

    const targetUser = room.users.get(targetSocketId);
    if (!targetUser) {
      return { success: false, error: 'User not in room' };
    }

    // Remove from room
    room.users.delete(targetSocketId);
    
    // Add to kicked list with timestamp
    this.kickedUsers.set(targetSocketId, {
      roomId,
      kickedAt: Date.now()
    });

    // Clear kicked status after timeout
    setTimeout(() => {
      this.kickedUsers.delete(targetSocketId);
    }, this.kickTimeout);

    return { success: true, kickedUser: targetUser.anonName };
  }

  /**
   * Add message to room
   */
  addMessage(roomId, socketId, text, clientTempId = null) {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    const user = room.users.get(socketId);
    if (!user) {
      return { success: false, error: 'User not in room' };
    }

    const message = {
      id: crypto.randomBytes(8).toString('hex'),
      from: user.anonName,
      text: this.escapeHtml(text),
      timestamp: new Date(),
      socketId,
      clientTempId: clientTempId || undefined
    };

    room.messages.push(message);
    
    // Keep only last 100 messages per room
    if (room.messages.length > 100) {
      room.messages = room.messages.slice(-100);
    }

    return { success: true, message };
  }

  /**
   * Add speech transcript item
   */
  addTranscript(roomId, socketId, transcript, detectedLang) {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, error: 'Room not found' };
    }
    const user = room.users.get(socketId);
    if (!user) {
      return { success: false, error: 'User not in room' };
    }
    const item = {
      id: crypto.randomBytes(8).toString('hex'),
      from: user.anonName,
      socketId,
      transcript,
      detectedLang: detectedLang || null,
      timestamp: new Date()
    };
    room.transcripts.push(item);
    if (room.transcripts.length > 200) {
      room.transcripts = room.transcripts.slice(-200);
    }
    return { success: true, item };
  }

  /**
   * Get room messages
   */
  getRoomMessages(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) {
      return [];
    }
    return room.messages;
  }

  /**
   * Get room by ID
   */
  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  /**
   * Get user's current room
   */
  getUserRoom(socketId) {
    const userSession = this.userSessions.get(socketId);
    if (!userSession) return null;
    return this.rooms.get(userSession.currentRoom);
  }

  /**
   * Check if user is room owner
   */
  isRoomOwner(roomId, socketId) {
    const room = this.rooms.get(roomId);
    return room && room.ownerSocketId === socketId;
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = { innerHTML: '' };
    div.innerHTML = text;
    return div.innerHTML
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Clean up disconnected user
   */
  cleanupUser(socketId) {
    const userSession = this.userSessions.get(socketId);
    if (userSession && userSession.currentRoom) {
      const room = this.rooms.get(userSession.currentRoom);
      if (room) {
        room.users.delete(socketId);
      }
    }
    this.userSessions.delete(socketId);
    this.kickedUsers.delete(socketId);
  }

  /**
   * Get all unique tags across all rooms
   */
  getAllTags() {
    const tagSet = new Set();
    this.rooms.forEach(room => {
      room.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet);
  }
}

// Export singleton instance
export default new RoomManager();
