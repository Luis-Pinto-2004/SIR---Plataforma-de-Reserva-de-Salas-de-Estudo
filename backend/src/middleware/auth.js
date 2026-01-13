const { verifyJwt } = require('../utils/jwt');
const { env } = require('../config/env');

function extractBearer(req) {
  const h = req.headers.authorization;
  if (!h) return null;
  const m = String(h).match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

function authRequired(req, res, next) {
  try {
    // 1) Cookie HTTP-only (principal)
    const cookieToken = req.cookies ? req.cookies[env.cookie.name] : null;

    // 2) Bearer token (fallback)
    const bearerToken = extractBearer(req) || req.headers['x-access-token'] || null;

    const token = cookieToken || bearerToken;
    if (!token) return res.status(401).json({ error: 'unauthorized' });

    const decoded = verifyJwt(token, env.jwtSecret);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'unauthorized' });
  }
}

function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'forbidden' });
  }
  return next();
}

module.exports = { authRequired, adminOnly };
