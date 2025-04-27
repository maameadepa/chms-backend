// routes/auth.js
const express = require('express');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const db      = require('../db');
require('dotenv').config();

const router = express.Router();

// REGISTER: create a new user
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO users (name, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, role, created_at`,
      [name, email, hashedPassword]
    );
    const user = result.rows[0];
    res.json({ user });
  } catch (err) {
    console.error('Error registering user:', err);
    if (err.code === '23505') {
      // unique_violation on email
      return res.status(400).json({ message: 'Email already in use.' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// LOGIN: authenticate existing user
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await db.query(
      `SELECT id, name, email, password, role
       FROM users
       WHERE email = $1`,
      [email]
    );
    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Remove password before sending user back
    delete user.password;

    // Create JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Send as HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax'
    });
    res.json({ user });
  } catch (err) {
    console.error('Error logging in:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET CURRENT USER: returns payload from JWT
router.get('/me', (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.sendStatus(401);
  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) return res.sendStatus(403);
    const { id, email, role } = payload;
    res.json({ id, email, role });
  });
});

// LOGOUT: clear cookie
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

// Special endpoint to create first admin user
router.post('/create-admin', async (req, res) => {
  const { name, email, password } = req.body;
  
  try {
    // Check if any admin exists
    const adminCheck = await db.query('SELECT * FROM users WHERE role = $1', ['admin']);
    if (adminCheck.rows.length > 0) {
      return res.status(403).json({ message: 'Admin user already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at`,
      [name, email, hashedPassword, 'admin']
    );
    const user = result.rows[0];
    res.json({ user });
  } catch (err) {
    console.error('Error creating admin user:', err);
    if (err.code === '23505') {
      return res.status(400).json({ message: 'Email already in use.' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
