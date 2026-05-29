const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verifyToken = require('../middleware/verifyToken');
const { createNotification, notifyAdmins } = require('../utils/notificationHelper');

router.get('/', async (req, res) => {
    try {
        const [events] = await db.query('SELECT * FROM events WHERE event_date >= CURDATE() ORDER BY event_date ASC');
        res.json(events);
    } catch (error) {
        console.error('❌ Failed to fetch events:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.post('/register', async (req, res) => {
    const { event_id, user_id, email } = req.body;

    if (!event_id || (!user_id && !email)) {
        return res.status(400).json({ message: 'Event ID and user authentication (user_id or email) required' });
    }

    try {
        const [existing] = await db.query(
            'SELECT * FROM event_registrations WHERE event_id = ? AND (user_id = ? OR email = ?)',
            [event_id, user_id || null, email]
        );

        if (existing.length > 0) {
            return res.status(409).json({ message: 'You are already registered for this event.' });
        }

        const [eventRows] = await db.query('SELECT title FROM events WHERE event_id = ?', [event_id]);
        if (eventRows.length === 0) {
            return res.status(404).json({ message: 'Event not found.' });
        }
        const eventName = eventRows[0].title;

        await db.query(
            'INSERT INTO event_registrations (event_id, user_id, email, registered_at) VALUES (?, ?, ?, NOW())',
            [event_id, user_id || null, email]
        );

        // --- NEW CUSTOM NOTIFICATION ENGINE BLOCKS ---
        if (user_id) {
            // 1. Send confirmation back to the regular user who registered
            await createNotification(user_id, `You have successfully registered for the event: "${eventName}"!`);

            // 2. Fetch the detailed name and company fields for the admin notice
            const [userRows] = await db.query('SELECT full_name, company_name FROM users WHERE user_id = ?', [user_id]);
            
            const userDisplayName = userRows.length > 0 && userRows[0].full_name ? userRows[0].full_name : 'A logged-in user';
            const userCompanyName = userRows.length > 0 && userRows[0].company_name ? userRows[0].company_name : 'their company';
            
            const adminNotificationMessage = `${userDisplayName} from ${userCompanyName} has registered for ${eventName}`;
            await notifyAdmins(adminNotificationMessage);
            
        } else if (email) {
            // Fallback layout for anonymous guest registrations
            await notifyAdmins(`Guest User (${email}) has registered for ${eventName}`);
        }
        // ----------------------------------------------

        res.status(201).json({ message: 'Registered successfully' });
    } catch (error) {
        console.error('❌ Event registration error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.post('/', verifyToken, async (req, res) => {
    const { title, description, event_date, location, category } = req.body;

    if (!title || !description || !event_date || !location || !category) {
        return res.status(400).json({ message: 'All event fields are required' });
    }

    try {
        const [result] = await db.query(
            'INSERT INTO events (title, description, event_date, location, category) VALUES (?, ?, ?, ?, ?)',
            [title, description, event_date, location, category]
        );
        res.status(201).json({ message: 'Event created successfully', eventId: result.insertId });
    } catch (error) {
        console.error('❌ Failed to create event:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;