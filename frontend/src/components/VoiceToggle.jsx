import React, { useState } from 'react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { useVoice } from '../contexts/VoiceContext';
import { useSocket } from '../contexts/SocketContext';
import { useToaster } from './Toaster';

const VoiceToggle = () => {
  const { 
    isVoiceEnabled, 
    isMuted, 
    isConnecting, 
    initializeVoice, 
    stopVoice, 
    toggleMute 
  } = useVoice();
  const socket = useSocket();
  const { push } = useToaster();
  const [recognition, setRecognition] = useState(null);
  const [showVolumeControls, setShowVolumeControls] = useState(false);

  const handleToggleVoice = async () => {
    if (isVoiceEnabled) {
      if (recognition) { try { recognition.stop(); } catch(e){} }
      stopVoice();
    } else {
      try {
        await initializeVoice();
        // Start Web Speech API
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
          push('Speech recognition not available', 'warning');
          return;
        }
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = navigator.language || 'en-US';
        let lastResultTime = Date.now();
        rec.onresult = (event) => {
          let finalText = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const res = event.results[i];
            if (res.isFinal) finalText += res[0].transcript;
          }
          if (finalText.trim().length > 0) {
            // Emit transcript to server
            const currentRoomId = window.currentRoomId;
            if (!currentRoomId) return;
            socket.emit('speech_transcript', {
              roomId: currentRoomId,
              transcript: finalText.trim(),
              detectedLang: rec.lang
            }, (ack) => {
              if (!ack?.success) {
                push('Transcript failed to send', 'warning');
              }
            });
            lastResultTime = Date.now();
          }
        };
        rec.onerror = () => {};
        rec.onend = () => {
          // Auto-restart if voice is still enabled
          if (isVoiceEnabled && window.currentRoomId) {
            try { rec.start(); } catch(e){}
          }
        };
        rec.start();
        setRecognition(rec);
      } catch (error) {
        console.error('Failed to initialize voice:', error);
        push('Microphone permission required', 'error');
      }
    }
  };

  const handleToggleMute = () => {
    if (isVoiceEnabled) {
      toggleMute();
    }
  };

  return (
    <div className="relative">
      {/* Main Voice Toggle Button */}
      <button
        onClick={handleToggleVoice}
        disabled={isConnecting}
        className={`chatrix-button p-2 ${
          isVoiceEnabled 
            ? 'bg-green-600 hover:bg-green-700 border-green-400' 
            : 'bg-chatrix-darker-red hover:bg-chatrix-light-red'
        } ${isConnecting ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={isVoiceEnabled ? 'Disable voice chat' : 'Enable voice chat'}
      >
        {isConnecting ? (
          <div className="spinner w-4 h-4"></div>
        ) : isVoiceEnabled ? (
          <Mic className="w-4 h-4" />
        ) : (
          <MicOff className="w-4 h-4" />
        )}
      </button>

      {/* Mute/Unmute Button (only show when voice is enabled) */}
      {isVoiceEnabled && (
        <button
          onClick={handleToggleMute}
          className={`chatrix-button p-2 ml-2 ${
            isMuted 
              ? 'bg-red-600 hover:bg-red-700 border-red-400' 
              : 'bg-green-600 hover:bg-green-700 border-green-400'
          }`}
          title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </button>
      )}

      {/* Voice Status Indicator */}
      {isVoiceEnabled && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-chatrix-darker-red border border-chatrix-border rounded px-2 py-1 text-xs text-chatrix-text whitespace-nowrap">
          {isMuted ? 'Muted' : 'Speaking'}
        </div>
      )}

      {/* Volume Controls (placeholder for future implementation) */}
      {showVolumeControls && isVoiceEnabled && (
        <div className="absolute top-full left-0 mt-2 chatrix-card p-3 w-48">
          <div className="space-y-2">
            <label className="text-sm text-chatrix-text">Microphone Volume</label>
            <input
              type="range"
              min="0"
              max="100"
              defaultValue="80"
              className="w-full"
            />
            <label className="text-sm text-chatrix-text">Speaker Volume</label>
            <input
              type="range"
              min="0"
              max="100"
              defaultValue="80"
              className="w-full"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceToggle;
