const { Server } = require('socket.io');
const cookie = require('cookie');
const { verifyJwt } = require('../utils/jwt');
const { env } = require('../config/env');

function initSocket(httpServer) {
  const raw = String(env.clientOrigin || '').trim();
  const allowed = raw
    ? raw.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const allowAll = allowed.length === 0 || allowed.includes('*');
  const corsOrigin = (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowAll) return cb(null, true);
    if (allowed.includes(origin)) return cb(null, true);
    return cb(null, false);
  };

  const io = new Server(httpServer, {
    path: '/socket.io',
    cors: {
      origin: corsOrigin,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      // 1) Cookie HTTP-only (principal)
      const header = socket.request.headers.cookie || '';
      const parsed = cookie.parse(header);
      let token = parsed[env.cookie.name];

      // 2) Fallback: token enviado no handshake (socket.io-client auth)
      if (!token && socket.handshake && socket.handshake.auth && socket.handshake.auth.token) {
        token = socket.handshake.auth.token;
      }

      // 3) Fallback: Bearer no header (raro, mas útil)
      if (!token) {
        const authHeader = socket.request.headers.authorization;
        if (authHeader) {
          const m = String(authHeader).match(/^Bearer\s+(.+)$/i);
          if (m) token = m[1];
        }
      }

      if (!token) return next(new Error('unauthorized'));

      const payload = verifyJwt(token, env.jwtSecret);
      socket.user = { id: payload.id, role: payload.role, email: payload.email, name: payload.name };
      return next();
    } catch (err) {
      return next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    if (socket.user?.role === 'admin') {
      socket.join('admin');
    }

    socket.emit('connected', { ok: true, user: socket.user });
  });

  return io;
}

module.exports = { initSocket };
