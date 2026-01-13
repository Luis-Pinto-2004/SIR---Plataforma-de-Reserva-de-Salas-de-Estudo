import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { io as createIo } from "socket.io-client";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [serverUser, setServerUser] = useState(null);

  const SOCKET_URL = useMemo(() => {
    const fromEnv = (import.meta.env.VITE_SOCKET_URL || "").trim();
    if (fromEnv) return fromEnv.replace(/\/$/, "");
    const apiBase = (import.meta.env.VITE_API_BASE_URL || "").trim();
    return apiBase ? apiBase.replace(/\/$/, "") : "";
  }, []);

  useEffect(() => {
    // Se não houver URL, tenta same-origin (funciona em dev com proxy, mas em Render quase nunca é o que queres)
    const url = SOCKET_URL || undefined;

    const s = createIo(url, {
      path: "/socket.io",
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 600,
      reconnectionDelayMax: 4000,
      timeout: 10000,
    });

    socketRef.current = s;

    s.on("connect", () => setConnected(true));
    s.on("disconnect", () => setConnected(false));
    s.on("connected", (payload) => {
      setServerUser(payload?.user || null);
    });

    return () => {
      try {
        s.removeAllListeners();
        s.disconnect();
      } catch (_) {}
      socketRef.current = null;
    };
  }, [SOCKET_URL]);

  const value = useMemo(
    () => ({
      socket: socketRef.current,
      connected,
      serverUser,
    }),
    [connected, serverUser]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within SocketProvider");
  return ctx;
}
