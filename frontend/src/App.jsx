import React, { useState, useEffect } from 'react';
import { createSocket } from './socket';
import RoomList from './components/RoomList';
import CreateRoom from './components/CreateRoom';
import ChatRoom from './components/ChatRoom';
import { SocketProvider } from './contexts/SocketContext';
import { RoomProvider } from './contexts/RoomContext';
import { VoiceProvider } from './contexts/VoiceContext';
import { ToasterProvider } from './components/Toaster';

const App = () => {
  const [socket, setSocket] = useState(null);
  const [currentView, setCurrentView] = useState('rooms'); // 'rooms', 'create', 'chat'
  const [currentRoom, setCurrentRoom] = useState(null);
  const [userName, setUserName] = useState(null);

  useEffect(() => {
    // Initialize socket connection
    const { socket: newSocket } = createSocket();

    newSocket.on('connect', () => {
      console.log('Connected to server:', newSocket.id);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const handleJoinRoom = (room, assignedName) => {
    setCurrentRoom(room);
    setUserName(assignedName);
    setCurrentView('chat');
  };

  const handleLeaveRoom = () => {
    setCurrentRoom(null);
    setUserName(null);
    setCurrentView('rooms');
  };

  const handleCreateRoom = () => {
    setCurrentView('create');
  };

  const handleBackToRooms = () => {
    setCurrentView('rooms');
  };

  if (!socket) {
    return (
      <div className="min-h-screen bg-chatrix-red flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-chatrix-text text-lg">Connecting to Chatrix...</p>
        </div>
      </div>
    );
  }

  return (
    <SocketProvider socket={socket}>
      <ToasterProvider>
        <RoomProvider>
          <VoiceProvider>
          <div className="min-h-screen bg-chatrix-red">
            {/* Header */}
            <header className="bg-chatrix-darker-red border-b-2 border-chatrix-border">
              <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold text-chatrix-text">
                    Chatrix
                  </h1>
                  <div className="flex items-center space-x-4">
                    {currentView === 'chat' && (
                      <button
                        onClick={handleLeaveRoom}
                        className="chatrix-button-secondary"
                      >
                        Leave Room
                      </button>
                    )}
                    {currentView === 'create' && (
                      <button
                        onClick={handleBackToRooms}
                        className="chatrix-button-secondary"
                      >
                        Back to Rooms
                      </button>
                    )}
                    {currentView === 'rooms' && (
                      <button
                        onClick={handleCreateRoom}
                        className="chatrix-button"
                      >
                        Create Room
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-6">
              {currentView === 'rooms' && (
                <RoomList onJoinRoom={handleJoinRoom} />
              )}
              {currentView === 'create' && (
                <CreateRoom onRoomCreated={handleJoinRoom} onBack={handleBackToRooms} />
              )}
              {currentView === 'chat' && currentRoom && (
                <ChatRoom 
                  room={currentRoom} 
                  userName={userName}
                  onLeaveRoom={handleLeaveRoom}
                />
              )}
            </main>

            {/* Footer */}
            <footer className="bg-chatrix-darker-red border-t-2 border-chatrix-border mt-auto">
              <div className="container mx-auto px-4 py-4">
                <p className="text-center text-chatrix-text text-sm">
                  Chatrix - Real-time Anonymous Chatrooms | No signup required
                </p>
              </div>
            </footer>
          </div>
          </VoiceProvider>
        </RoomProvider>
      </ToasterProvider>
    </SocketProvider>
  );
};

export default App;
