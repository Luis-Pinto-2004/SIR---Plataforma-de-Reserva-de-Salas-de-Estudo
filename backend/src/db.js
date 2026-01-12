const mongoose = require('mongoose');

async function connectToDb(mongoUri) {
  mongoose.set('strictQuery', true);
  await mongoose.connect(mongoUri);
  return mongoose.connection;
}

module.exports = { connectToDb };
