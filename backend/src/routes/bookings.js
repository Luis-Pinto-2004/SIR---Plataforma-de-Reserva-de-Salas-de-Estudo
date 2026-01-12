const express = require('express');
const { z } = require('zod');

const { Booking } = require('../models/Booking');
const { Room } = require('../models/Room');
const { Equipment } = require('../models/Equipment');
const { authRequired } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/async');
const { isValidObjectId } = require('../utils/validate');
const { findConflict } = require('../utils/bookingOverlap');

const BLOCK_STATUSES = ['confirmed', 'pending'];

function bookingDto(b, includeUser = false) {
  const dto = {
    id: b._id.toString(),
    userId: b.userId.toString(),
    resourceType: b.resourceType,
    resourceId: b.resourceId.toString(),
    dataInicio: b.dataInicio,
    dataFim: b.dataFim,
    status: b.status,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt
  };
  if (includeUser && b.userId && typeof b.userId === 'object') {
    dto.user = {
      id: b.userId._id.toString(),
      name: b.userId.name,
      email: b.userId.email,
      role: b.userId.role
    };
    dto.userId = b.userId._id.toString();
  }
  return dto;
}

async function ensureResourceIsValid({ resourceType, resourceId }) {
  if (resourceType === 'room') {
    const r = await Room.findById(resourceId).lean();
    if (!r) return { ok: false, message: 'Room not found' };
    if (r.status !== 'available') return { ok: false, message: `Room is ${r.status}` };
    return { ok: true };
  }
  const e = await Equipment.findById(resourceId).lean();
  if (!e) return { ok: false, message: 'Equipment not found' };
  if (e.status !== 'available') return { ok: false, message: `Equipment is ${e.status}` };
  return { ok: true };
}

function parseDate(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function buildListQuery({ user, query }) {
  const q = {};
  if (user.role !== 'admin') {
    q.userId = user.id;
  } else if (query.userId && isValidObjectId(query.userId)) {
    q.userId = query.userId;
  }

  if (query.status) {
    q.status = query.status;
  }
  if (query.resourceType) {
    q.resourceType = query.resourceType;
  }

  const from = query.from ? parseDate(query.from) : null;
  const to = query.to ? parseDate(query.to) : null;
  if (from || to) {
    q.dataInicio = {};
    if (from) q.dataInicio.$gte = from;
    if (to) q.dataInicio.$lte = to;
  }

  return q;
}

function createBookingsRouter(io) {
  const router = express.Router();

  router.get(
    '/bookings',
    authRequired,
    asyncHandler(async (req, res) => {
      const q = buildListQuery({ user: req.user, query: req.query });
      const includeUser = req.user.role === 'admin';

      const cursor = Booking.find(q).sort({ dataInicio: -1 });
      if (includeUser) cursor.populate('userId', 'name email role');

      const bookings = await cursor.lean();
      return res.json({ bookings: bookings.map((b) => bookingDto(b, includeUser)) });
    })
  );

  router.get(
    '/bookings/my',
    authRequired,
    asyncHandler(async (req, res) => {
      const q = buildListQuery({ user: { ...req.user, role: 'student' }, query: req.query });
      q.userId = req.user.id;

      const bookings = await Booking.find(q).sort({ dataInicio: -1 }).lean();
      return res.json({ bookings: bookings.map((b) => bookingDto(b)) });
    })
  );

  router.post(
    '/bookings',
    authRequired,
    asyncHandler(async (req, res) => {
      const schema = z.object({
        resourceType: z.enum(['room', 'equipment']),
        resourceId: z.string().min(1),
        dataInicio: z.string().min(1),
        dataFim: z.string().min(1),
        status: z.enum(['pending', 'confirmed']).optional()
      });
      const body = schema.parse(req.body);

      if (!isValidObjectId(body.resourceId)) return res.status(400).json({ error: { message: 'Invalid resourceId' } });

      const start = parseDate(body.dataInicio);
      const end = parseDate(body.dataFim);
      if (!start || !end) return res.status(400).json({ error: { message: 'Invalid dates' } });
      if (end <= start) return res.status(400).json({ error: { message: 'dataFim must be after dataInicio' } });

      const resourceOk = await ensureResourceIsValid({ resourceType: body.resourceType, resourceId: body.resourceId });
      if (!resourceOk.ok) return res.status(400).json({ error: { message: resourceOk.message } });

      const conflict = await findConflict({
        Booking,
        resourceType: body.resourceType,
        resourceId: body.resourceId,
        start,
        end,
        blockStatuses: BLOCK_STATUSES
      });
      if (conflict) {
        return res.status(409).json({
          error: { message: 'Booking conflict' },
          conflict: { id: conflict._id.toString(), dataInicio: conflict.dataInicio, dataFim: conflict.dataFim, status: conflict.status }
        });
      }

      const status = req.user.role === 'admin' && body.status ? body.status : 'confirmed';

      const booking = await Booking.create({
        userId: req.user.id,
        resourceType: body.resourceType,
        resourceId: body.resourceId,
        dataInicio: start,
        dataFim: end,
        status
      });

      const dto = bookingDto(booking);
      io.emit('booking:created', dto);
      return res.status(201).json({ booking: dto });
    })
  );

  router.patch(
    '/bookings/:id',
    authRequired,
    asyncHandler(async (req, res) => {
      const id = req.params.id;
      if (!isValidObjectId(id)) return res.status(400).json({ error: { message: 'Invalid id' } });

      const schema = z
        .object({
          resourceType: z.enum(['room', 'equipment']).optional(),
          resourceId: z.string().min(1).optional(),
          dataInicio: z.string().min(1).optional(),
          dataFim: z.string().min(1).optional(),
          status: z.enum(['pending', 'confirmed', 'cancelled']).optional()
        })
        .refine((v) => Object.keys(v).length > 0, { message: 'No fields to update' });

      const body = schema.parse(req.body);

      const existing = await Booking.findById(id);
      if (!existing) return res.status(404).json({ error: { message: 'Booking not found' } });

      const isOwner = existing.userId.toString() === req.user.id;
      const isAdmin = req.user.role === 'admin';
      if (!isOwner && !isAdmin) return res.status(403).json({ error: { message: 'Forbidden' } });

      if (!isAdmin && body.status) {
        return res.status(403).json({ error: { message: 'Only admin can change status' } });
      }

      const next = {
        resourceType: body.resourceType || existing.resourceType,
        resourceId: body.resourceId || existing.resourceId.toString(),
        dataInicio: body.dataInicio ? parseDate(body.dataInicio) : existing.dataInicio,
        dataFim: body.dataFim ? parseDate(body.dataFim) : existing.dataFim,
        status: body.status || existing.status
      };

      if (!next.dataInicio || !next.dataFim) return res.status(400).json({ error: { message: 'Invalid dates' } });
      if (next.dataFim <= next.dataInicio) return res.status(400).json({ error: { message: 'dataFim must be after dataInicio' } });

      if (body.resourceId && !isValidObjectId(body.resourceId)) {
        return res.status(400).json({ error: { message: 'Invalid resourceId' } });
      }

      const changingTimeOrResource =
        !!body.resourceType || !!body.resourceId || !!body.dataInicio || !!body.dataFim || (isAdmin && !!body.status);

      if (changingTimeOrResource && next.status !== 'cancelled') {
        const resourceOk = await ensureResourceIsValid({ resourceType: next.resourceType, resourceId: next.resourceId });
        if (!resourceOk.ok) return res.status(400).json({ error: { message: resourceOk.message } });

        const conflict = await findConflict({
          Booking,
          resourceType: next.resourceType,
          resourceId: next.resourceId,
          start: next.dataInicio,
          end: next.dataFim,
          ignoreBookingId: id,
          blockStatuses: BLOCK_STATUSES
        });
        if (conflict) {
          return res.status(409).json({
            error: { message: 'Booking conflict' },
            conflict: { id: conflict._id.toString(), dataInicio: conflict.dataInicio, dataFim: conflict.dataFim, status: conflict.status }
          });
        }
      }

      existing.resourceType = next.resourceType;
      existing.resourceId = next.resourceId;
      existing.dataInicio = next.dataInicio;
      existing.dataFim = next.dataFim;
      if (isAdmin) existing.status = next.status;

      await existing.save();

      const dto = bookingDto(existing);

      if (existing.status === 'cancelled') {
        io.emit('booking:cancelled', dto);
      } else {
        io.emit('booking:updated', dto);
      }

      return res.json({ booking: dto });
    })
  );

  router.delete(
    '/bookings/:id',
    authRequired,
    asyncHandler(async (req, res) => {
      const id = req.params.id;
      if (!isValidObjectId(id)) return res.status(400).json({ error: { message: 'Invalid id' } });

      const existing = await Booking.findById(id);
      if (!existing) return res.status(404).json({ error: { message: 'Booking not found' } });

      const isOwner = existing.userId.toString() === req.user.id;
      const isAdmin = req.user.role === 'admin';
      if (!isOwner && !isAdmin) return res.status(403).json({ error: { message: 'Forbidden' } });

      if (existing.status !== 'cancelled') {
        existing.status = 'cancelled';
        await existing.save();
        io.emit('booking:cancelled', bookingDto(existing));
      }

      return res.json({ ok: true });
    })
  );

  return router;
}

module.exports = { createBookingsRouter, BLOCK_STATUSES };
