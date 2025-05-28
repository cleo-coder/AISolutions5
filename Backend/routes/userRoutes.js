const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verifyToken = require('../middleware/verifyToken');
const bcrypt = require('bcryptjs');
// Import the notification helper functions
const { createNotification, notifyAdmins } = require('../utils/notificationHelper'); 

router.get('/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const authUserId = req.user.userId;
    const authUserRole = req.user.role;

    const requestedUserIdString = String(id);
    const authenticatedUserIdString = String(authUserId);

    if (requestedUserIdString !== authenticatedUserIdString && authUserRole !== 'admin') {
        console.warn(`Attempted unauthorized access: User ${authUserId} (Role: ${authUserRole}) tried to view user ${id}.`);
        return res.status(403).json({ message: 'Forbidden: You can only view your own profile unless you are an administrator.' });
    }

    try {
        const [rows] = await db.query(
            'SELECT user_id, full_name, username, email, company_name FROM users WHERE user_id = ?',
            [requestedUserIdString]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error('❌ Error fetching user:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.put('/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { full_name, username, email, company_name } = req.body;
    const authUserId = req.user.userId;

    if (String(id) !== String(authUserId)) {
        return res.status(403).json({ message: 'Forbidden: You can only update your own profile.' });
    }

    try {
        const [result] = await db.query(
            'UPDATE users SET full_name = ?, username = ?, email = ?, company_name = ? WHERE user_id = ?',
            [full_name, username, email, company_name, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found or no changes provided.' });
        }

        // --- Notifications for User Profile Update ---
        // Notify the user themselves
        await createNotification(authUserId, 'Your profile has been successfully updated.');
        
        // Notify all admins about the profile update
        // Fetch the user's current email for the admin notification message
        const [userRows] = await db.query('SELECT email FROM users WHERE user_id = ?', [authUserId]);
        const userEmail = userRows.length > 0 ? userRows[0].email : `ID: ${authUserId}`; // Fallback if email not found
        await notifyAdmins(`User ${userEmail} updated their profile.`);
        // --- End Notifications ---

        res.json({ message: 'Profile updated successfully' });
    } catch (err) {
        console.error('❌ Error updating user:', err);
        if (err.code === 'ER_DUP_ENTRY') {
            let field = 'unknown field';
            if (err.message.includes('username')) field = 'username';
            else if (err.message.includes('email')) field = 'email';
            return res.status(409).json({ message: `A user with this ${field} already exists.` });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.put('/:id/password', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { current_password, new_password } = req.body;
    const authUserId = req.user.userId;

    if (String(id) !== String(authUserId)) {
        return res.status(403).json({ message: 'Forbidden: You can only change your own password.' });
    }

    if (!current_password || !new_password) {
        return res.status(400).json({ message: 'Current password and new password are required.' });
    }
    if (new_password.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
    }

    try {
        const [rows] = await db.query('SELECT password_hash FROM users WHERE user_id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const user = rows[0];
        // Ensure you are comparing against the correct hashed password field name in your DB schema (password_hash vs password)
        const isMatch = await bcrypt.compare(current_password, user.password_hash || user.password); // Added user.password fallback
        
        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect current password.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(new_password, salt);

        // Ensure you are updating the correct password hash field name (password_hash vs password)
        await db.query(
            'UPDATE users SET password = ? WHERE user_id = ?', // Changed to 'password' based on authRoutes usage
            [hashedPassword, id]
        );

        res.json({ message: 'Password updated successfully!' });

    } catch (err) {
        console.error('❌ Error updating password:', err);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

router.get('/:id/stats', verifyToken, async (req, res) => {
    const userId = req.params.id;
    const authUserId = req.user.userId;
    const authUserRole = req.user.role;

    const requestedUserIdString = String(userId);
    const authenticatedUserIdString = String(authUserId);

    if (requestedUserIdString !== authenticatedUserIdString && authUserRole !== 'admin') {
        console.warn(`Attempted unauthorized stats access: User ${authUserId} (Role: ${authUserRole}) tried to view stats for user ${userId}.`);
        return res.status(403).json({ message: 'Forbidden: You can only view your own stats unless you are an administrator.' });
    }

    try {
        const [[{ demo_requests }]] = await db.query(
            'SELECT COUNT(*) AS demo_requests FROM demo_requests WHERE user_id = ?', [requestedUserIdString]
        );
        const [[{ event_registrations }]] = await db.query(
            'SELECT COUNT(*) AS event_registrations FROM event_registrations WHERE user_id = ?', [requestedUserIdString]
        );
        const [[{ features_accessed }]] = await db.query(
            'SELECT COUNT(*) AS features_accessed FROM product_access WHERE user_id = ?', [requestedUserIdString]
        );

        res.json({ demo_requests, event_registrations, features_accessed });
    } catch (err) {
        console.error('❌ Error fetching user stats:', err);
        res.status(500).json({ message: 'Failed to fetch stats' });
    }
});

router.get('/product-access-status', verifyToken, async (req, res) => {
    const userId = req.user.userId;

    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: User ID missing.' });
    }

    try {
        const [accessStatuses] = await db.query(
            'SELECT product_name, status FROM product_access WHERE user_id = ?',
            [userId]
        );
        res.json(accessStatuses);
    } catch (err) {
        console.error('❌ Error fetching product access status for user:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;