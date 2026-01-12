import { apiFetch, getCurrentUser, subscribeToEvents, showError, redirect } from './util.js';

document.addEventListener('DOMContentLoaded', async () => {
  const user = await getCurrentUser();
  if (!user) {
    return redirect('login.html');
  }
  if (user.role !== 'admin') {
    return redirect('dashboard.html');
  }
  // Logout handler
  document.getElementById('logoutLink').addEventListener('click', async e => {
    e.preventDefault();
    await apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    redirect('login.html');
  });
  // Elements
  const roomsTableBody = document.querySelector('#adminRoomsTable tbody');
  const equipTableBody = document.querySelector('#adminEquipTable tbody');
  const bookingsTableBody = document.querySelector('#adminBookingsTable tbody');

  async function loadData() {
    try {
      const [roomsRes, equipRes, bookingsRes] = await Promise.all([
        apiFetch('/api/rooms', { method: 'GET' }),
        apiFetch('/api/equipment', { method: 'GET' }),
        apiFetch('/api/bookings', { method: 'GET' }),
      ]);
      // Rooms
      roomsTableBody.innerHTML = '';
      roomsRes.rooms.forEach(room => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${room.name}</td>
          <td>${room.capacity}</td>
          <td>${room.location}</td>
          <td>
            <select data-id="${room.id}" class="room-status">
              <option value="available" ${room.status === 'available' ? 'selected' : ''}>Available</option>
              <option value="maintenance" ${room.status === 'maintenance' ? 'selected' : ''}>Maintenance</option>
              <option value="unavailable" ${room.status === 'unavailable' ? 'selected' : ''}>Unavailable</option>
            </select>
          </td>
          <td><button data-action="delete-room" data-id="${room.id}">Delete</button></td>
        `;
        roomsTableBody.appendChild(tr);
      });
      // Equipment
      equipTableBody.innerHTML = '';
      equipRes.equipment.forEach(eq => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${eq.name}</td>
          <td>${eq.category}</td>
          <td>
            <select data-id="${eq.id}" class="equip-status">
              <option value="available" ${eq.status === 'available' ? 'selected' : ''}>Available</option>
              <option value="maintenance" ${eq.status === 'maintenance' ? 'selected' : ''}>Maintenance</option>
              <option value="unavailable" ${eq.status === 'unavailable' ? 'selected' : ''}>Unavailable</option>
            </select>
          </td>
          <td><button data-action="delete-equip" data-id="${eq.id}">Delete</button></td>
        `;
        equipTableBody.appendChild(tr);
      });
      // Bookings
      bookingsTableBody.innerHTML = '';
      bookingsRes.bookings.forEach(b => {
        const tr = document.createElement('tr');
        const resourceLabel = b.resourceType === 'room' ? `Room ${b.resourceId}` : `Equipment ${b.resourceId}`;
        tr.innerHTML = `
          <td>${b.id}</td>
          <td>${b.userId}</td>
          <td>${resourceLabel}</td>
          <td>${new Date(b.dataInicio).toLocaleString()}</td>
          <td>${new Date(b.dataFim).toLocaleString()}</td>
          <td class="status-${b.status}">${b.status}</td>
          <td>${b.status !== 'cancelled' ? '<button data-action="cancel-booking" data-id="' + b.id + '">Cancel</button>' : ''}</td>
        `;
        bookingsTableBody.appendChild(tr);
      });
    } catch (err) {
      console.error(err);
    }
  }
  // Add room
  document.getElementById('addRoomForm').addEventListener('submit', async e => {
    e.preventDefault();
    const name = document.getElementById('roomName').value.trim();
    const capacity = parseInt(document.getElementById('roomCapacity').value, 10);
    const location = document.getElementById('roomLocation').value.trim();
    const status = document.getElementById('roomStatus').value;
    try {
      await apiFetch('/api/rooms', { method: 'POST', body: { name, capacity, location, status } });
      e.target.reset();
      loadData();
    } catch (err) {
      showError(err.message);
    }
  });
  // Add equipment
  document.getElementById('addEquipmentForm').addEventListener('submit', async e => {
    e.preventDefault();
    const name = document.getElementById('equipName').value.trim();
    const category = document.getElementById('equipCategory').value.trim();
    const status = document.getElementById('equipStatus').value;
    try {
      await apiFetch('/api/equipment', { method: 'POST', body: { name, category, status } });
      e.target.reset();
      loadData();
    } catch (err) {
      showError(err.message);
    }
  });
  // Event delegation for updates/deletions
  roomsTableBody.addEventListener('change', async e => {
    if (e.target.classList.contains('room-status')) {
      const id = parseInt(e.target.getAttribute('data-id'), 10);
      const status = e.target.value;
      try {
        await apiFetch(`/api/rooms/${id}`, { method: 'PATCH', body: { status } });
        loadData();
      } catch (err) {
        showError(err.message);
      }
    }
  });
  equipTableBody.addEventListener('change', async e => {
    if (e.target.classList.contains('equip-status')) {
      const id = parseInt(e.target.getAttribute('data-id'), 10);
      const status = e.target.value;
      try {
        await apiFetch(`/api/equipment/${id}`, { method: 'PATCH', body: { status } });
        loadData();
      } catch (err) {
        showError(err.message);
      }
    }
  });
  roomsTableBody.addEventListener('click', async e => {
    if (e.target.tagName === 'BUTTON' && e.target.getAttribute('data-action') === 'delete-room') {
      const id = parseInt(e.target.getAttribute('data-id'), 10);
      try {
        await apiFetch(`/api/rooms/${id}`, { method: 'DELETE' });
        loadData();
      } catch (err) {
        showError(err.message);
      }
    }
  });
  equipTableBody.addEventListener('click', async e => {
    if (e.target.tagName === 'BUTTON' && e.target.getAttribute('data-action') === 'delete-equip') {
      const id = parseInt(e.target.getAttribute('data-id'), 10);
      try {
        await apiFetch(`/api/equipment/${id}`, { method: 'DELETE' });
        loadData();
      } catch (err) {
        showError(err.message);
      }
    }
  });
  bookingsTableBody.addEventListener('click', async e => {
    if (e.target.tagName === 'BUTTON' && e.target.getAttribute('data-action') === 'cancel-booking') {
      const id = parseInt(e.target.getAttribute('data-id'), 10);
      try {
        await apiFetch(`/api/bookings/${id}`, { method: 'DELETE' });
        loadData();
      } catch (err) {
        showError(err.message);
      }
    }
  });
  // Subscribe to events
  subscribeToEvents(() => {
    loadData();
  });
  // initial load
  loadData();
});