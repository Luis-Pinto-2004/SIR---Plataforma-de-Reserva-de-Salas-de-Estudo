const http = require("http");
const { Server } = require("socket.io");
const { createApp } = require("./app");
const { env } = require("./config/env");
const { connectToDb } = require("./config/db");

async function main() {
  await connectToDb(env.mongoUri);

  const httpServer = http.createServer();

  // Socket.io
  const io = new Server(httpServer, {
    cors: { origin: env.clientOrigin, credentials: true },
    path: "/socket.io",
  });

  // Express app
  const app = createApp({ io, enableCors: env.enableCors });

  // MUITO IMPORTANTE:
  // não deixar o Express responder a /socket.io (senão dá 404 e rebenta com ERR_HTTP_HEADERS_SENT)
  httpServer.on("request", (req, res) => {
    if (req.url && req.url.startsWith("/socket.io")) return;
    return app(req, res);
  });

  httpServer.listen(env.port, () => {
    console.log(`[API] listening on :${env.port} (env=${env.nodeEnv})`);
  });
}

main().catch((err) => {
  console.error("[API] fatal startup error:", err);
  process.exit(1);
});
