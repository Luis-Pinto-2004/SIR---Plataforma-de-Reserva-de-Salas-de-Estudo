const express = require('express');
const { verifyJwt } = require('../utils/jwt');
const { env } = require('../config/env');

function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.[env.cookie.name];
    if (!token) return res.status(401).json({ message: 'unauthorized' });

    const payload = verifyJwt(token, env.jwtSecret);
    req.user = payload;
    return next();
  } catch (e) {
    return res.status(401).json({ message: 'unauthorized' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'forbidden' });
  return next();
}

const router = express.Router();


router.get('/me', requireAuth, (req, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email,
    name: req.user.name,
    role: req.user.role,
  });
});


router.get('/', requireAuth, requireAdmin, (req, res) => {
  res.json([]);
});

module.exports = router;
