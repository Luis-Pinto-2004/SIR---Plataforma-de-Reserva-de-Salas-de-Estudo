/*
 * Seed script for StudySpace backend
 *
 * This script generates sample data for users, rooms, equipment and bookings.
 * It writes JSON files into the `data` directory. Run with:
 *
 *   node seed.js
 *
 * It assumes the models are stored in JSON files as per server.js.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Helper functions (duplicated from server.js)
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

const DATA_DIR = path.join(__dirname, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

function write(file, data) {
  fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(data, null, 2));
}

// Create users
const users = [
  {
    id: 1,
    name: 'Admin User',
    email: 'admin@example.com',
    passwordHash: hashPassword('password'),
    role: 'admin',
  },
  {
    id: 2,
    name: 'Teacher User',
    email: 'teacher@example.com',
    passwordHash: hashPassword('password'),
    role: 'teacher',
  },
  {
    id: 3,
    name: 'Student User',
    email: 'student@example.com',
    passwordHash: hashPassword('password'),
    role: 'student',
  },
];

// Create rooms
const rooms = [];
for (let i = 1; i <= 5; i++) {
  rooms.push({
    id: i,
    name: `Room ${i}`,
    capacity: 4 + i,
    location: `Building A${i}`,
    status: 'available',
  });
}

// Create equipment
const equipment = [];
for (let i = 1; i <= 5; i++) {
  equipment.push({
    id: i,
    name: `Equipment ${i}`,
    category: i % 2 === 0 ? 'Projector' : 'Laptop',
    status: 'available',
  });
}

// Create a few bookings (no conflicts)
const now = Date.now();
const oneHour = 60 * 60 * 1000;
const bookings = [
  {
    id: 1,
    userId: 3,
    resourceType: 'room',
    resourceId: 1,
    dataInicio: new Date(now + oneHour).toISOString(),
    dataFim: new Date(now + 2 * oneHour).toISOString(),
    status: 'confirmed',
  },
  {
    id: 2,
    userId: 3,
    resourceType: 'equipment',
    resourceId: 2,
    dataInicio: new Date(now + 3 * oneHour).toISOString(),
    dataFim: new Date(now + 4 * oneHour).toISOString(),
    status: 'confirmed',
  },
  {
    id: 3,
    userId: 2,
    resourceType: 'room',
    resourceId: 3,
    dataInicio: new Date(now + 5 * oneHour).toISOString(),
    dataFim: new Date(now + 6 * oneHour).toISOString(),
    status: 'confirmed',
  },
];

write('users.json', users);
write('rooms.json', rooms);
write('equipment.json', equipment);
write('bookings.json', bookings);

console.log('Seed data generated successfully');