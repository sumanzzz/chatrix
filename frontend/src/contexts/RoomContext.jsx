import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSocket } from './SocketContext';

const RoomContext = createContext();

export const useRoom = () => {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRoom must be used within a RoomProvider');
  }
  return context;
};

export const RoomProvider = ({ children }) => {
  const socket = useSocket();
  const [rooms, setRooms] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load rooms and tags on mount
  useEffect(() => {
    if (socket) {
      loadRooms();
      loadTags();
    }
  }, [socket]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleRoomUpdate = (data) => {
      if (data.rooms) setRooms(data.rooms);
      if (data.room) setRooms(prev => prev.map(r => r.id === data.room.id ? data.room : r));
    };

    const handleUserJoined = (data) => {
      setRooms(prev => 
        prev.map(room => 
          room.id === data.roomId 
            ? { ...room, userCount: data.users.length }
            : room
        )
      );
    };

    const handleUserLeft = (data) => {
      setRooms(prev => 
        prev.map(room => 
          room.id === data.roomId 
            ? { ...room, userCount: Math.max(0, room.userCount - 1) }
            : room
        )
      );
    };

    socket.on('room_list', handleRoomUpdate);
    socket.on('room_update', handleRoomUpdate);
    socket.on('user_joined', handleUserJoined);
    socket.on('user_left', handleUserLeft);

    return () => {
      socket.off('room_list', handleRoomUpdate);
      socket.off('room_update', handleRoomUpdate);
      socket.off('user_joined', handleUserJoined);
      socket.off('user_left', handleUserLeft);
    };
  }, [socket]);

  const loadRooms = async (filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      socket.emit('get_rooms', filters, (response) => {
        if (response.success) {
          setRooms(response.rooms);
        } else {
          setError(response.error);
        }
        setLoading(false);
      });
    } catch (err) {
      setError('Failed to load rooms');
      setLoading(false);
    }
  };

  const loadTags = async () => {
    try {
      socket.emit('get_tags', (response) => {
        if (response.success) {
          setTags(response.tags);
        }
      });
    } catch (err) {
      console.error('Failed to load tags:', err);
    }
  };

  const createRoom = (roomData) => {
    return new Promise((resolve, reject) => {
      socket.emit('create_room', roomData, (response) => {
        if (response.success) {
          resolve(response.room);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  };

  const joinRoom = (roomId, password = null) => {
    return new Promise((resolve, reject) => {
      socket.emit('join_room', { roomId, password }, (response) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error));
        }
      });
    });
  };

  const leaveRoom = () => {
    return new Promise((resolve, reject) => {
      socket.emit('leave_room', {}, (response) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error));
        }
      });
    });
  };

  const value = {
    rooms,
    tags,
    loading,
    error,
    loadRooms,
    loadTags,
    createRoom,
    joinRoom,
    leaveRoom
  };

  return (
    <RoomContext.Provider value={value}>
      {children}
    </RoomContext.Provider>
  );
};
