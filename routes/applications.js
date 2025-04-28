// routes/applications.js
const express = require('express');
const db      = require('../db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const router  = express.Router();

// ─────────────────────────────────────────────────────────────
// Apply for a room
// Frontend should send { room_id }
// ─────────────────────────────────────────────────────────────
router.post('/', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { room_id, special_needs, additional_notes, academic_year, semester } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO applications (user_id, room_id, special_needs, additional_notes, academic_year, semester)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, room_id, special_needs, additional_notes, academic_year, semester]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error creating application:', err);
    res.status(500).json({ message: 'Failed to submit application' });
  }
});

// ─────────────────────────────────────────────────────────────
// Get current user's applications
// ─────────────────────────────────────────────────────────────
router.get('/my-applications', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const q = await db.query(
      `SELECT
         a.id,
         a.status,
         a.created_at,
         a.special_needs,
         a.additional_notes,
         a.academic_year,
         a.semester,
         r.id   AS room_id,
         r.room_number,
         r.room_type,
         r.price_per_semester
       FROM applications a
       LEFT JOIN rooms r ON r.id = a.room_id
       WHERE a.user_id = $1
       ORDER BY a.created_at DESC`,
      [userId]
    );
    res.json(q.rows);
  } catch (err) {
    console.error('Error fetching user applications:', err);
    res.status(500).json({ message: 'Failed to fetch your applications' });
  }
});

// ─────────────────────────────────────────────────────────────
// Admin: view all applications
// ─────────────────────────────────────────────────────────────
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const q = await db.query(
      `SELECT
          a.id,
          u.name AS user_name,
          u.email AS user_email,
          r.room_number,
          a.status,
          a.created_at
       FROM applications a
        JOIN users u ON u.id = a.user_id
        LEFT JOIN rooms r ON r.id = a.room_id
        ORDER BY a.created_at DESC`
    );
    res.json(q.rows);
  } catch (err) {
    console.error('Error fetching all applications:', err);
    res.status(500).json({ message: 'Failed to fetch applications' });
  }
});

// ─────────────────────────────────────────────────────────────
// Get current user's assigned room
// ─────────────────────────────────────────────────────────────
router.get('/my-assigned-room', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const q = await db.query(
      `SELECT
         a.id AS application_id,
         a.status,
         a.created_at,
         r.id AS room_id,
         r.room_number,
         r.room_type,
         r.price_per_semester,
         r.description
       FROM applications a
       JOIN rooms r ON r.id = a.room_id
       WHERE a.user_id = $1 AND a.status = 'approved'
       ORDER BY a.created_at DESC
       LIMIT 1`,
      [userId]
    );
    if (q.rows.length === 0) {
      return res.json(null); // No assigned room
    }
    res.json(q.rows[0]);
  } catch (err) {
    console.error('Error fetching assigned room:', err);
    res.status(500).json({ message: 'Failed to fetch assigned room' });
  }
});

// ─────────────────────────────────────────────────────────────
// Admin: update application status and/or assigned room
// Frontend should send { status, room_id }
// ─────────────────────────────────────────────────────────────
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { status, room_id } = req.body;
  const appId = req.params.id;
  try {
    // Update the application and get the updated row (including user_id and room_number)
    const q = await db.query(
      `UPDATE applications
       SET status = $1,
           room_id = $2
       WHERE id = $3
       RETURNING *`,
      [status, room_id, appId]
    );
    const updatedApp = q.rows[0];

    // Get the room number for the notification (if assigned)
    let roomNumber = null;
    if (room_id) {
      const roomRes = await db.query(
        `SELECT room_number FROM rooms WHERE id = $1`,
        [room_id]
      );
      roomNumber = roomRes.rows[0]?.room_number;
    }

    // Determine notification message
    let notificationMessage = '';
    if (status === 'approved') {
      notificationMessage = room_id
        ? `Your application has been approved and you have been assigned to Room ${roomNumber || ''}.`
        : 'Your application has been approved!';
    } else if (status === 'rejected') {
      notificationMessage = 'Your application has been rejected.';
    } else {
      notificationMessage = `Your application status has been updated to: ${status}.`;
    }

    // Insert notification for the user
    await db.query(
      `INSERT INTO notifications (user_id, message) VALUES ($1, $2)`,
      [updatedApp.user_id, notificationMessage]
    );

    res.json(updatedApp);
  } catch (err) {
    console.error('Error updating application:', err);
    res.status(500).json({ message: 'Failed to update application' });
  }
});

module.exports = router;