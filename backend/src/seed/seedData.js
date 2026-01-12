const { User } = require('../models/User');
const { Room } = require('../models/Room');
const { Equipment } = require('../models/Equipment');
const { Booking } = require('../models/Booking');
const { hashPassword } = require('../utils/password');

async function seedDatabase({ force = false } = {}) {
  const userCount = await User.countDocuments();
  if (!force && userCount > 0) {
    return { skipped: true, reason: 'database_not_empty' };
  }

  if (force) {
    await Promise.all([
      User.deleteMany({}),
      Room.deleteMany({}),
      Equipment.deleteMany({}),
      Booking.deleteMany({})
    ]);
  }

  const [adminHash, teacherHash, studentHash] = await Promise.all([
    hashPassword('Admin123!'),
    hashPassword('Teacher123!'),
    hashPassword('Student123!')
  ]);

  const [admin, teacher, student] = await User.create([
    { name: 'Admin User', email: 'admin@studyspace.local', passwordHash: adminHash, role: 'admin' },
    { name: 'Teacher User', email: 'teacher@studyspace.local', passwordHash: teacherHash, role: 'teacher' },
    { name: 'Student User', email: 'student@studyspace.local', passwordHash: studentHash, role: 'student' }
  ]);

  const rooms = await Room.create([
    { name: 'Sala A1', capacity: 8, location: 'Edifício A, Piso 1', status: 'available' },
    { name: 'Sala A2', capacity: 12, location: 'Edifício A, Piso 1', status: 'available' },
    { name: 'Sala B1', capacity: 20, location: 'Edifício B, Piso 0', status: 'available' },
    { name: 'Sala C1', capacity: 6, location: 'Edifício C, Piso 2', status: 'maintenance' },
    { name: 'Sala D1', capacity: 16, location: 'Edifício D, Piso 3', status: 'available' }
  ]);

  const equipment = await Equipment.create([
    { name: 'Projetor Epson X1', category: 'Projetor', status: 'available' },
    { name: 'Laptop Dell 14"', category: 'Laptop', status: 'available' },
    { name: 'Câmara Logitech', category: 'Câmara', status: 'available' },
    { name: 'Microfone USB', category: 'Áudio', status: 'available' },
    { name: 'Tablet iPad', category: 'Tablet', status: 'disabled' }
  ]);

  const now = new Date();
  const activeStart = new Date(now.getTime() - 30 * 60 * 1000);
  const activeEnd = new Date(now.getTime() + 30 * 60 * 1000);
  const tomorrow10 = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  tomorrow10.setHours(10, 0, 0, 0);
  const tomorrow12 = new Date(tomorrow10.getTime() + 2 * 60 * 60 * 1000);

  await Booking.create([
    {
      userId: student._id,
      resourceType: 'room',
      resourceId: rooms[1]._id,
      dataInicio: activeStart,
      dataFim: activeEnd,
      status: 'confirmed'
    },
    {
      userId: teacher._id,
      resourceType: 'equipment',
      resourceId: equipment[0]._id,
      dataInicio: tomorrow10,
      dataFim: tomorrow12,
      status: 'confirmed'
    },
    {
      userId: student._id,
      resourceType: 'room',
      resourceId: rooms[0]._id,
      dataInicio: new Date(now.getTime() - 48 * 60 * 60 * 1000),
      dataFim: new Date(now.getTime() - 47 * 60 * 60 * 1000),
      status: 'cancelled'
    }
  ]);

  return { skipped: false, counts: { users: 3, rooms: rooms.length, equipment: equipment.length } };
}

module.exports = { seedDatabase };
