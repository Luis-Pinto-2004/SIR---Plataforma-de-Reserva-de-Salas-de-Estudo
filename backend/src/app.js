const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const { env } = require('./config/env');

const { authRouter } = require('./routes/auth');
const { roomsRouter } = require('./routes/rooms');
const { equipmentRouter } = require('./routes/equipment');
const { reservationsRouter } = require('./routes/reservations');
const { usersRouter } = require('./routes/users');
const { dashboardRouter } = require('./routes/dashboard');
const { healthRouter } = require('./routes/health');
const { notFound, errorHandler } = require('./middleware/error');

function buildCorsOptions() {
  // CLIENT_ORIGIN pode ser lista separada por vírgulas.
  // Se estiver vazio (ou '*'), permite qualquer origem (adequado para demo/avaliação).
  const raw = (env.clientOrigin || '').trim();
  const allowed = raw
    ? raw.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const allowAll = allowed.length === 0 || allowed.includes('*');

  return {
    origin(origin, cb) {
      if (!origin) return cb(null, true); // curl/postman/healthchecks
      if (allowAll) return cb(null, true);
      if (allowed.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  };
}

function createApp({ io, enableCors }) {
  const app = express();

  app.use(helmet());

  if (enableCors) {
    const corsOptions = buildCorsOptions();
    app.use(cors(corsOptions));
    app.options('*', cors(corsOptions));
  }

  app.use(express.json());

  app.use('/api/health', healthRouter);

  app.use('/api/auth', authRouter);
  app.use('/api/rooms', roomsRouter);
  app.use('/api/equipment', equipmentRouter);
  app.use('/api/reservations', reservationsRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/dashboard', dashboardRouter(io));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
