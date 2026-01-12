import { apiFetch, getCurrentUser, subscribeToEvents, showError, redirect } from './util.js';

document.addEventListener('DOMContentLoaded', async () => {
  const user = await getCurrentUser();
  if (!user) {
    redirect('login.html');
    return;
  }
  // Show admin link if admin
  if (user.role === 'admin') {
    document.getElementById('adminLink').style.display = 'inline';
    document.getElementById('adminLink').href = 'admin.html';
  }
  // Logout handler
  document.getElementById('logoutLink').addEventListener('click', async e => {
    e.preventDefault();
    await apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    redirect('login.html');
  });
  // Data tables
  const roomsTableBody = document.querySelector('#roomsTable tbody');
  const equipTableBody = document.querySelector('#equipmentTable tbody');
  // Booking form elements
  const bookingContainer = document.getElementById('bookingFormContainer');
  const bookingForm = document.getElementById('bookingForm');
  const cancelBookingBtn = document.getElementById('cancelBooking');

  let selectedResource = null;
  function openBookingForm(type, id) {
    selectedResource = { type, id };
    document.getElementById('resourceType').value = type;
    document.getElementById('resourceId').value = id;
    bookingContainer.style.display = 'block';
  }

  function closeBookingForm() {
    bookingContainer.style.display = 'none';
    bookingForm.reset();
    selectedResource = null;
  }
  cancelBookingBtn.addEventListener('click', () => {
    closeBookingForm();
  });
  bookingForm.addEventListener('submit', async e => {
    e.preventDefault();
    if (!selectedResource) return;
    const start = document.getElementById('startTime').value;
    const end = document.getElementById('endTime').value;
    try {
      await apiFetch('/api/bookings', {
        method: 'POST',
        body: {
          resourceType: selectedResource.type,
          resourceId: selectedResource.id,
          dataInicio: start,
          dataFim: end,
        },
      });
      closeBookingForm();
      await loadData();
    } catch (err) {
      showError(err.message);
    }
  });

  async function loadData() {
    try {
      const [roomsRes, equipRes] = await Promise.all([
        apiFetch('/api/rooms', { method: 'GET' }),
        apiFetch('/api/equipment', { method: 'GET' }),
      ]);
      roomsTableBody.innerHTML = '';
      equipTableBody.innerHTML = '';
      roomsRes.rooms.forEach(room => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${room.name}</td>
          <td>${room.capacity}</td>
          <td>${room.location}</td>
          <td class="status-${room.status}">${room.status}</td>
          <td>${room.status === 'available' ? '<button data-type="room" data-id="' + room.id + '">Reserve</button>' : ''}</td>
        `;
        roomsTableBody.appendChild(tr);
      });
      equipRes.equipment.forEach(eq => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${eq.name}</td>
          <td>${eq.category}</td>
          <td class="status-${eq.status}">${eq.status}</td>
          <td>${eq.status === 'available' ? '<button data-type="equipment" data-id="' + eq.id + '">Reserve</button>' : ''}</td>
        `;
        equipTableBody.appendChild(tr);
      });
    } catch (err) {
      console.error(err);
    }
  }
  // Attach click handlers using event delegation
  roomsTableBody.addEventListener('click', e => {
    if (e.target.tagName === 'BUTTON') {
      const type = e.target.getAttribute('data-type');
      const id = parseInt(e.target.getAttribute('data-id'), 10);
      openBookingForm(type, id);
    }
  });
  equipTableBody.addEventListener('click', e => {
    if (e.target.tagName === 'BUTTON') {
      const type = e.target.getAttribute('data-type');
      const id = parseInt(e.target.getAttribute('data-id'), 10);
      openBookingForm(type, id);
    }
  });
  // Subscribe to events to refresh lists when bookings change
  subscribeToEvents((eventType, data) => {
    loadData();
  });
  // initial load
  loadData();
});