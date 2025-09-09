import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { useSocket } from './SocketContext';
import { useToaster } from '../components/Toaster';

const VoiceContext = createContext();

export const useVoice = () => {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
};

export const VoiceProvider = ({ children }) => {
  const socket = useSocket();
  const { push } = useToaster();
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [peers, setPeers] = useState(new Map());
  
  const localStreamRef = useRef(null);
  const peerConnectionsRef = useRef(new Map());

  const initializeVoice = useCallback(async () => {
    try {
      setIsConnecting(true);
      
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: false 
      });
      
      localStreamRef.current = stream;
      setIsVoiceEnabled(true);
      setIsMuted(false);
      
      // Set up WebRTC signaling
      socket.on('webrtc-signal', handleWebRTCSignal);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      push('Microphone permission is required or blocked by the browser.', 'warning');
    } finally {
      setIsConnecting(false);
    }
  }, [socket]);

  const stopVoice = useCallback(() => {
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    // Close all peer connections
    peerConnectionsRef.current.forEach(peer => {
      peer.destroy();
    });
    peerConnectionsRef.current.clear();
    setPeers(new Map());
    
    setIsVoiceEnabled(false);
    setIsMuted(false);
    
    // Remove event listener
    socket.off('webrtc-signal');
  }, [socket]);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const handleWebRTCSignal = useCallback((data) => {
    const { signal, fromSocketId } = data;
    
    // Handle incoming WebRTC signal
    if (signal.type === 'offer') {
      createPeerConnection(fromSocketId, true);
    }
    
    const peer = peerConnectionsRef.current.get(fromSocketId);
    if (peer) {
      peer.signal(signal);
    }
  }, []);

  const createPeerConnection = useCallback((socketId, isInitiator = false) => {
    try {
      // Simple peer-to-peer connection using WebRTC
      const peer = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      // Add local stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          peer.addTrack(track, localStreamRef.current);
        });
      }

      // Handle remote stream
      peer.ontrack = (event) => {
        const [remoteStream] = event.streams;
        setPeers(prev => new Map(prev.set(socketId, remoteStream)));
      };

      // Handle ICE candidates
      peer.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('webrtc-signal', {
            roomId: window.currentRoomId, // use the actual current room id
            signal: {
              type: 'ice-candidate',
              candidate: event.candidate
            },
            targetSocketId: socketId
          });
        }
      };

      // Handle connection state changes
      peer.onconnectionstatechange = () => {
        if (peer.connectionState === 'connected') {
          console.log('Peer connected:', socketId);
        } else if (peer.connectionState === 'disconnected' || 
                   peer.connectionState === 'failed') {
          console.log('Peer disconnected:', socketId);
          setPeers(prev => {
            const newPeers = new Map(prev);
            newPeers.delete(socketId);
            return newPeers;
          });
        }
      };

      peerConnectionsRef.current.set(socketId, peer);

      // Create offer if initiator
      if (isInitiator) {
        peer.createOffer().then(offer => {
          peer.setLocalDescription(offer);
          socket.emit('webrtc-signal', {
            roomId: window.currentRoomId, // use the actual current room id
            signal: offer,
            targetSocketId: socketId
          });
        });
      }

    } catch (error) {
      console.error('Error creating peer connection:', error);
    }
  }, [socket]);

  const connectToPeer = useCallback((socketId) => {
    if (!peerConnectionsRef.current.has(socketId)) {
      createPeerConnection(socketId, true);
    }
  }, [createPeerConnection]);

  const disconnectFromPeer = useCallback((socketId) => {
    const peer = peerConnectionsRef.current.get(socketId);
    if (peer) {
      peer.close();
      peerConnectionsRef.current.delete(socketId);
    }
    
    setPeers(prev => {
      const newPeers = new Map(prev);
      newPeers.delete(socketId);
      return newPeers;
    });
  }, []);

  const value = {
    isVoiceEnabled,
    isMuted,
    isConnecting,
    peers,
    localStream: localStreamRef.current,
    initializeVoice,
    stopVoice,
    toggleMute,
    connectToPeer,
    disconnectFromPeer
  };

  return (
    <VoiceContext.Provider value={value}>
      {children}
    </VoiceContext.Provider>
  );
};
