// routes/hostels.js
const express = require('express');
const db      = require('../db');
const router  = express.Router();

// GET all hostels (adapted to your schema)
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, name, address, total_rooms, created_at
      FROM hostels
    `);

    // Map DB rows into the shape your frontend expects
    const hostels = result.rows.map(h => ({
      id:              h.id,
      name:            h.name,
      description:     h.address,           // use address column
      total_rooms:     h.total_rooms,
      available_rooms: h.total_rooms,      // placeholder until occupancy is tracked
      amenities:       [],                // no amenities column in your schema
      images:          []                 // no images stored yet
    }));

    res.json(hostels);
  } catch (err) {
    console.error('Error fetching hostels:', err);
    res.status(500).json({ message: 'Failed to fetch hostels' });
  }
});

// GET one hostel and its rooms
router.get('/:id', async (req, res) => {
  const hostelId = parseInt(req.params.id, 10);
  try {
    // 1) fetch the hostel
    const hq = await db.query(
      `SELECT id, name, address AS description, total_rooms
         FROM hostels
       WHERE id = $1`,
      [hostelId]
    );
    if (hq.rowCount === 0) {
      return res.status(404).json({ message: 'Hostel not found' });
    }
    const hostel = hq.rows[0];

    // 2) fetch its rooms
    const rq = await db.query(
      `SELECT id, room_number, room_type, monthly_rent
         FROM rooms
       WHERE hostel_id = $1`,
      [hostelId]
    );
    hostel.rooms = rq.rows;

    res.json(hostel);
  } catch (err) {
    console.error('Error fetching hostel details:', err);
    res.status(500).json({ message: 'Failed to fetch hostel details' });
  }
});

module.exports = router;
