const express = require('express');
const db = require('../db');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// GET all rooms
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, room_number, room_type, description, occupancy_limit, price_per_semester, image_url
      FROM rooms
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching rooms:', err);
    res.status(500).json({ message: 'Failed to fetch rooms' });
  }
});

// GET one room by ID
router.get('/:id', authenticateToken, async (req, res) => {
  const roomId = parseInt(req.params.id, 10);
  try {
    const result = await db.query(
      `SELECT id, room_number, room_type, description, occupancy_limit, price_per_semester, image_url
       FROM rooms WHERE id = $1`,
      [roomId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching room details:', err);
    res.status(500).json({ message: 'Failed to fetch room details' });
  }
});

// POST create a new room (admin only)
router.post('/', async (req, res) => {
  const { room_number, room_type, description, occupancy_limit, price_per_semester, image_url } = req.body;
  
  // Validate required fields
  if (!room_number || !room_type || !occupancy_limit || !price_per_semester) {
    return res.status(400).json({ 
      message: 'Missing required fields',
      details: {
        room_number: !room_number,
        room_type: !room_type,
        occupancy_limit: !occupancy_limit,
        price_per_semester: !price_per_semester
      }
    });
  }

  try {
    console.log('Creating room with data:', req.body);
    const result = await db.query(
      `INSERT INTO rooms (room_number, room_type, description, occupancy_limit, price_per_semester, image_url)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [room_number, room_type, description, occupancy_limit, price_per_semester, image_url]
    );
    console.log('Room created successfully:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating room:', err);
    res.status(500).json({ 
      message: 'Failed to create room',
      error: err.message
    });
  }
});

// PUT update a room (admin only)
router.put('/:id', async (req, res) => {
  const roomId = parseInt(req.params.id, 10);
  const { room_number, room_type, description, occupancy_limit, price_per_semester, image_url } = req.body;
  try {
    const result = await db.query(
      `UPDATE rooms SET room_number = $1, room_type = $2, description = $3, occupancy_limit = $4, price_per_semester = $5, image_url = $6
       WHERE id = $7 RETURNING *`,
      [room_number, room_type, description, occupancy_limit, price_per_semester, image_url, roomId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating room:', err);
    res.status(500).json({ message: 'Failed to update room' });
  }
});

// DELETE a room (admin only)
router.delete('/:id', async (req, res) => {
  const roomId = parseInt(req.params.id, 10);
  try {
    const result = await db.query('DELETE FROM rooms WHERE id = $1 RETURNING *', [roomId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.json({ message: 'Room deleted' });
  } catch (err) {
    console.error('Error deleting room:', err);
    res.status(500).json({ message: 'Failed to delete room' });
  }
});

module.exports = router; 