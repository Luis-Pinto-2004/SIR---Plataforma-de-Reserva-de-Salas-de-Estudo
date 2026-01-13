import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App.jsx';
import './index.css';

import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// IMPORTANTE:
// O SocketProvider usa useAuth() para autenticar a ligação socket.
// Portanto, o AuthProvider TEM de estar acima do SocketProvider.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  </React.StrictMode>
);
