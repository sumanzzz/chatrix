import React from 'react';
import { User, Crown, Mic, MicOff } from 'lucide-react';

const UserList = ({ users, currentUser, isOwner }) => {
  const getInitials = (username) => {
    return username.charAt(username.length - 1).toUpperCase();
  };

  const isVoiceEnabled = (user) => {
    // This would be determined by voice context in a real implementation
    return false;
  };

  return (
    <div className="chatrix-card p-4">
      <h3 className="text-lg font-semibold text-chatrix-text mb-4 flex items-center">
        <User className="w-5 h-5 mr-2" />
        Users ({users.length})
      </h3>
      
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {users.map((user, index) => {
          const isCurrentUser = user.anonName === currentUser;
          const isAdmin = isOwner && index === 0; // First user is admin in this implementation
          
          return (
            <div
              key={user.anonName}
              className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                isCurrentUser 
                  ? 'bg-chatrix-darker-red border border-chatrix-text' 
                  : 'hover:bg-chatrix-darker-red'
              }`}
            >
              <div className="flex items-center space-x-3">
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  isCurrentUser
                    ? 'bg-chatrix-text text-chatrix-darker-red'
                    : 'bg-chatrix-darker-red text-chatrix-text'
                }`}>
                  {getInitials(user.anonName)}
                </div>

                {/* Username and Status */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium truncate ${
                      isCurrentUser ? 'text-chatrix-text' : 'text-chatrix-text'
                    }`}>
                      {user.anonName}
                    </span>
                    
                    {/* Admin Badge */}
                    {isAdmin && (
                      <Crown className="w-4 h-4 text-yellow-400" title="Room Owner" />
                    )}
                    
                    {/* Current User Badge */}
                    {isCurrentUser && (
                      <span className="text-xs bg-chatrix-text text-chatrix-darker-red px-2 py-0.5 rounded-full">
                        You
                      </span>
                    )}
                  </div>
                  
                  {/* Voice Status */}
                  <div className="flex items-center space-x-1 mt-1">
                    {isVoiceEnabled(user) ? (
                      <>
                        <Mic className="w-3 h-3 text-green-400" />
                        <span className="text-xs text-green-400">Speaking</span>
                      </>
                    ) : (
                      <>
                        <MicOff className="w-3 h-3 text-chatrix-text text-opacity-50" />
                        <span className="text-xs text-chatrix-text text-opacity-50">Muted</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Join Time */}
              <div className="text-xs text-chatrix-text text-opacity-50">
                {user.joinedAt ? 
                  new Date(user.joinedAt).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  }) : 
                  'Now'
                }
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {users.length === 0 && (
        <div className="text-center py-4">
          <div className="text-2xl mb-2">👥</div>
          <p className="text-chatrix-text text-opacity-70 text-sm">
            No users in this room
          </p>
        </div>
      )}
    </div>
  );
};

export default UserList;
