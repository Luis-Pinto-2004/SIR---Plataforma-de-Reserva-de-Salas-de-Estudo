const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

const { env } = require('./config/env');

const healthRouter = require('./routes/health');
const authRouter = require('./routes/auth');
const resourcesRouter = require('./routes/resources');
const bookingsRouter = require('./routes/bookings');

function createApp({ io, enableCors = false } = {}) {
  const app = express();

  // Render/Reverse proxies (para cookies secure + IPs)
  app.set('trust proxy', 1);

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(morgan('combined'));
  app.use(express.json({ limit: '2mb' }));
  app.use(cookieParser());

  // CORS (desnecessário em modo 1 único domínio, mas fica opcional)
  if (enableCors) {
    const raw = (env.clientOrigin || '').trim();
    const allowed = raw
      ? raw.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    const allowAll = allowed.length === 0 || allowed.includes('*');

    app.use(
      cors({
        origin: (origin, cb) => {
          if (!origin) return cb(null, true);
          if (allowAll) return cb(null, true);
          if (allowed.includes(origin)) return cb(null, true);
          return cb(null, false);
        },
        credentials: true
      })
    );
  }

  // Injetar io no req (para emitir eventos em rotas)
  app.use((req, _res, next) => {
    req.io = io;
    next();
  });

  // API
  app.use('/api', healthRouter);
  app.use('/api', authRouter);
  app.use('/api/resources', resourcesRouter);
  app.use('/api/bookings', bookingsRouter);

  // Frontend (Vite build) servido pelo backend
  const publicDir = path.join(__dirname, '..', 'public');
  const indexHtml = path.join(publicDir, 'index.html');

  if (fs.existsSync(indexHtml)) {
    app.use(express.static(publicDir));

    // SPA fallback (não tocar em /api nem /socket.io)
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      if (req.path.startsWith('/socket.io')) return next();
      return res.sendFile(indexHtml);
    });
  } else {
    // Se ainda não houver build do frontend, mantém o backend a arrancar na mesma.
    app.get('/', (_req, res) => {
      res.status(200).json({
        ok: true,
        message: 'Backend online. Frontend ainda não foi construído (public/index.html em falta).'
      });
    });
  }

  return app;
}

module.exports = { createApp };
