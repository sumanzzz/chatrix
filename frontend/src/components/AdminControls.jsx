import React, { useState } from 'react';
import { Ban, UserX, Shield, AlertTriangle } from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';
import { useToaster } from './Toaster';

const AdminControls = ({ roomId, users }) => {
  const socket = useSocket();
  const { push } = useToaster();
  const [selectedUser, setSelectedUser] = useState(null);
  const [showKickModal, setShowKickModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const handleKickUser = (user) => {
    setSelectedUser(user);
    setShowKickModal(true);
  };

  const handleBanUser = (user) => {
    setSelectedUser(user);
    setShowBanModal(true);
  };

  const confirmKick = async () => {
    if (!selectedUser) return;
    
    setActionLoading(true);
    
    socket.emit('kick_user', {
      roomId,
      targetSocketId: selectedUser.socketId || selectedUser.anonName
    }, (response) => {
      setActionLoading(false);
      if (response.success) {
        setShowKickModal(false);
        setSelectedUser(null);
      } else {
        push(`Failed to kick user: ${response.error}`, 'error');
      }
    });
  };

  const confirmBan = async () => {
    if (!selectedUser) return;
    
    setActionLoading(true);
    
    socket.emit('ban_user', {
      roomId,
      targetSocketId: selectedUser.socketId || selectedUser.anonName
    }, (response) => {
      setActionLoading(false);
      if (response.success) {
        setShowBanModal(false);
        setSelectedUser(null);
      } else {
        push(`Failed to ban user: ${response.error}`, 'error');
      }
    });
  };

  const getInitials = (username) => {
    return username.charAt(username.length - 1).toUpperCase();
  };

  return (
    <>
      <div className="chatrix-card p-4">
        <h3 className="text-lg font-semibold text-chatrix-text mb-4 flex items-center">
          <Shield className="w-5 h-5 mr-2" />
          Admin Controls
        </h3>
        
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {users.map((user, index) => {
            // Don't show admin controls for the first user (room owner)
            if (index === 0) return null;
            
            return (
              <div
                key={user.anonName}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-chatrix-darker-red transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {/* Avatar */}
                  <div className="w-8 h-8 bg-chatrix-darker-red text-chatrix-text rounded-full flex items-center justify-center text-sm font-bold">
                    {getInitials(user.anonName)}
                  </div>

                  {/* Username */}
                  <span className="text-sm font-medium text-chatrix-text">
                    {user.anonName}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleKickUser(user)}
                    className="p-1 text-yellow-400 hover:bg-yellow-400 hover:text-chatrix-darker-red rounded transition-colors"
                    title="Kick user (temporary)"
                  >
                    <UserX className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => handleBanUser(user)}
                    className="p-1 text-red-400 hover:bg-red-400 hover:text-chatrix-text rounded transition-colors"
                    title="Ban user (permanent)"
                  >
                    <Ban className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {users.length <= 1 && (
          <div className="text-center py-4">
            <div className="text-2xl mb-2">👑</div>
            <p className="text-chatrix-text text-opacity-70 text-sm">
              You're the only one here
            </p>
          </div>
        )}
      </div>

      {/* Kick Confirmation Modal */}
      {showKickModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="chatrix-card p-6 w-full max-w-md mx-4">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-400 mr-3" />
              <h3 className="text-xl font-semibold text-chatrix-text">
                Kick User
              </h3>
            </div>
            
            <p className="text-chatrix-text text-opacity-70 mb-6">
              Are you sure you want to kick <strong>{selectedUser.anonName}</strong>? 
              They will be temporarily removed from the room and cannot rejoin for 1 minute.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowKickModal(false);
                  setSelectedUser(null);
                }}
                className="chatrix-button-secondary flex-1"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={confirmKick}
                className="chatrix-button bg-yellow-600 hover:bg-yellow-700 border-yellow-400 flex-1"
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="spinner mr-2"></div>
                    Kicking...
                  </div>
                ) : (
                  'Kick User'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ban Confirmation Modal */}
      {showBanModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="chatrix-card p-6 w-full max-w-md mx-4">
            <div className="flex items-center mb-4">
              <Ban className="w-6 h-6 text-red-400 mr-3" />
              <h3 className="text-xl font-semibold text-chatrix-text">
                Ban User
              </h3>
            </div>
            
            <p className="text-chatrix-text text-opacity-70 mb-6">
              Are you sure you want to ban <strong>{selectedUser.anonName}</strong>? 
              They will be permanently removed from the room and cannot rejoin.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowBanModal(false);
                  setSelectedUser(null);
                }}
                className="chatrix-button-secondary flex-1"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={confirmBan}
                className="chatrix-button bg-red-600 hover:bg-red-700 border-red-400 flex-1"
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="spinner mr-2"></div>
                    Banning...
                  </div>
                ) : (
                  'Ban User'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminControls;
