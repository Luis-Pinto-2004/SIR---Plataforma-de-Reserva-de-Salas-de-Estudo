import { apiFetch, showError, redirect } from './util.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    try {
      await apiFetch('/api/auth/login', { method: 'POST', body: { email, password } });
      redirect('dashboard.html');
    } catch (err) {
      showError(err.message);
    }
  });
});