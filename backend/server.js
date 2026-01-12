/*
 * StudySpace Backend Server
 *
 * This server implements a minimal REST API for the StudySpace application
 * without relying on third‑party npm modules. It uses only the Node.js
 * standard library to provide the required functionality. Data is
 * persisted in JSON files under the `data` directory. While the
 * specification calls for MongoDB and Socket.IO, network restrictions
 * in the evaluation environment prevent installing external packages.
 * Consequently this implementation uses simple JSON storage and
 * Server‑Sent Events (SSE) for realtime updates. These choices are
 * documented in the README.
 */

const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env if present
function loadEnv() {
  try {
    const content = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
    content.split(/\r?\n/).forEach(line => {
      const match = line.match(/^([^#=]+)=([\s\S]*)$/);
      if (match) process.env[match[1].trim()] = match[2].trim();
    });
  } catch (err) {
    // no .env file present, ignore
  }
}
loadEnv();

// Configuration
const PORT = parseInt(process.env.PORT || '4000', 10);
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';
const NODE_ENV = process.env.NODE_ENV || 'development';
const COOKIE_NAME = 'ss_token';
const DATA_DIR = path.join(__dirname, 'data');

// Ensure data directory exists
fs.mkdirSync(DATA_DIR, { recursive: true });

// Utility: read JSON file, return parsed object or default
function readData(file, defaultValue) {
  try {
    const content = fs.readFileSync(path.join(DATA_DIR, file), 'utf8');
    return JSON.parse(content);
  } catch (err) {
    return defaultValue;
  }
}

// Utility: write JSON file
function writeData(file, data) {
  fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(data, null, 2));
}

// Password hashing using PBKDF2
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const hashVerify = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(hashVerify, 'hex'));
}

// Minimal JWT implementation
function base64url(input) {
  return Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function generateToken(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24; // 24h expiration
  const body = { ...payload, exp };
  const headerB64 = base64url(JSON.stringify(header));
  const bodyB64 = base64url(JSON.stringify(body));
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${headerB64}.${bodyB64}`).digest('base64');
  const signatureB64 = signature.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${headerB64}.${bodyB64}.${signatureB64}`;
}

function verifyToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, bodyB64, sig] = parts;
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${headerB64}.${bodyB64}`).digest('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return null;
    const payload = JSON.parse(Buffer.from(bodyB64.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch (err) {
    return null;
  }
}

// SSE clients
const sseClients = new Set();

function sendEvent(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of sseClients) {
    try {
      res.write(payload);
    } catch (err) {
      // client might have closed connection
    }
  }
}

// Data initialization
function initData() {
  const users = readData('users.json', []);
  const rooms = readData('rooms.json', []);
  const equipment = readData('equipment.json', []);
  const bookings = readData('bookings.json', []);
  return { users, rooms, equipment, bookings };
}

function saveAll(data) {
  writeData('users.json', data.users);
  writeData('rooms.json', data.rooms);
  writeData('equipment.json', data.equipment);
  writeData('bookings.json', data.bookings);
}

// Helper to send JSON response
function sendJson(res, statusCode, obj, cookies = []) {
  const headers = { 'Content-Type': 'application/json' };
  cookies.forEach(cookie => {
    headers['Set-Cookie'] = headers['Set-Cookie'] ? [].concat(headers['Set-Cookie'], cookie) : cookie;
  });
  res.writeHead(statusCode, headers);
  res.end(JSON.stringify(obj));
}

// Helper to parse request body as JSON
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      if (body) {
        try {
          const json = JSON.parse(body);
          resolve(json);
        } catch (err) {
          reject(err);
        }
      } else {
        resolve({});
      }
    });
  });
}

// Helper to parse cookies
function parseCookies(req) {
  const header = req.headers['cookie'];
  const cookies = {};
  if (header) {
    header.split(';').forEach(cookieStr => {
      const [name, value] = cookieStr.trim().split('=');
      cookies[name] = decodeURIComponent(value);
    });
  }
  return cookies;
}

// Authentication middleware
function authenticate(req) {
  const cookies = parseCookies(req);
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  const payload = verifyToken(token);
  return payload;
}

// CORS support for development
function handleCors(req, res) {
  if (NODE_ENV === 'development') {
    const origin = req.headers.origin || '*';
    // Allow dev frontend running on 5173
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return true;
    }
  }
  return false;
}

// Main server
const server = http.createServer(async (req, res) => {
  // handle CORS and preflight
  if (handleCors(req, res)) return;

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // SSE endpoint for realtime events
  if (pathname === '/socket.io') {
    // Only allow GET
    if (req.method !== 'GET') {
      res.writeHead(405);
      return res.end();
    }
    // Authenticate the user from cookie before subscribing
    const user = authenticate(req);
    if (!user) {
      res.writeHead(401);
      return res.end('Unauthorized');
    }
    // Set headers for SSE
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': NODE_ENV === 'development' ? (req.headers.origin || '*') : undefined,
      'Access-Control-Allow-Credentials': NODE_ENV === 'development' ? 'true' : undefined,
    });
    // send comment to keep connection alive
    res.write(': connected\n\n');
    sseClients.add(res);
    req.on('close', () => {
      sseClients.delete(res);
    });
    return;
  }

  // API routes
  if (pathname.startsWith('/api/')) {
    // Extract path segments
    const segments = pathname.slice(5).split('/').filter(Boolean);
    const method = req.method.toUpperCase();
    const data = initData();

    try {
      // /api/health
      if (segments[0] === 'health' && method === 'GET') {
        return sendJson(res, 200, { status: 'ok' });
      }
      // Auth routes
      if (segments[0] === 'auth') {
        switch (segments[1]) {
          case 'register':
            if (method !== 'POST') break;
            const bodyReg = await parseBody(req);
            const { name, email, password, role } = bodyReg;
            if (!name || !email || !password) {
              return sendJson(res, 400, { error: 'Missing fields' });
            }
            if (data.users.some(u => u.email === email)) {
              return sendJson(res, 400, { error: 'Email already exists' });
            }
            const id = data.users.reduce((max, u) => Math.max(max, u.id), 0) + 1;
            const passwordHash = hashPassword(password);
            const newUser = { id, name, email, passwordHash, role: role || 'student' };
            data.users.push(newUser);
            saveAll(data);
            const token = generateToken({ id: newUser.id, role: newUser.role, name: newUser.name });
            const cookieOpts = [
              `${COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24};${NODE_ENV === 'production' ? ' Secure; SameSite=None' : ' SameSite=Lax'}`
            ];
            return sendJson(res, 201, { user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role } }, cookieOpts);
          case 'login':
            if (method !== 'POST') break;
            const bodyLogin = await parseBody(req);
            const { email: em, password: pw } = bodyLogin;
            if (!em || !pw) return sendJson(res, 400, { error: 'Missing credentials' });
            const found = data.users.find(u => u.email === em);
            if (!found || !verifyPassword(pw, found.passwordHash)) {
              return sendJson(res, 401, { error: 'Invalid credentials' });
            }
            const tokenLogin = generateToken({ id: found.id, role: found.role, name: found.name });
            const cookie = `${COOKIE_NAME}=${tokenLogin}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24};${NODE_ENV === 'production' ? ' Secure; SameSite=None' : ' SameSite=Lax'}`;
            return sendJson(res, 200, { user: { id: found.id, name: found.name, email: found.email, role: found.role } }, [cookie]);
          case 'logout':
            if (method !== 'POST') break;
            const expired = `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0;${NODE_ENV === 'production' ? ' Secure; SameSite=None' : ' SameSite=Lax'}`;
            return sendJson(res, 200, { message: 'Logged out' }, [expired]);
          case 'me':
            if (method !== 'GET') break;
            const authUser = authenticate(req);
            if (!authUser) return sendJson(res, 401, { error: 'Unauthenticated' });
            const user = data.users.find(u => u.id === authUser.id);
            if (!user) return sendJson(res, 401, { error: 'User not found' });
            return sendJson(res, 200, { user: { id: user.id, name: user.name, email: user.email, role: user.role } });
          case 'forgot-password':
            if (method !== 'POST') break;
            const bodyFP = await parseBody(req);
            const { email: emailFP } = bodyFP;
            if (!emailFP) return sendJson(res, 400, { error: 'Email is required' });
            const userFP = data.users.find(u => u.email === emailFP);
            if (!userFP) return sendJson(res, 200, { message: 'If account exists, a reset link has been generated' });
            const resetToken = crypto.randomBytes(20).toString('hex');
            userFP.resetToken = resetToken;
            userFP.resetTokenExp = Date.now() + 1000 * 60 * 30; // 30 minutes
            saveAll(data);
            console.log(`Password reset token for ${emailFP}: ${resetToken}`);
            return sendJson(res, 200, { message: 'Reset token generated and logged to server console' });
          case 'reset-password':
            if (method !== 'POST') break;
            const bodyRP = await parseBody(req);
            const { token: rpToken, password: newPass } = bodyRP;
            if (!rpToken || !newPass) return sendJson(res, 400, { error: 'Token and new password required' });
            const userRP = data.users.find(u => u.resetToken === rpToken && u.resetTokenExp && u.resetTokenExp > Date.now());
            if (!userRP) return sendJson(res, 400, { error: 'Invalid or expired token' });
            userRP.passwordHash = hashPassword(newPass);
            delete userRP.resetToken;
            delete userRP.resetTokenExp;
            saveAll(data);
            return sendJson(res, 200, { message: 'Password reset successfully' });
        }
        return sendJson(res, 405, { error: 'Method not allowed' });
      }
      // Rooms
      if (segments[0] === 'rooms') {
        if (method === 'GET' && segments.length === 1) {
          return sendJson(res, 200, { rooms: data.rooms });
        }
        const auth = authenticate(req);
        if (!auth) return sendJson(res, 401, { error: 'Unauthorized' });
        if (method === 'POST' && segments.length === 1) {
          // admin only
          if (auth.role !== 'admin') return sendJson(res, 403, { error: 'Forbidden' });
          const body = await parseBody(req);
          const { name, capacity, location, status } = body;
          if (!name || !capacity || !location) return sendJson(res, 400, { error: 'Missing fields' });
          const id = data.rooms.reduce((max, r) => Math.max(max, r.id), 0) + 1;
          const newRoom = { id, name, capacity, location, status: status || 'available' };
          data.rooms.push(newRoom);
          saveAll(data);
          return sendJson(res, 201, { room: newRoom });
        }
        if (segments.length === 2) {
          const id = parseInt(segments[1], 10);
          const room = data.rooms.find(r => r.id === id);
          if (!room) return sendJson(res, 404, { error: 'Not found' });
          if (method === 'PATCH') {
            if (auth.role !== 'admin') return sendJson(res, 403, { error: 'Forbidden' });
            const body = await parseBody(req);
            Object.assign(room, body);
            saveAll(data);
            return sendJson(res, 200, { room });
          }
          if (method === 'DELETE') {
            if (auth.role !== 'admin') return sendJson(res, 403, { error: 'Forbidden' });
            data.rooms = data.rooms.filter(r => r.id !== id);
            saveAll(data);
            return sendJson(res, 200, { message: 'Deleted' });
          }
        }
        return sendJson(res, 405, { error: 'Method not allowed' });
      }
      // Equipment
      if (segments[0] === 'equipment') {
        if (method === 'GET' && segments.length === 1) {
          return sendJson(res, 200, { equipment: data.equipment });
        }
        const auth = authenticate(req);
        if (!auth) return sendJson(res, 401, { error: 'Unauthorized' });
        if (method === 'POST' && segments.length === 1) {
          if (auth.role !== 'admin') return sendJson(res, 403, { error: 'Forbidden' });
          const body = await parseBody(req);
          const { name, category, status } = body;
          if (!name || !category) return sendJson(res, 400, { error: 'Missing fields' });
          const id = data.equipment.reduce((max, e) => Math.max(max, e.id), 0) + 1;
          const eq = { id, name, category, status: status || 'available' };
          data.equipment.push(eq);
          saveAll(data);
          return sendJson(res, 201, { equipment: eq });
        }
        if (segments.length === 2) {
          const id = parseInt(segments[1], 10);
          const eq = data.equipment.find(e => e.id === id);
          if (!eq) return sendJson(res, 404, { error: 'Not found' });
          if (method === 'PATCH') {
            if (auth.role !== 'admin') return sendJson(res, 403, { error: 'Forbidden' });
            const body = await parseBody(req);
            Object.assign(eq, body);
            saveAll(data);
            return sendJson(res, 200, { equipment: eq });
          }
          if (method === 'DELETE') {
            if (auth.role !== 'admin') return sendJson(res, 403, { error: 'Forbidden' });
            data.equipment = data.equipment.filter(e => e.id !== id);
            saveAll(data);
            return sendJson(res, 200, { message: 'Deleted' });
          }
        }
        return sendJson(res, 405, { error: 'Method not allowed' });
      }
      // Bookings
      if (segments[0] === 'bookings') {
        const auth = authenticate(req);
        if (!auth) return sendJson(res, 401, { error: 'Unauthorized' });
        if (segments.length === 1) {
          if (method === 'GET') {
            // admin sees all; teacher/student limited to own bookings
            if (auth.role === 'admin') {
              return sendJson(res, 200, { bookings: data.bookings });
            } else {
              const mine = data.bookings.filter(b => b.userId === auth.id);
              return sendJson(res, 200, { bookings: mine });
            }
          }
          if (method === 'POST') {
            const body = await parseBody(req);
            const { resourceType, resourceId, dataInicio, dataFim } = body;
            if (!resourceType || !resourceId || !dataInicio || !dataFim) {
              return sendJson(res, 400, { error: 'Missing fields' });
            }
            // validate resourceType
            const validTypes = ['room', 'equipment'];
            if (!validTypes.includes(resourceType)) {
              return sendJson(res, 400, { error: 'Invalid resourceType' });
            }
            const start = new Date(dataInicio).getTime();
            const end = new Date(dataFim).getTime();
            if (isNaN(start) || isNaN(end) || start >= end) {
              return sendJson(res, 400, { error: 'Invalid dates' });
            }
            // Validate resource exists
            const resource = resourceType === 'room' ? data.rooms.find(r => r.id === resourceId) : data.equipment.find(e => e.id === resourceId);
            if (!resource) return sendJson(res, 404, { error: 'Resource not found' });
            // Validate resource status
            if (resource.status && resource.status !== 'available') {
              return sendJson(res, 400, { error: 'Resource unavailable' });
            }
            // Check conflicts
            const conflict = data.bookings.some(b => b.resourceType === resourceType && b.resourceId === resourceId && b.status === 'confirmed' && (start < new Date(b.dataFim).getTime()) && (end > new Date(b.dataInicio).getTime()));
            if (conflict) {
              return sendJson(res, 409, { error: 'Booking conflict' });
            }
            // Create booking
            const id = data.bookings.reduce((max, b) => Math.max(max, b.id), 0) + 1;
            const booking = { id, userId: auth.id, resourceType, resourceId, dataInicio, dataFim, status: 'confirmed' };
            data.bookings.push(booking);
            saveAll(data);
            // send event to clients
            sendEvent('booking:created', booking);
            return sendJson(res, 201, { booking });
          }
          return sendJson(res, 405, { error: 'Method not allowed' });
        }
        if (segments.length === 2) {
          const id = parseInt(segments[1], 10);
          const booking = data.bookings.find(b => b.id === id);
          if (!booking) return sendJson(res, 404, { error: 'Not found' });
          if (method === 'GET') {
            if (auth.role === 'admin' || booking.userId === auth.id) {
              return sendJson(res, 200, { booking });
            }
            return sendJson(res, 403, { error: 'Forbidden' });
          }
          if (method === 'PATCH') {
            // Only owner or admin can edit
            if (auth.role !== 'admin' && booking.userId !== auth.id) return sendJson(res, 403, { error: 'Forbidden' });
            const body = await parseBody(req);
            const { dataInicio: newStart, dataFim: newEnd, status } = body;
            // update times if provided
            let start = newStart ? new Date(newStart).getTime() : new Date(booking.dataInicio).getTime();
            let end = newEnd ? new Date(newEnd).getTime() : new Date(booking.dataFim).getTime();
            if (newStart && isNaN(start)) return sendJson(res, 400, { error: 'Invalid dateInicio' });
            if (newEnd && isNaN(end)) return sendJson(res, 400, { error: 'Invalid dataFim' });
            if (start >= end) return sendJson(res, 400, { error: 'Invalid date range' });
            // check conflicts
            const conflict = data.bookings.some(b => b.id !== booking.id && b.resourceType === booking.resourceType && b.resourceId === booking.resourceId && b.status === 'confirmed' && (start < new Date(b.dataFim).getTime()) && (end > new Date(b.dataInicio).getTime()));
            if (conflict) return sendJson(res, 409, { error: 'Booking conflict' });
            booking.dataInicio = new Date(start).toISOString();
            booking.dataFim = new Date(end).toISOString();
            if (status) booking.status = status;
            saveAll(data);
            sendEvent('booking:updated', booking);
            return sendJson(res, 200, { booking });
          }
          if (method === 'DELETE') {
            // Only owner or admin can cancel
            if (auth.role !== 'admin' && booking.userId !== auth.id) return sendJson(res, 403, { error: 'Forbidden' });
            booking.status = 'cancelled';
            saveAll(data);
            sendEvent('booking:cancelled', booking);
            return sendJson(res, 200, { message: 'Cancelled' });
          }
          return sendJson(res, 405, { error: 'Method not allowed' });
        }
      }
      // Not found
      return sendJson(res, 404, { error: 'Not found' });
    } catch (err) {
      console.error(err);
      return sendJson(res, 500, { error: 'Internal server error' });
    }
  }
  // Non API: return 404
  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`StudySpace backend listening on port ${PORT}`);
});