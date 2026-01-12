const express = require('express');
const { z } = require('zod');

const { Equipment } = require('../models/Equipment');
const { Booking } = require('../models/Booking');
const { authRequired } = require('../middleware/auth');
const { roleRequired } = require('../middleware/role');
const { asyncHandler } = require('../middleware/async');
const { isValidObjectId } = require('../utils/validate');

const router = express.Router();

router.get(
  '/equipment',
  authRequired,
  asyncHandler(async (req, res) => {
    const now = new Date();
    const equipment = await Equipment.find().sort({ name: 1 }).lean();
    const active = await Booking.find({
      resourceType: 'equipment',
      status: 'confirmed',
      dataInicio: { $lt: now },
      dataFim: { $gt: now }
    })
      .select('resourceId')
      .lean();

    const occupiedSet = new Set(active.map((b) => b.resourceId.toString()));

    const data = equipment.map((e) => ({
      ...e,
      id: e._id.toString(),
      occupiedNow: e.status === 'available' ? occupiedSet.has(e._id.toString()) : false
    }));

    return res.json({ equipment: data });
  })
);

router.post(
  '/equipment',
  authRequired,
  roleRequired('admin'),
  asyncHandler(async (req, res) => {
    const schema = z.object({
      name: z.string().min(2).max(120),
      category: z.string().min(2).max(120),
      status: z.enum(['available', 'maintenance', 'disabled']).optional()
    });
    const body = schema.parse(req.body);
    const item = await Equipment.create(body);
    return res.status(201).json({ equipment: { ...item.toObject(), id: item._id.toString() } });
  })
);

router.patch(
  '/equipment/:id',
  authRequired,
  roleRequired('admin'),
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    if (!isValidObjectId(id)) return res.status(400).json({ error: { message: 'Invalid id' } });

    const schema = z
      .object({
        name: z.string().min(2).max(120).optional(),
        category: z.string().min(2).max(120).optional(),
        status: z.enum(['available', 'maintenance', 'disabled']).optional()
      })
      .refine((v) => Object.keys(v).length > 0, { message: 'No fields to update' });

    const body = schema.parse(req.body);
    const item = await Equipment.findByIdAndUpdate(id, body, { new: true });
    if (!item) return res.status(404).json({ error: { message: 'Equipment not found' } });

    return res.json({ equipment: { ...item.toObject(), id: item._id.toString() } });
  })
);

router.delete(
  '/equipment/:id',
  authRequired,
  roleRequired('admin'),
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    if (!isValidObjectId(id)) return res.status(400).json({ error: { message: 'Invalid id' } });

    const deleted = await Equipment.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: { message: 'Equipment not found' } });

    return res.json({ ok: true });
  })
);

module.exports = { equipmentRouter: router };
