const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { env } = require('./config/env');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const bookingRoutes = require('./routes/bookings');
const roomRoutes = require('./routes/rooms');
const equipmentRoutes = require('./routes/equipment');

function buildCorsOptions() {
  const raw = (env.clientOrigin || '').trim();
  const allowed = raw
    ? raw.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const allowAll = allowed.length === 0 || allowed.includes('*');

  const origin = (requestOrigin, cb) => {
    if (!requestOrigin) return cb(null, true);
    if (allowAll) return cb(null, true);
    if (allowed.includes(requestOrigin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  };

  return { origin, credentials: true };
}

function createApp({ io, enableCors }) {
  app.set('trust proxy', 1);

  const app = express();

  if (enableCors) {
    app.use(cors(buildCorsOptions()));
  }

  app.use(express.json());
  app.use(cookieParser());

  app.get('/api/health', (req, res) => res.json({ ok: true }));

  app.use('/api/auth', authRoutes(io));
  app.use('/api/users', userRoutes);
  app.use('/api/bookings', bookingRoutes(io));
  app.use('/api/rooms', roomRoutes(io));
  app.use('/api/equipment', equipmentRoutes(io));

  // fallback
  app.use((req, res) => res.status(404).json({ message: 'Not found' }));

  return app;
}

module.exports = { createApp };
