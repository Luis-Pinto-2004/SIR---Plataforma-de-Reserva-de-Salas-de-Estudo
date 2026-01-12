const http = require('http');
const { env } = require('./config/env');
const { connectToDb } = require('./db');
const { seedAdmin } = require('./seed/admin');
const { initSocket } = require('./socket');
const { createApp } = require('./app');

async function start() {
  await connectToDb(env.mongoUri);
  await seedAdmin();

  // Por defeito: CORS LIGADO (desliga apenas se definir ENABLE_CORS=false)
  const enableCors = process.env.ENABLE_CORS
    ? process.env.ENABLE_CORS === 'true'
    : true;

  let requestHandler = (req, res) => {
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'starting' }));
  };

  const httpServer = http.createServer((req, res) => {
    // Não responder a /socket.io aqui. Deixa o Engine.IO (Socket.IO) tratar.
    // Se o Express responder (404), depois o Engine.IO tenta responder e dá ERR_HTTP_HEADERS_SENT.
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
