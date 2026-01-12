import { apiFetch, getCurrentUser, subscribeToEvents, showError, redirect } from './util.js';

document.addEventListener('DOMContentLoaded', async () => {
  const user = await getCurrentUser();
  if (!user) {
    return redirect('login.html');
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
  const tableBody = document.querySelector('#historyTable tbody');

  async function loadBookings() {
    try {
      const res = await apiFetch('/api/bookings', { method: 'GET' });
      tableBody.innerHTML = '';
      res.bookings.forEach(b => {
        const tr = document.createElement('tr');
        const resourceLabel = b.resourceType === 'room' ? `Room ${b.resourceId}` : `Equipment ${b.resourceId}`;
        tr.innerHTML = `
          <td>${b.id}</td>
          <td>${resourceLabel}</td>
          <td>${new Date(b.dataInicio).toLocaleString()}</td>
          <td>${new Date(b.dataFim).toLocaleString()}</td>
          <td class="status-${b.status}">${b.status}</td>
          <td>${b.status !== 'cancelled' ? '<button data-action="cancel" data-id="' + b.id + '">Cancel</button>' : ''}</td>
        `;
        tableBody.appendChild(tr);
      });
    } catch (err) {
      console.error(err);
    }
  }
  tableBody.addEventListener('click', async e => {
    if (e.target.tagName === 'BUTTON' && e.target.getAttribute('data-action') === 'cancel') {
      const id = parseInt(e.target.getAttribute('data-id'), 10);
      try {
        await apiFetch(`/api/bookings/${id}`, { method: 'DELETE' });
        loadBookings();
      } catch (err) {
        showError(err.message);
      }
    }
  });
  subscribeToEvents(() => {
    loadBookings();
  });
  loadBookings();
});