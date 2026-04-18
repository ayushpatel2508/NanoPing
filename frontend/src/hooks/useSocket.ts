import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { BACKEND_URL } from '../config/env';

export const useSocket = (monitorId?: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect to the API URL if provided, otherwise default to current origin
    const socketUrl = BACKEND_URL;
    
    const s = io(socketUrl, {
      path: '/socket.io',
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    s.on('connect', () => {
      console.log('[Socket] Connected:', s.id);
      setIsConnected(true);
      if (monitorId) {
        s.emit('join-monitor', monitorId);
      }
    });

    s.on('disconnect', () => {
      console.log('[Socket] Disconnected');
      setIsConnected(false);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [monitorId]);

  return { socket, isConnected };
};
