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
      <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center">
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
          <div className="min-h-screen bg-white">
            {/* Accessible Sticky Navbar */}
            <header className="sticky top-0 z-40 bg-chatrix-primary border-b-2 border-chatrix-border">
              <nav className="container mx-auto px-4 py-4" aria-label="Main">
                <div className="flex items-center justify-between">
                  <button
                    className="text-2xl font-bold text-white"
                    onClick={handleBackToRooms}
                    aria-label="Go to rooms list"
                  >
                    Chatrix
                  </button>
                  <div className="flex items-center gap-2" role="tablist" aria-label="Views">
                    <button
                      role="tab"
                      aria-selected={currentView === 'rooms'}
                      onClick={handleBackToRooms}
                      className={`chatrix-button-secondary bg-white text-chatrix-primary border-chatrix-primary ${currentView === 'rooms' ? '' : ''}`}
                    >
                      Rooms
                    </button>
                    <button
                      role="tab"
                      aria-selected={currentView === 'create'}
                      onClick={handleCreateRoom}
                      className={`chatrix-button-secondary bg-white text-chatrix-primary border-chatrix-primary ${currentView === 'create' ? '' : ''}`}
                    >
                      Create
                    </button>
                    {currentView === 'chat' && (
                      <button
                        role="tab"
                        aria-selected
                        onClick={handleLeaveRoom}
                        className="chatrix-button bg-white text-chatrix-primary border-chatrix-primary"
                      >
                        Leave Room
                      </button>
                    )}
                  </div>
                </div>
              </nav>
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

          </div>
          </VoiceProvider>
        </RoomProvider>
      </ToasterProvider>
    </SocketProvider>
  );
};

export default App;
