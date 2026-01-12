import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { io as createIo } from "socket.io-client";

const SocketContext = createContext(null);

function getBackendURL() {
  const raw =
    import.meta.env.VITE_BACKEND_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_BASE ||
    "";

  return raw ? raw.replace(/\/$/, "") : undefined;
}

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);

  const backendURL = useMemo(() => getBackendURL(), []);

  useEffect(() => {
    const s = createIo(backendURL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    setSocket(s);
    return () => s.disconnect();
  }, [backendURL]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
