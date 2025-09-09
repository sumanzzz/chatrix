import React, { useState, useEffect } from 'react';
import { Search, Users, Lock, Tag, Plus } from 'lucide-react';
import { useRoom } from '../contexts/RoomContext';
import { useSocket } from '../contexts/SocketContext';
import { useToaster } from './Toaster';
import RoomFilters from './RoomFilters';

const RoomList = ({ onJoinRoom }) => {
  const { rooms, loading, error, loadRooms } = useRoom();
  const socket = useSocket();
  const { push } = useToaster();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [password, setPassword] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const t = setTimeout(() => {
      loadRooms({ search: searchTerm, tags: selectedTags });
    }, 150);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [searchTerm, selectedTags, loadRooms]);

  const handleJoinRoom = async (room) => {
    if (room.locked) {
      setSelectedRoom(room);
      setShowPasswordModal(true);
    } else {
      try {
        socket.emit('join_room', { roomId: room.id }, (result) => {
          if (result.success) {
            onJoinRoom(result.room, result.assignedName);
          } else {
            push(result.error || 'Failed to join room', 'error');
          }
        });
      } catch (error) {
        push(`Failed to join room: ${error.message}`, 'error');
      }
    }
  };

  const handlePasswordSubmit = async () => {
    if (!selectedRoom) return;
    
    try {
      socket.emit('join_room', { roomId: selectedRoom.id, password }, (result) => {
        if (result.success) {
          setShowPasswordModal(false);
          setPassword('');
          setSelectedRoom(null);
          onJoinRoom(result.room, result.assignedName);
        } else {
          push(result.error || 'Failed to join room', 'error');
        }
      });
    } catch (error) {
      push(`Failed to join room: ${error.message}`, 'error');
    }
  };

  const handleQuickJoin = () => {
    socket.emit('quick_join', { tags: selectedTags }, (ack) => {
      if (ack.success) {
        socket.emit('join_room', { roomId: ack.roomId }, (res) => {
          if (res.success) {
            onJoinRoom(res.room, res.assignedName);
          } else {
            push(res.error || 'Failed to quick join', 'error');
          }
        });
      } else {
        push(ack.reason || 'No open rooms available', 'warning');
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-chatrix-text">Loading rooms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Join a Chat Room
        </h2>
        <p className="text-gray-700">
          Choose from {rooms.length} available rooms or create your own
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-chatrix-border w-5 h-5" />
            <input
              type="text"
              placeholder="Search rooms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="chatrix-input w-full pl-10"
            />
          </div>
        </div>

        {/* Filters */}
        <RoomFilters
          selectedTags={selectedTags}
          onTagsChange={setSelectedTags}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="chatrix-notification mb-6">
          {error}
        </div>
      )}

      {/* Rooms Grid with 3D doors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {rooms.map((room) => (
          <div
            key={room.id}
            className={`chatrix-room-card`}
            onClick={() => handleJoinRoom(room)}
          >
            {/* Door number badge */}
            <div className="absolute -mt-2 -ml-2 bg-[#1a1a1a] border border-white/20 text-xs px-2 py-1 rounded-full">#{rooms.indexOf(room) + 1}</div>
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-semibold text-chatrix-text truncate">
                {room.name}
              </h3>
              <div className="flex items-center space-x-2">
                {room.locked && (
                  <Lock className="w-4 h-4 text-chatrix-border" />
                )}
                <div className="flex items-center text-sm text-chatrix-text">
                  <Users className="w-4 h-4 mr-1" />
                  {room.userCount}
                </div>
              </div>
            </div>

            {/* Tags */}
            {room.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {room.tags.map((tag, index) => (
                  <span key={index} className="chatrix-tag">
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Room Info */}
            <div className="text-sm text-chatrix-text text-opacity-70">
              Created {new Date(room.createdAt).toLocaleDateString()}
            </div>

            {/* Join / Quick Join Buttons */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button className="chatrix-button w-full" onClick={(e) => { e.stopPropagation(); handleJoinRoom(room); }}>
                Join
              </button>
              <button className="chatrix-button-secondary w-full" onClick={(e) => { e.stopPropagation(); handleQuickJoin(); }}>
                Quick Join
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {rooms.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-xl font-semibold text-chatrix-text mb-2">
            No rooms found
          </h3>
          <p className="text-chatrix-text text-opacity-70 mb-6">
            {searchTerm || selectedTags.length > 0
              ? 'Try adjusting your search or filters'
              : 'Be the first to create a room!'}
          </p>
          <button className="chatrix-button">
            <Plus className="w-5 h-5 mr-2" />
            Create Room
          </button>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && selectedRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="chatrix-card p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-semibold text-chatrix-text mb-4">
              Enter Room Password
            </h3>
            <p className="text-chatrix-text text-opacity-70 mb-4">
              This room is locked. Please enter the password to join.
            </p>
            <input
              type="password"
              placeholder="Room password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="chatrix-input w-full mb-4"
              onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
              autoFocus
            />
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPassword('');
                  setSelectedRoom(null);
                }}
                className="chatrix-button-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordSubmit}
                className="chatrix-button flex-1"
              >
                Join Room
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomList;
