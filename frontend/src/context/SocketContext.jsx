import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [lastError, setLastError] = useState(null);

  const socketUrl = import.meta.env.VITE_SOCKET_URL; // ex: https://<backend>.onrender.com

  useEffect(() => {
    if (!socketUrl) {
      setLastError('VITE_SOCKET_URL em falta');
      return;
    }

    const socket = io(socketUrl, {
      path: '/socket.io',
      withCredentials: true,
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setLastError(null);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('connect_error', (err) => {
      setLastError(err?.message || 'connect_error');
    });

    socket.on('error', (err) => {
      setLastError(err?.message || 'socket_error');
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [socketUrl]);

  const value = useMemo(() => ({
    socket: socketRef.current,
    connected,
    lastError,
  }), [connected, lastError]);

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket tem de ser usado dentro de <SocketProvider>');
  return ctx;
}
