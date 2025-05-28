// Backend/routes/feedbackRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verifyToken = require('../middleware/verifyToken');

router.post('/', verifyToken, async (req, res) => {
    const { message, rating, productId } = req.body;
    const userId = req.user.userId;

    if (!userId) {
        return res.status(401).json({ message: 'User not authenticated.' });
    }
    if (!message || message.trim() === '') {
        return res.status(400).json({ message: 'Feedback message is required.' });
    }
    if (rating === undefined || rating === null || rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Rating must be a number between 1 and 5.' });
    }
    const numericProductId = parseInt(productId, 10);
    if (isNaN(numericProductId) || numericProductId <= 0) {
        return res.status(400).json({ message: 'Valid Product ID is required to link feedback.' });
    }

    try {
        // Log values received from frontend and token for clarity
        console.log(`Feedback submission for User ID: ${userId}, Product ID: ${numericProductId}, Rating: ${rating}, Message: "${message}"`);

        // 1. Insert feedback into the feedback table, including product_id
        const [result] = await db.query(
            'INSERT INTO feedback (user_id, message, rating, product_id) VALUES (?, ?, ?, ?)',
            [userId, message, rating, numericProductId]
        );

        if (result.affectedRows === 0) {
            throw new Error('Failed to insert feedback into the database.');
        }

        const newFeedbackId = result.insertId;

        // Log values just before the UPDATE product_access query
        console.log(`Attempting to update product_access with newFeedbackId: ${newFeedbackId}, userId: ${userId}, productId: ${numericProductId}`);

        // 2. Update the corresponding product_access entry with the new feedback_id
        const [updateAccessResult] = await db.query(
            'UPDATE product_access SET feedback_id = ? WHERE user_id = ? AND product_id = ?',
            [newFeedbackId, userId, numericProductId]
        );

        // Log the result of the UPDATE query
        console.log(`Product access update affected rows: ${updateAccessResult.affectedRows}`);

        if (updateAccessResult.affectedRows === 0) {
            console.warn(`No product_access entry found or updated for User ID: ${userId}, Product ID: ${numericProductId}. Feedback was submitted but not linked.`);
        }

        res.status(201).json({ message: 'Feedback submitted and linked successfully!', feedbackId: newFeedbackId });
    } catch (err) {
        console.error('❌ Error submitting feedback or linking to product access:', err);
        res.status(500).json({ message: 'Server error during feedback submission.' });
    }
});

module.exports = router;