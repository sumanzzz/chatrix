import React from 'react';
import { User, Clock } from 'lucide-react';

const MessageList = ({ messages, currentUser }) => {
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const groupMessagesByDate = (messages) => {
    const groups = {};
    messages.forEach(message => {
      const date = new Date(message.timestamp).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="space-y-4">
      {Object.entries(messageGroups).map(([date, dateMessages]) => (
        <div key={date}>
          {/* Date Separator */}
          <div className="flex items-center justify-center my-4">
            <div className="bg-chatrix-darker border border-chatrix-border rounded-full px-3 py-1">
              <span className="text-chatrix-text text-sm font-medium">
                {formatDate(dateMessages[0].timestamp)}
              </span>
            </div>
          </div>

          {/* Messages for this date */}
          <div className="space-y-2">
            {dateMessages.map((message, index) => {
              const isCurrentUser = message.from === currentUser;
              const isSystem = message.isSystem;
              const showAvatar = index === 0 || 
                dateMessages[index - 1].from !== message.from ||
                new Date(message.timestamp) - new Date(dateMessages[index - 1].timestamp) > 300000; // 5 minutes

              if (isSystem) {
                return (
                  <div key={message.id} className="text-center">
                    <div className="chatrix-notification inline-block text-xs">
                      {message.text}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={message.id}
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  <div className={`flex max-w-[70%] ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar */}
                    {showAvatar && !isCurrentUser && (
                      <div className="flex-shrink-0 mr-2">
                        <div className="w-8 h-8 bg-chatrix-darker border border-chatrix-border rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-chatrix-text" />
                        </div>
                      </div>
                    )}

                    {/* Message Content */}
                    <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                      {/* Username */}
                      {showAvatar && (
                        <div className="text-xs text-chatrix-text text-opacity-70 mb-1 px-2">
                          {message.from}
                          {isCurrentUser && ' (You)'}
                        </div>
                      )}

                      {/* Message Bubble */}
                      <div
                        className={`chatrix-message ${
                          isCurrentUser
                            ? 'bg-chatrix-primary-dark border-chatrix-border'
                            : 'bg-chatrix-primary border-chatrix-border'
                        } ${
                          showAvatar ? 'mt-0' : 'mt-1'
                        }`}
                      >
                        <div className="text-chatrix-text whitespace-pre-wrap break-words">
                          {message.text}
                        </div>
                      </div>

                      {/* Timestamp */}
                      <div className={`text-xs text-chatrix-text text-opacity-50 mt-1 px-2 ${
                        isCurrentUser ? 'text-right' : 'text-left'
                      }`}>
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTime(message.timestamp)}
                        </div>
                      </div>
                    </div>

                    {/* Avatar for current user */}
                    {showAvatar && isCurrentUser && (
                      <div className="flex-shrink-0 ml-2">
                        <div className="w-8 h-8 bg-chatrix-text text-chatrix-darker-red border border-chatrix-border rounded-full flex items-center justify-center font-bold text-sm">
                          {message.from.charAt(message.from.length - 1)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Empty State */}
      {messages.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">💬</div>
          <h3 className="text-lg font-semibold text-chatrix-text mb-2">
            No messages yet
          </h3>
          <p className="text-chatrix-text text-opacity-70">
            Be the first to send a message in this room!
          </p>
        </div>
      )}
    </div>
  );
};

export default MessageList;
