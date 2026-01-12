const mongoose = require('mongoose');

async function findConflict({ Booking, resourceType, resourceId, start, end, ignoreBookingId, blockStatuses }) {
  const query = {
    resourceType,
    resourceId: new mongoose.Types.ObjectId(resourceId),
    status: { $in: blockStatuses },
    dataInicio: { $lt: end },
    dataFim: { $gt: start }
  };
  if (ignoreBookingId) query._id = { $ne: ignoreBookingId };
  return Booking.findOne(query).lean();
}

module.exports = { findConflict };
