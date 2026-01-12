const { Server } = require('socket.io');
const cookie = require('cookie');
const { verifyJwt } = require('../utils/jwt');
const { env } = require('../config/env');

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    path: '/socket.io',
    cors: {
      origin: env.clientOrigin,
      credentials: true
    }
  });

  io.use((socket, next) => {
    try {
      const header = socket.request.headers.cookie || '';
      const parsed = cookie.parse(header);
      const token = parsed[env.cookie.name];
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
