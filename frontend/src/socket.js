import { io } from 'socket.io-client';

const DEFAULT_TIMEOUT_MS = 5000;
const MAX_RETRIES = 2;

export const createSocket = () => {
  const socket = io(import.meta.env.VITE_SERVER_URL || 'http://localhost:3000', {
    transports: ['websocket', 'polling'],
    autoConnect: true
  });

  const emitWithAck = (event, payload, { timeoutMs = DEFAULT_TIMEOUT_MS, retries = MAX_RETRIES } = {}) => {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      let timer;

      const attempt = () => {
        attempts += 1;
        let settled = false;
        timer = setTimeout(() => {
          if (settled) return;
          if (attempts <= retries + 1) {
            attempt();
          } else {
            reject(new Error('Request timed out'));
          }
        }, timeoutMs);

        socket.emit(event, payload, (ack) => {
          if (settled) return;
          clearTimeout(timer);
          settled = true;
          resolve(ack);
        });
      };

      attempt();
    });
  };

  return { socket, emitWithAck };
};


