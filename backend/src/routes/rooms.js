const express = require('express');
const { z } = require('zod');

const { Room } = require('../models/Room');
const { Booking } = require('../models/Booking');
const { authRequired } = require('../middleware/auth');
const { roleRequired } = require('../middleware/role');
const { asyncHandler } = require('../middleware/async');
const { isValidObjectId } = require('../utils/validate');

const router = express.Router();

router.get(
  '/rooms',
  authRequired,
  asyncHandler(async (req, res) => {
    const now = new Date();
    const rooms = await Room.find().sort({ name: 1 }).lean();
    const active = await Booking.find({
      resourceType: 'room',
      status: 'confirmed',
      dataInicio: { $lt: now },
      dataFim: { $gt: now }
    })
      .select('resourceId')
      .lean();

    const occupiedSet = new Set(active.map((b) => b.resourceId.toString()));

    const data = rooms.map((r) => ({
      ...r,
      id: r._id.toString(),
      occupiedNow: r.status === 'available' ? occupiedSet.has(r._id.toString()) : false
    }));

    return res.json({ rooms: data });
  })
);

router.post(
  '/rooms',
  authRequired,
  roleRequired('admin'),
  asyncHandler(async (req, res) => {
    const schema = z.object({
      name: z.string().min(2).max(120),
      capacity: z.number().int().min(1).max(1000),
      location: z.string().min(2).max(200),
      status: z.enum(['available', 'maintenance', 'disabled']).optional()
    });
    const body = schema.parse(req.body);
    const room = await Room.create(body);
    return res.status(201).json({ room: { ...room.toObject(), id: room._id.toString() } });
  })
);

router.patch(
  '/rooms/:id',
  authRequired,
  roleRequired('admin'),
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    if (!isValidObjectId(id)) return res.status(400).json({ error: { message: 'Invalid id' } });

    const schema = z
      .object({
        name: z.string().min(2).max(120).optional(),
        capacity: z.number().int().min(1).max(1000).optional(),
        location: z.string().min(2).max(200).optional(),
        status: z.enum(['available', 'maintenance', 'disabled']).optional()
      })
      .refine((v) => Object.keys(v).length > 0, { message: 'No fields to update' });

    const body = schema.parse(req.body);
    const room = await Room.findByIdAndUpdate(id, body, { new: true });
    if (!room) return res.status(404).json({ error: { message: 'Room not found' } });

    return res.json({ room: { ...room.toObject(), id: room._id.toString() } });
  })
);

router.delete(
  '/rooms/:id',
  authRequired,
  roleRequired('admin'),
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    if (!isValidObjectId(id)) return res.status(400).json({ error: { message: 'Invalid id' } });

    const deleted = await Room.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: { message: 'Room not found' } });

    return res.json({ ok: true });
  })
);

module.exports = { roomsRouter: router };
