import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff, Users, Settings, Download, Ban, UserX } from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';
import { useVoice } from '../contexts/VoiceContext';
import { useToaster } from './Toaster';
import MessageList from './MessageList';
import UserList from './UserList';
import VoiceToggle from './VoiceToggle';
import AdminControls from './AdminControls';
import TranscriptSideBubble from './TranscriptSideBubble';
import BottomGuide from './BottomGuide';

const ChatRoom = ({ room, userName, onLeaveRoom }) => {
  const socket = useSocket();
  const { isVoiceEnabled, initializeVoice, stopVoice } = useVoice();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const { push } = useToaster();
  const [users, setUsers] = useState([]);
  const [isOwner, setIsOwner] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const [showAdminControls, setShowAdminControls] = useState(false);
  const [roomInfo, setRoomInfo] = useState(room);
  const messagesEndRef = useRef(null);
  const [transcripts, setTranscripts] = useState([]);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (data) => {
      if (data.roomId === room.id) {
        setMessages(prev => {
          // If we have an optimistic message with temp id, replace it
          const idx = prev.findIndex(m => m.id && data.message.clientTempId && m.id === data.message.clientTempId);
          if (idx !== -1) {
            const clone = prev.slice();
            clone[idx] = data.message;
            return clone;
          }
          // Avoid duplicates (same id already present)
          if (prev.some(m => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
      }
    };

    const handleUserJoined = (data) => {
      if (data.roomId === room.id) {
        // Append system message and refresh room state separately
        setMessages(prev => [...prev, {
          id: `system-${Date.now()}`,
          from: 'system',
          text: `${data.user.anonName} joined the room`,
          timestamp: new Date(),
          isSystem: true
        }]);
        // Refresh user list
        socket.emit('get_room_state', { roomId: room.id }, (info) => {
          if (info?.success) {
            setUsers(info.room.users);
          }
        });
      }
    };

    const handleUserLeft = (data) => {
      if (data.roomId === room.id) {
        setMessages(prev => [...prev, {
          id: `system-${Date.now()}`,
          from: 'system',
          text: `${data.user.anonName} left the room`,
          timestamp: new Date(),
          isSystem: true
        }]);
        // Refresh user list
        socket.emit('get_room_state', { roomId: room.id }, (info) => {
          if (info?.success) {
            setUsers(info.room.users);
          }
        });
      }
    };

    const handleUserKicked = (data) => {
      if (data.roomId === room.id) {
        setMessages(prev => [...prev, {
          id: `system-${Date.now()}`,
          from: 'system',
          text: `${data.user} was kicked from the room`,
          timestamp: new Date(),
          isSystem: true
        }]);
      }
    };

    const handleUserBanned = (data) => {
      if (data.roomId === room.id) {
        setMessages(prev => [...prev, {
          id: `system-${Date.now()}`,
          from: 'system',
          text: `${data.user} was banned from the room`,
          timestamp: new Date(),
          isSystem: true
        }]);
      }
    };

    const handleRoomMessages = (data) => {
      if (data.roomId === room.id) {
        setMessages(data.messages);
      }
    };

    const handleTranscript = (data) => {
      if (data.roomId === room.id) {
        setTranscripts(prev => [data.transcript, ...prev].slice(0, 50));
      }
    };

    const handleKicked = (data) => {
      if (data.roomId === room.id) {
        push(`You were kicked: ${data.reason}`, 'warning');
        onLeaveRoom();
      }
    };

    const handleBanned = (data) => {
      if (data.roomId === room.id) {
        push(`You were banned: ${data.reason}`, 'error');
        onLeaveRoom();
      }
    };

    const handleRoomInfo = (data) => {
      if (data.success) {
        setRoomInfo(data.room);
        setUsers(data.room.users);
        setIsOwner(data.room.isOwner);
      }
    };

    // Set up event listeners
    socket.on('message', handleMessage);
    socket.on('user_joined', handleUserJoined);
    socket.on('user_left', handleUserLeft);
    socket.on('user_kicked', handleUserKicked);
    socket.on('user_banned', handleUserBanned);
    socket.on('room_messages', handleRoomMessages);
    socket.on('kicked', handleKicked);
    socket.on('banned', handleBanned);
    socket.on('speech_transcript_broadcast', handleTranscript);

    // Get room state according to contract
    socket.emit('get_room_state', { roomId: room.id }, handleRoomInfo);

    return () => {
      socket.off('message', handleMessage);
      socket.off('user_joined', handleUserJoined);
      socket.off('user_left', handleUserLeft);
      socket.off('user_kicked', handleUserKicked);
      socket.off('user_banned', handleUserBanned);
      socket.off('room_messages', handleRoomMessages);
      socket.off('kicked', handleKicked);
      socket.off('banned', handleBanned);
      socket.off('speech_transcript_broadcast', handleTranscript);
    };
  }, [socket, room.id, onLeaveRoom]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const optimistic = {
      id: `temp-${Date.now()}`,
      from: userName,
      text: newMessage.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, optimistic]);

    socket.emit('send_message', { roomId: room.id, text: newMessage.trim(), clientTempId: optimistic.id }, (response) => {
      if (!response?.success) {
        // remove optimistic and notify
        setMessages(prev => prev.filter(m => m.id !== optimistic.id));
        push(response?.error || 'Failed to send message', 'error');
      } else {
        // replace optimistic with server message
        setMessages(prev => prev.map(m => m.id === optimistic.id ? response.message : m));
      }
    });

    setNewMessage('');
  };

  const handleDownloadTranscript = () => {
    const transcript = {
      roomName: room.name,
      exportedAt: new Date().toISOString(),
      messages: messages.map(msg => ({
        from: msg.from,
        text: msg.text,
        timestamp: msg.timestamp,
        isSystem: msg.isSystem
      }))
    };

    const blob = new Blob([JSON.stringify(transcript, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chatrix-${room.name}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleLeaveRoom = () => {
    socket.emit('leave_room', { roomId: room.id }, (response) => {
      if (response.success) {
        onLeaveRoom();
      } else {
        push(response.error || 'Failed to leave room', 'error');
      }
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] max-w-6xl mx-auto">
      {/* Room Header */}
      <div className="chatrix-card p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-chatrix-text mb-1">
              {room.name}
            </h2>
            <div className="flex items-center space-x-4 text-sm text-chatrix-text text-opacity-70">
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                {users.length} user{users.length !== 1 ? 's' : ''}
              </div>
              {room.tags.length > 0 && (
                <div className="flex items-center">
                  {room.tags.map((tag, index) => (
                    <span key={index} className="chatrix-tag text-xs mr-1">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Voice Toggle */}
            <VoiceToggle />
            
            {/* User List Toggle */}
            <button
              onClick={() => setShowUserList(!showUserList)}
              className="chatrix-button-secondary p-2"
              title="Toggle user list"
            >
              <Users className="w-4 h-4" />
            </button>
            
            {/* Admin Controls */}
            {isOwner && (
              <button
                onClick={() => setShowAdminControls(!showAdminControls)}
                className="chatrix-button-secondary p-2"
                title="Admin controls"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
            
            {/* Download Transcript */}
            <button
              onClick={handleDownloadTranscript}
              className="chatrix-button-secondary p-2"
              title="Download transcript"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 gap-4">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 chatrix-card p-4 mb-4 overflow-y-auto">
            <MessageList messages={messages} currentUser={userName} />
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="chatrix-input flex-1"
              maxLength={1000}
            />
            <button
              type="submit"
              className="chatrix-button px-6"
              disabled={!newMessage.trim()}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Sidebar */}
        <div className="w-80 space-y-4">
          {/* User List */}
          {showUserList && (
            <UserList users={users} currentUser={userName} isOwner={isOwner} />
          )}

          {/* Admin Controls */}
          {showAdminControls && isOwner && (
            <AdminControls roomId={room.id} users={users} />
          )}

          {/* Transcript Side Bubbles */}
          <div className="chatrix-card p-4">
            <h3 className="text-sm font-semibold mb-2">Live Transcripts</h3>
            {transcripts.length === 0 ? (
              <div className="text-xs opacity-70">No live transcripts yet</div>
            ) : (
              transcripts.map(item => (
                <TranscriptSideBubble key={item.id} item={item} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
