const express = require('express');
const router = express.Router();
const db = require('../config/db');
const jwt = require('jsonwebtoken');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const { createNotification, notifyAdmins } = require('../utils/notificationHelper');

router.post('/submit', async (req, res) => {
    const { company_name, request_message, preferred_date, email: bodyEmail } = req.body;

    let user_id = null;
    let email = bodyEmail;
    let full_name = null;

    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
                user_id = decoded.userId || null;
                email = decoded.email || email;

                if (user_id) {
                    const [userRows] = await db.query('SELECT full_name FROM users WHERE user_id = ?', [user_id]);
                    if (userRows.length > 0) {
                        full_name = userRows[0].full_name;
                    }
                }
            } catch (err) {
                console.warn('Invalid token for demo request submission (guest user assumed):', err.message);
            }
        }

        if (!company_name || !request_message || !preferred_date || !email) {
            return res.status(400).json({ message: 'All fields are required for a demo request, and user must be logged in or provide email.' });
        }

        if (!email) {
            return res.status(400).json({ message: 'Email is required.' });
        }

        const [result] = await db.query(
            'INSERT INTO demo_requests (user_id, company_name, request_message, preferred_date, email) VALUES (?, ?, ?, ?, ?)',
            [user_id, company_name, request_message, preferred_date, email]
        );

        const requestId = result.insertId;

        await createNotification(user_id, `Your demo request for ${company_name} has been submitted successfully! We will contact you soon.`);

        const senderInfo = full_name ? `${full_name} (Email: ${email || 'N/A'}, User ID: ${user_id || 'N/A'})` : `Guest User (Email: ${email || 'N/A'})`;
        const notificationMessage = `New Demo Request from: ${senderInfo}. Company: ${company_name}. Message: "${request_message}". Preferred Date: ${preferred_date}.`;

        await notifyAdmins(notificationMessage);

        res.status(201).json({ message: 'Demo request submitted successfully', request_id: requestId });
    } catch (err) {
        console.error('❌ Demo request error:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.get('/all', verifyToken, checkRole('admin'), async (req, res) => {
    try {
        const [requests] = await db.query(`
            SELECT
                request_id,
                company_name,
                request_message,
                preferred_date,
                email,
                created_at,
                status,
                admin_response,
                admin_notes
            FROM
                demo_requests
            ORDER BY
                created_at DESC
        `);
        res.json(requests);
    } catch (err) {
        console.error('❌ Failed to fetch all demo requests:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.patch('/update/:id', verifyToken, checkRole('admin'), async (req, res) => {
    const { id } = req.params;
    const { status, admin_notes } = req.body;

    if (!status) {
        return res.status(400).json({ message: 'Status is required for update.' });
    }

    try {
        const [result] = await db.query(
            'UPDATE demo_requests SET status = ?, admin_notes = ? WHERE request_id = ?',
            [status, admin_notes, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Demo request not found.' });
        }

        res.json({ message: 'Demo request updated successfully.' });
    } catch (err) {
        console.error('❌ Failed to update demo request:', err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;