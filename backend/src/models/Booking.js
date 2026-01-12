const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    resourceType: { type: String, enum: ['room', 'equipment'], required: true },
    resourceId: { type: mongoose.Schema.Types.ObjectId, required: true },
    dataInicio: { type: Date, required: true },
    dataFim: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled'],
      default: 'confirmed',
      required: true
    }
  },
  { timestamps: true }
);

bookingSchema.index({ resourceType: 1, resourceId: 1, dataInicio: 1, dataFim: 1 });
bookingSchema.index({ userId: 1, dataInicio: -1 });

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = { Booking };
