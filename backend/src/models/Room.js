const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    capacity: { type: Number, required: true, min: 1 },
    location: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['available', 'maintenance', 'disabled'],
      default: 'available',
      required: true
    }
  },
  { timestamps: true }
);

const Room = mongoose.model('Room', roomSchema);
module.exports = { Room };
