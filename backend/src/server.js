const http = require('http');

const { env } = require('./config/env');
const { connectToDb } = require('./db');
const { initSocket } = require("./socket");
const { seedDatabase } = require("./seed/seedData");
const { createApp } = require('./app');

async function main() {
  await connectToDb(env.mongoUri);
  console.log("[DB] connected");

  if (env.autoSeed) {
    const result = await seedDatabase({ force: false });
    if (result.skipped) {
      console.log("[SEED] skipped:", result.reason);
    } else {
      console.log("[SEED] created:", result.counts);
    }
  }


  let requestHandler = (req, res) => {
    res.statusCode = 503;
    res.end('Starting...');
  };

  const httpServer = http.createServer((req, res) => requestHandler(req, res));
  const io = initSocket(httpServer);

  const enableCors = process.env.ENABLE_CORS === 'true';
  const app = createApp({ io, enableCors });
  requestHandler = app;

  httpServer.listen(env.port, '0.0.0.0', () => {
    console.log(`[API] listening on :${env.port} (env=${env.nodeEnv})`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
