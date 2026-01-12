const mongoose = require('mongoose');

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(String(id));
}

module.exports = { isValidObjectId };
