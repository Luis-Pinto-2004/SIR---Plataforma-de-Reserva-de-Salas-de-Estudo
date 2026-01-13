const http = require('http');
const { env } = require('./config/env');
const { connectToDb } = require('./db');
const { seedDatabase } = require('./seed/seedData');
const { initSocket } = require('./socket');

// “Blindado”: aceita tanto module.exports = { createApp } como module.exports = createApp
const appModule = require('./app');
const createApp = typeof appModule === 'function' ? appModule : appModule.createApp;

async function start() {
  await connectToDb(env.mongoUri);

  // Seed só se quiseres (ou deixa como está)
  await seedDatabase();

  // Por defeito: CORS LIGADO (desliga apenas se ENABLE_CORS=false)
  const enableCors = process.env.ENABLE_CORS
    ? process.env.ENABLE_CORS === 'true'
    : true;

  // handler temporário enquanto o express não está pronto
  let requestHandler = (req, res) => {
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'starting' }));
  };

  const httpServer = http.createServer((req, res) => {
    // CRÍTICO: não deixes o Express responder a /socket.io, senão dá 404 e depois o Engine.IO tenta responder -> ERR_HTTP_HEADERS_SENT
    if (req.url && req.url.startsWith('/socket.io')) return;
    return requestHandler(req, res);
  });

  const io = initSocket(httpServer);

  const app = createApp({ io, enableCors });
  requestHandler = app;

  httpServer.listen(env.port, () => {
    console.log(`[API] listening on :${env.port} (env=${env.nodeEnv}) cors=${enableCors}`);
  });
}

start().catch((err) => {
  console.error('[FATAL] failed to start server', err);
  process.exit(1);
});
