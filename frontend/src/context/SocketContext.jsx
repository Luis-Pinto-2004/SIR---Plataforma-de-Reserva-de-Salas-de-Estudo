import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { io as createIo } from "socket.io-client";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);

  const backendUrl = useMemo(() => {
    // ✅ Em produção (Render), define VITE_API_BASE e isto liga ao backend remoto
    // ✅ Em dev, fica vazio e usa a mesma origem (proxy do Vite)
    return import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_BASE || undefined;
  }, []);

  useEffect(() => {
    const s = createIo(backendUrl, {
      path: "/socket.io",
      withCredentials: true,
      autoConnect: true,
    });

    setSocket(s);

    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [backendUrl]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  return useContext(SocketContext);
}
