const { verifyJwt } = require('../utils/jwt');
const { env } = require('../config/env');

function authRequired(req, res, next) {
  try {
    const token = req.cookies?.[env.cookie.name];
    if (!token) return res.status(401).json({ error: { message: 'Unauthorized' } });
    const payload = verifyJwt(token, env.jwtSecret);
    req.user = { id: payload.id, role: payload.role, email: payload.email, name: payload.name };
    return next();
  } catch (err) {
    return res.status(401).json({ error: { message: 'Unauthorized' } });
  }
}

module.exports = { authRequired };
