const express = require('express');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');

const { env } = require('./config/env');
const { authRouter } = require('./routes/auth');
const { roomsRouter } = require('./routes/rooms');
const { equipmentRouter } = require('./routes/equipment');
const { healthRouter } = require('./routes/health');
const { notFound, errorHandler } = require('./middleware/error');

function createApp({ io, enableCors }) {
  const app = express();
  app.set('trust proxy', 1);


  app.set('trust proxy', 1);

  app.use(helmet({
    contentSecurityPolicy: false
  }));
  app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
  app.use(express.json());
  app.use(cookieParser());

  if (enableCors) {
    app.use(
      cors({
        origin: env.clientOrigin,
        credentials: true
      })
    );
  }

  app.get('/api', (req, res) => res.json({ ok: true, name: 'StudySpace API' }));

  app.use('/api', healthRouter);
  app.use('/api', authRouter);
  app.use('/api', roomsRouter);
  app.use('/api', equipmentRouter);
  const { createBookingsRouter } = require('./routes/bookings');
  app.use('/api', createBookingsRouter(io));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
