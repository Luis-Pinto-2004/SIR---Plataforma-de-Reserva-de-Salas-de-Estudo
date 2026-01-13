const express = require('express');
const bcrypt = require('bcrypt');

const User = require('../models/User');
const { signJwt, verifyJwt } = require('../utils/jwt');
const { env } = require('../config/env');

const router = express.Router();

function cookieOptions() {
  return {
    httpOnly: true,
    secure: env.cookie.secure,
    sameSite: env.cookie.sameSite,
    maxAge: env.cookie.maxAge,
    path: '/',
  };
}

function extractBearer(req) {
  const h = req.headers.authorization;
  if (!h) return null;
  const m = String(h).match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

router.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'user',
    });

    await newUser.save();

    const payload = { id: newUser._id.toString(), role: newUser.role, email: newUser.email, name: newUser.name };
    const token = signJwt(payload, env.jwtSecret, env.jwtExpiresIn);

    res.cookie(env.cookie.name, token, cookieOptions());

    return res.status(201).json({
      user: { id: payload.id, name: payload.name, email: payload.email, role: payload.role },
      token, // fallback (guardar no localStorage se quiseres)
    });
  } catch (err) {
    console.error('[AUTH] register error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const payload = { id: user._id.toString(), role: user.role, email: user.email, name: user.name };
    const token = signJwt(payload, env.jwtSecret, env.jwtExpiresIn);

    res.cookie(env.cookie.name, token, cookieOptions());

    return res.json({
      user: { id: payload.id, name: payload.name, email: payload.email, role: payload.role },
      token, // fallback
    });
  } catch (err) {
    console.error('[AUTH] login error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/auth/me', async (req, res) => {
  try {
    const cookieToken = req.cookies ? req.cookies[env.cookie.name] : null;
    const bearerToken = extractBearer(req) || req.headers['x-access-token'] || null;
    const token = cookieToken || bearerToken;

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const decoded = verifyJwt(token, env.jwtSecret);
    return res.json({ user: decoded });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

router.post('/auth/logout', (req, res) => {
  res.clearCookie(env.cookie.name, {
    httpOnly: true,
    secure: env.cookie.secure,
    sameSite: env.cookie.sameSite,
    path: '/',
  });
  return res.json({ message: 'Logged out successfully' });
});

module.exports = router;
