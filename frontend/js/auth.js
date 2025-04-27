// frontend/js/auth.js

// Base API URL
const API_URL = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', () => {
  // ── Form containers
  const loginContainer         = document.getElementById('loginForm');
  const registerContainer      = document.getElementById('registerForm');
  const forgotPasswordContainer= document.getElementById('forgotPasswordForm');
  const resetPasswordContainer = document.getElementById('resetPasswordForm');

  // ── Forms
  const loginForm     = document.querySelector('#loginForm form');
  const registerForm  = document.querySelector('#registerForm form');
  const forgotForm    = document.getElementById('forgotPassword');
  const resetForm     = document.getElementById('resetPassword');

  // ── Navigation links/buttons
  const showRegisterLink   = document.getElementById('showRegister');
  const showLoginLink      = document.getElementById('showLogin');
  const showForgotLink     = document.getElementById('showForgotPassword');
  const backToLoginLink    = document.getElementById('backToLogin');
  const logoutBtn          = document.getElementById('logoutBtn');

  // ── Switch to Register
  if (showRegisterLink && loginContainer && registerContainer) {
    showRegisterLink.addEventListener('click', e => {
      e.preventDefault();
      loginContainer.classList.add('hidden');
      registerContainer.classList.remove('hidden');
    });
  }

  // ── Switch to Login
  if (showLoginLink && loginContainer && registerContainer) {
    showLoginLink.addEventListener('click', e => {
      e.preventDefault();
      registerContainer.classList.add('hidden');
      loginContainer.classList.remove('hidden');
    });
  }

  // ── Switch to Forgot Password
  if (showForgotLink && loginContainer && forgotPasswordContainer) {
    showForgotLink.addEventListener('click', e => {
      e.preventDefault();
      loginContainer.classList.add('hidden');
      forgotPasswordContainer.classList.remove('hidden');
    });
  }

  // ── Back to Login from Forgot
  if (backToLoginLink && forgotPasswordContainer && loginContainer) {
    backToLoginLink.addEventListener('click', e => {
      e.preventDefault();
      forgotPasswordContainer.classList.add('hidden');
      loginContainer.classList.remove('hidden');
    });
  }

  // ── Attach submit handlers
  loginForm?.addEventListener('submit', handleLogin);
  registerForm?.addEventListener('submit', handleRegister);
  forgotForm?.addEventListener('submit', handleForgotPassword);
  resetForm?.addEventListener('submit', handleResetPassword);
  logoutBtn?.addEventListener('click', handleLogout);

  // ── Show reset password if token present
  const token = new URLSearchParams(window.location.search).get('token');
  if (token) {
    loginContainer.classList.add('hidden');
    registerContainer.classList.add('hidden');
    forgotPasswordContainer.classList.add('hidden');
    resetPasswordContainer.classList.remove('hidden');
  }

  // ── Check for existing session
  checkAuth();
});

// ── Authentication flow functions ──

async function checkAuth() {
  try {
    const res = await fetch(`${API_URL}/auth/me`, { credentials: 'include' });
    if (res.ok) {
      const user = await res.json();
      updateUIForLoggedInUser(user);
    } else {
      updateUIForLoggedOutUser();
    }
  } catch {
    updateUIForLoggedOutUser();
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const formEl = document.querySelector('#loginForm form');
  const formData = new FormData(formEl);
  const payload = {
    email: formData.get('email'),
    password: formData.get('password')
  };

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json();
      // Redirect based on role
      if (data.user.role === 'admin') {
        window.location.href = 'admin-dashboard.html';
      } else {
        window.location.href = 'student-dashboard.html';
      }
    } else {
      const error = await res.json();
      alert(error.message || 'Login failed');
    }
  } catch (err) {
    console.error('Login error:', err);
    alert('Login failed. Please try again.');
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const formEl = document.querySelector('#registerForm form');
  const formData = new FormData(formEl);
  const payload = {
    name:     formData.get('name'),
    email:    formData.get('email'),
    password: formData.get('password')
  };
  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (res.ok) {
      updateUIForLoggedInUser(data.user);
      window.location.href = '/hostels.html';
    } else {
      alert(data.message || 'Registration failed');
    }
  } catch {
    alert('Error during registration');
  }
}

async function handleLogout() {
  try {
    await fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
  } finally {
    updateUIForLoggedOutUser();
    window.location.href = '/index.html';
  }
}

async function handleForgotPassword(e) {
  e.preventDefault();
  const email = document.getElementById('resetEmail')?.value;
  try {
    const res = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (res.ok) showSuccess('Reset link sent'); else showError(data.message);
  } catch {
    showError('Error requesting reset');
  }
}

async function handleResetPassword(e) {
  e.preventDefault();
  const newPwd  = document.getElementById('newPassword')?.value;
  const confirm = document.getElementById('confirmPassword')?.value;
  if (newPwd !== confirm) return showError('Passwords do not match');
  const token = new URLSearchParams(window.location.search).get('token');
  try {
    const res = await fetch(`${API_URL}/auth/reset-password/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: newPwd })
    });
    const data = await res.json();
    if (res.ok) {
      showSuccess('Password reset');
      setTimeout(() => window.location.href = '/index.html', 3000);
    } else {
      showError(data.message);
    }
  } catch {
    showError('Error resetting password');
  }
}

function updateUIForLoggedInUser(user) {
  document.querySelectorAll('.auth-links').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.user-links').forEach(el => el.style.display = 'block');
  const nameEl = document.getElementById('userName');
  if (nameEl) nameEl.textContent = user.name;
}

function updateUIForLoggedOutUser() {
  document.querySelectorAll('.auth-links').forEach(el => el.style.display = 'block');
  document.querySelectorAll('.user-links').forEach(el => el.style.display = 'none');
}

function showError(msg) {
  const n = document.createElement('div');
  n.className = 'notification error';
  n.textContent = msg;
  document.body.append(n);
  setTimeout(() => n.remove(), 3000);
}

function showSuccess(msg) {
  const n = document.createElement('div');
  n.className = 'notification success';
  n.textContent = msg;
  document.body.append(n);
  setTimeout(() => n.remove(), 3000);
}
