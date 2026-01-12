const http = require("http");
const { Server } = require("socket.io");

const { env } = require("./config/env");
const { connectToDb } = require("./config/db");
const { createApp } = require("./app");

const port = process.env.PORT || env.port || 3000;

async function bootstrap() {
  await connectToDb(env.mongoUri);

  // Criar servidor HTTP primeiro (Socket.IO liga-se a este servidor)
  const httpServer = http.createServer();

  const io = new Server(httpServer, {
    cors: {
      origin: env.clientOrigin,
      credentials: true,
    },
  });

  // Express app
  const app = createApp({ io, enableCors: true });

  // Ligar Express ao servidor HTTP
  httpServer.on("request", app);

  httpServer.listen(port, () => {
    console.log(`[API] listening on :${port} (env=${env.nodeEnv})`);
  });
}

bootstrap().catch((err) => {
  console.error("[BOOT] failed", err);
  process.exit(1);
});
