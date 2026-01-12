const dotenv = require('dotenv');

dotenv.config();

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  mongoUri: requireEnv('MONGO_URI'),
  jwtSecret: requireEnv('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  cookie: {
    name: 'ss_token',
    httpOnly: true,
    secure:
      typeof process.env.COOKIE_SECURE === 'string'
        ? process.env.COOKIE_SECURE === 'true'
        : (process.env.NODE_ENV || 'development') === 'production',
    sameSite: process.env.COOKIE_SAMESITE || ((process.env.NODE_ENV || 'development') === 'production' ? 'none' : 'lax'),
    maxAgeMs: 7 * 24 * 60 * 60 * 1000
  },
  autoSeed: process.env.AUTO_SEED === "true",
  resetTokenTtlMinutes: Number(process.env.RESET_TOKEN_TTL_MINUTES || 60),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173'
};

module.exports = { env };
