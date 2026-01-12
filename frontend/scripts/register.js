import { apiFetch, showError, redirect } from './util.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registerForm');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;
    try {
      await apiFetch('/api/auth/register', { method: 'POST', body: { name, email, password, role } });
      redirect('dashboard.html');
    } catch (err) {
      showError(err.message);
    }
  });
});