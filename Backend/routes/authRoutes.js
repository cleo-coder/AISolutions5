//routes/authRoutes.js//
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const verifyToken = require('../middleware/verifyToken');
// Import the notification helper functions
const { createNotification, notifyAdmins } = require('../utils/notificationHelper');

const DUMMY_HASH = '$2a$10$7EqJtq98hPqEX7fNZaFWoOHiPJoJt3QmY6FzZ58u0g.zTx3h/4PJK'; // random bcrypt hash to prevent timing attacks

async function verifyPassword(plain, hashed) {
    try {
        return await bcrypt.compare(plain, hashed);
    } catch {
        return false;
    }
}

router.post('/register', async (req, res) => {
    const { full_name, username, email, password, company_name } = req.body;

    if (!full_name || !username || !email || !password) {
        return res.status(400).json({ message: 'Please enter all required fields.' });
    }

    try {
        const [existingUser] = await db.query('SELECT user_id FROM users WHERE username = ? OR email = ?', [username, email]);
        if (existingUser.length > 0) {
            return res.status(409).json({ message: 'User with this username or email already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [userResult] = await db.query(
            'INSERT INTO users (full_name, username, email, password, company_name) VALUES (?, ?, ?, ?, ?)',
            [full_name, username, email, hashedPassword, company_name || null]
        );
        const newUserId = userResult.insertId;

        // --- Notifications for User Registration (RETAINED) ---
        // Notify the newly registered user
        await createNotification(newUserId, 'Welcome to our platform! We are thrilled to have you. Explore our features and let us know if you need any help.');

        // Notify all admins about the new user registration
        await notifyAdmins(`New user registered: ${email}`);
        // --- End Notifications ---

        res.status(201).json({ message: 'User registered successfully. Welcome notification sent.' });
    } catch (err) {
        console.error('❌ Error registering user:', err);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Please enter both username and password.' });
    }

    try {
        const [users] = await db.query('SELECT user_id, full_name, username, password, email, company_name FROM users WHERE username = ?', [username]);
        const [admins] = await db.query('SELECT admin_id, username, password FROM admins WHERE username = ?', [username]);

        const user = users[0];
        const admin = admins[0];

        const userPasswordHash = user ? user.password : DUMMY_HASH;
        const adminPasswordHash = admin ? admin.password : DUMMY_HASH;

        const isUserPasswordMatch = await verifyPassword(password, userPasswordHash);
        const isAdminPasswordMatch = await verifyPassword(password, adminPasswordHash);

        if (user && isUserPasswordMatch) {
            const token = jwt.sign(
                {
                    userId: user.user_id,
                    email: user.email,
                    full_name: user.full_name,
                    role: 'user',
                    company_name: user.company_name,
                },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            // --- Login Notifications REMOVED ---
            // await createNotification(user.user_id, 'You have successfully logged in to your account.');
            // await notifyAdmins(`User logged in: ${user.email}`);
            // --- End Removed Notifications ---

            return res.json({ message: 'Logged in as user', token, role: 'user', company_name: user.company_name });
        } else if (admin && isAdminPasswordMatch) {
            const token = jwt.sign(
                { userId: admin.admin_id, role: 'admin' },
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            // --- Login Notifications REMOVED ---
            // await createNotification(admin.admin_id, 'You have successfully logged in as an administrator.');
            // --- End Removed Notifications ---

            return res.json({ message: 'Logged in as admin', token, role: 'admin', company_name: null });
        } else {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }
    } catch (err) {
        console.error('❌ Error during login:', err);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

router.get('/profile', verifyToken, async (req, res) => {
    if (req.user.role !== 'user') {
        return res.status(403).json({ message: 'Forbidden: This resource is for users only.' });
    }
    try {
        const [user] = await db.query('SELECT user_id, full_name, username, email, company_name FROM users WHERE user_id = ?', [req.user.userId]);
        if (user.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.json(user[0]);
    } catch (err) {
        console.error('❌ Error fetching user profile:', err);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// Add this PUT route to your authRoutes.js file
router.put('/profile', verifyToken, async (req, res) => {
    // Ensure only authenticated users (role: 'user') can update their profile
    if (req.user.role !== 'user') {
        return res.status(403).json({ message: 'Forbidden: You do not have permission to update this profile.' });
    }

    const { full_name, username, email, company_name } = req.body;
    const userId = req.user.userId; // Get user ID from the authenticated token

    // Basic validation (you might want more robust validation)
    if (!full_name || !username || !email) {
        return res.status(400).json({ message: 'Full name, username, and email are required.' });
    }

    try {
        // Optional: Check if the new username/email is already taken by another user
        const [existingUsers] = await db.query(
            'SELECT user_id FROM users WHERE (username = ? OR email = ?) AND user_id != ?',
            [username, email, userId]
        );
        if (existingUsers.length > 0) {
            return res.status(409).json({ message: 'Another user already exists with this username or email.' });
        }

        // Update user information in the database
        const [result] = await db.query(
            'UPDATE users SET full_name = ?, username = ?, email = ?, company_name = ? WHERE user_id = ?',
            [full_name, username, email, company_name || null, userId]
        );

        if (result.affectedRows === 0) {
            // It's possible no rows were affected if the new data is identical to existing data
            // In this case, it's not an error but just no change.
            // You might want to return 200 with a specific message like "No changes made"
            // Or let the frontend handle the "no changes" case if it sends only changed fields
            return res.status(200).json({ message: 'No changes made to profile or user not found.' }); // Changed to 200 for "no changes"
        }

        // Successfully updated (or no changes were needed but operation completed)
        res.status(200).json({}); // Return an empty object or minimal success indicator.
        // Frontend determines the specific success message.

    } catch (err) {
        console.error('❌ Error updating user profile:', err);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

module.exports = router;