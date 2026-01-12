const crypto = require('crypto');
const express = require('express');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');

const { env } = require('../config/env');
const { User } = require('../models/User');
const { asyncHandler } = require('../middleware/async');
const { authRequired } = require('../middleware/auth');
const { hashPassword, verifyPassword } = require('../utils/password');
const { signJwt, verifyJwt } = require('../utils/jwt');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false
});

function setAuthCookie(res, token) {
  res.cookie(env.cookie.name, token, {
    httpOnly: true,
    sameSite: env.cookie.sameSite,
    secure: env.cookie.secure,
    maxAge: env.cookie.maxAgeMs,
    path: '/'
  });
}

function clearAuthCookie(res) {
  res.clearCookie(env.cookie.name, { path: '/' });
}

function userDto(user) {
  return { id: user._id.toString(), name: user.name, email: user.email, role: user.role };
}

router.post(
  '/auth/register',
  authLimiter,
  asyncHandler(async (req, res) => {
    const schema = z.object({
      name: z.string().min(2).max(80),
      email: z.string().email(),
      password: z.string().min(6).max(200)
    });
    const body = schema.parse(req.body);

    const exists = await User.findOne({ email: body.email }).lean();
    if (exists) return res.status(409).json({ error: { message: 'Email already in use' } });

    const passwordHash = await hashPassword(body.password);
    const user = await User.create({ name: body.name, email: body.email, passwordHash, role: 'student' });

    const token = signJwt(
      { id: user._id.toString(), role: user.role, email: user.email, name: user.name },
      env.jwtSecret,
      env.jwtExpiresIn
    );
    setAuthCookie(res, token);

    return res.status(201).json({ user: userDto(user) });
  })
);

router.post(
  '/auth/login',
  authLimiter,
  asyncHandler(async (req, res) => {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(1)
    });
    const body = schema.parse(req.body);

    const user = await User.findOne({ email: body.email }).select('+passwordHash');
    if (!user) return res.status(401).json({ error: { message: 'Invalid credentials' } });

    const ok = await verifyPassword(body.password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: { message: 'Invalid credentials' } });

    const token = signJwt(
      { id: user._id.toString(), role: user.role, email: user.email, name: user.name },
      env.jwtSecret,
      env.jwtExpiresIn
    );
    setAuthCookie(res, token);

    return res.json({ user: userDto(user) });
  })
);

router.post('/auth/logout', (req, res) => {
  clearAuthCookie(res);
  return res.json({ ok: true });
});

router.get(
  '/auth/me',
  asyncHandler(async (req, res) => {
    const token = req.cookies?.[env.cookie.name];
    if (!token) return res.status(401).json({ error: { message: 'Unauthorized' } });

    let payload;
    try {
      payload = verifyJwt(token, env.jwtSecret);
    } catch {
      return res.status(401).json({ error: { message: 'Unauthorized' } });
    }

    const user = await User.findById(payload.id).lean();
    if (!user) return res.status(401).json({ error: { message: 'Unauthorized' } });

    return res.json({ user: userDto(user) });
  })
);

router.post(
  '/auth/forgot-password',
  authLimiter,
  asyncHandler(async (req, res) => {
    const schema = z.object({ email: z.string().email() });
    const body = schema.parse(req.body);

    const user = await User.findOne({ email: body.email }).select('+passwordHash');
    if (!user) return res.json({ ok: true });

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + env.resetTokenTtlMinutes * 60 * 1000);

    user.resetPasswordTokenHash = tokenHash;
    user.resetPasswordExpiresAt = expiresAt;
    await user.save();

    console.log(`[RESET_TOKEN] email=${user.email} token=${rawToken} expires=${expiresAt.toISOString()}`);

    const isDev = env.nodeEnv !== 'production';
    return res.json({ ok: true, ...(isDev ? { resetToken: rawToken } : {}) });
  })
);

router.post(
  '/auth/reset-password',
  authLimiter,
  asyncHandler(async (req, res) => {
    const schema = z.object({
      token: z.string().min(10),
      password: z.string().min(6).max(200)
    });
    const body = schema.parse(req.body);

    const tokenHash = crypto.createHash('sha256').update(body.token).digest('hex');

    const user = await User.findOne({
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpiresAt: { $gt: new Date() }
    }).select('+passwordHash');

    if (!user) return res.status(400).json({ error: { message: 'Invalid or expired token' } });

    user.passwordHash = await hashPassword(body.password);
    user.resetPasswordTokenHash = undefined;
    user.resetPasswordExpiresAt = undefined;
    await user.save();

    return res.json({ ok: true });
  })
);

module.exports = { authRouter: router, setAuthCookie, clearAuthCookie };
