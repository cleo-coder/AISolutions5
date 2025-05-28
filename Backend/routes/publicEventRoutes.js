// backend/routes/publicEventRoutes.js 
const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', async (req, res) => {
    try {
        const [events] = await db.query('SELECT event_id, title, description, event_date, location FROM events ORDER BY event_date DESC');
        res.json(events);
    } catch (err) {
        console.error('❌ Error fetching public events:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;