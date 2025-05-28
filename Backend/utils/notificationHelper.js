const db = require('../config/db'); // Ensure this path is correct for your database connection

/**
 * Inserts a new notification into the database.
 * @param {number} userId - The ID of the user who should receive the notification.
 * @param {string} message - The content of the notification.
 * @returns {Promise<void>}
 */
async function createNotification(userId, message) {
    if (!userId || !message) {
        console.warn('Attempted to create notification with missing userId or message.');
        return;
    }
    try {
        await db.query(
            'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
            [userId, message]
        );
        // console.log(`✉️ Notification created for user ${userId}: "${message}"`); // Uncomment for verbose logging
    } catch (error) {
        console.error(`❌ Error creating notification for user ${userId}:`, error.message);
        // It's important to log this error but not block the main operation
    }
}

/**
 * Fetches the IDs of all users with the 'admin' role.
 * @returns {Promise<number[]>} An array of admin user IDs.
 */
async function getAdminUserIds() {
    try {
        const [adminUsers] = await db.query('SELECT id FROM users WHERE role = "admin"');
        return adminUsers.map(admin => admin.id);
    } catch (error) {
        console.error('❌ Error fetching admin user IDs for notification:', error.message);
        return []; // Return an empty array to prevent errors downstream
    }
}

/**
 * Creates notifications for all administrators.
 * @param {string} message - The message content for the admin notification.
 */
async function notifyAdmins(message) {
    const adminIds = await getAdminUserIds();
    for (const adminId of adminIds) {
        await createNotification(adminId, message);
    }
}

module.exports = {
    createNotification,
    notifyAdmins,
};