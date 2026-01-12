const http = require("http");
const { Server } = require("socket.io");

const env = require("./config/env");
const createApp = require("./app");
const connectDb = require("./config/db");
const { seedDatabase } = require("./seed/seedData");

// Create HTTP server
const httpServer = http.createServer();

// Socket.IO server
const io = new Server(httpServer, {
  cors: {
    origin: env.clientOrigin,
    credentials: true,
  },
  path: "/socket.io",
});

// ✅ Controla CORS por variável de ambiente (para Render / cross-site)
const enableCors = String(process.env.ENABLE_CORS || "false").toLowerCase() === "true";

const app = createApp({ io, enableCors });

// Attach Express app to HTTP server
httpServer.on("request", app);

async function start() {
  try {
    await connectDb(env.mongoUri);

    // Optional seed on startup
    if (env.autoSeed) {
      await seedDatabase({ force: false });
    }

    httpServer.listen(env.port, () => {
      console.log(`API listening on port ${env.port}`);
      console.log(`CORS enabled: ${enableCors ? "YES" : "NO"}`);
      console.log(`CLIENT_ORIGIN: ${env.clientOrigin}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
