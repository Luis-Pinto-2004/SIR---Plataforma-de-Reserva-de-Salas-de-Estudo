const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['available', 'maintenance', 'disabled'],
      default: 'available',
      required: true
    }
  },
  { timestamps: true }
);

const Equipment = mongoose.model('Equipment', equipmentSchema);
module.exports = { Equipment };
