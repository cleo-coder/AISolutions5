// notificationRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verifyToken = require('../middleware/verifyToken');

module.exports = (io) => {

    router.get('/', verifyToken, async (req, res) => {
        try {
            const userId = req.user.userId;
            const [notifications] = await db.query(
                'SELECT notification_id, message, read_status, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
                [userId]
            );
            res.json(notifications);
        } catch (err) {
            console.error('❌ Error fetching notifications:', err);
            res.status(500).json({ message: 'Internal server error.' });
        }
    });

    router.put('/:id/read', verifyToken, async (req, res) => {
        const { id } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;

        try {
            const [notification] = await db.query('SELECT user_id FROM notifications WHERE notification_id = ?', [id]);

            if (notification.length === 0) {
                return res.status(404).json({ message: 'Notification not found.' });
            }

            if (notification[0].user_id !== userId && userRole !== 'admin') {
                return res.status(403).json({ message: 'Forbidden: You can only mark your own notifications as read.' });
            }

            await db.query('UPDATE notifications SET read_status = TRUE WHERE notification_id = ?', [id]);
            res.json({ message: 'Notification marked as read.' });

            if (notification[0].user_id) {
                io.to(notification[0].user_id.toString()).emit('notificationRead', { notificationId: id, userId: notification[0].user_id });
            }

        } catch (err) {
            console.error('❌ Error marking notification as read:', err);
            res.status(500).json({ message: 'Internal server error.' });
        }
    });

    router.delete('/:id', verifyToken, async (req, res) => {
        const { id } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;

        try {
            const [notification] = await db.query('SELECT user_id FROM notifications WHERE notification_id = ?', [id]);

            if (notification.length === 0) {
                return res.status(404).json({ message: 'Notification not found.' });
            }

            if (notification[0].user_id !== userId && userRole !== 'admin') {
                return res.status(403).json({ message: 'Forbidden: You can only delete your own notifications.' });
            }

            await db.query('DELETE FROM notifications WHERE notification_id = ?', [id]);
            res.json({ message: 'Notification deleted successfully.' });

            if (notification[0].user_id) {
                io.to(notification[0].user_id.toString()).emit('notificationDeleted', { notificationId: id, userId: notification[0].user_id });
            }

        } catch (err) {
            console.error('❌ Error deleting notification:', err);
            res.status(500).json({ message: 'Internal server error.' });
        }
    });

    router.createAndEmitNotification = async (userId, message) => {
        try {
            const [result] = await db.query(
                'INSERT INTO notifications (user_id, message, read_status) VALUES (?, ?, FALSE)',
                [userId, message]
            );
            const newNotificationId = result.insertId;

            const [newNotification] = await db.query(
                'SELECT notification_id, message, read_status, created_at FROM notifications WHERE notification_id = ?',
                [newNotificationId]
            );

            if (newNotification.length > 0) {
                io.to(userId.toString()).emit('newNotification', newNotification[0]);
                console.log(`✉️ New notification emitted to user ${userId}: ${message}`);
            }
            return newNotification[0];
        } catch (error) {
            console.error('Error creating and emitting notification:', error);
            throw error;
        }
    };

    return router;
};