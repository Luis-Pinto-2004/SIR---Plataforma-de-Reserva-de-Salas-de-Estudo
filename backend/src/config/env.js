function requireEnv(key) {
  const v = process.env[key];
  if (!v) throw new Error(`Missing required env var: ${key}`);
  return v;
}

function boolEnv(key, defaultValue = false) {
  if (process.env[key] == null) return defaultValue;
  return String(process.env[key]).toLowerCase() === 'true';
}

function normalizeSameSite(value, fallback) {
  if (!value) return fallback;
  const v = String(value).toLowerCase();
  if (v === 'lax' || v === 'strict' || v === 'none') return v;
  return fallback;
}

const isProd = (process.env.NODE_ENV || 'development') === 'production';

// Defaults orientados para 1 único domínio (frontend servido pelo backend).
// Se voltares a separar domínios, define COOKIE_SAMESITE=none e ENABLE_CORS=true.
const defaultCookieSameSite = isProd ? 'lax' : 'lax';
const cookieSameSite = normalizeSameSite(process.env.COOKIE_SAMESITE, defaultCookieSameSite);

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',

  // Render injeta PORT (tipicamente 10000). Mantemos 10000 como fallback.
  port: Number(process.env.PORT || 10000),

  mongoUri: requireEnv('MONGO_URI'),
  jwtSecret: requireEnv('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // Usado apenas quando ENABLE_CORS=true
  clientOrigin: process.env.CLIENT_ORIGIN || '',

  cookie: {
    // Nome do cookie HTTP-only (principal). Mantém coerência com o token fallback no FE.
    name: process.env.COOKIE_NAME || 'studyspace_token',

    // Em produção deve ser true (HTTPS). Em dev pode ser false.
    secure: process.env.COOKIE_SECURE != null ? boolEnv('COOKIE_SECURE') : isProd,

    // 1 domínio => 'lax' (recomendado). Multi-domínio => 'none' (+ secure).
    sameSite: cookieSameSite,

    // Path global para API + sockets.
    path: '/',
  },

  autoSeed: boolEnv('AUTO_SEED', false),
};

if (env.cookie.sameSite === 'none' && env.cookie.secure !== true) {
  // O browser rejeita SameSite=None sem Secure.
  throw new Error('Invalid cookie config: COOKIE_SAMESITE=none requires COOKIE_SECURE=true');
}

module.exports = { env };
