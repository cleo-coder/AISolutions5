const mysql = require('mysql2');
const dotenv = require('dotenv');
dotenv.config();

console.log("DB config values:", {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
});

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const promisePool = pool.promise();

const initDb = async () => {
    try {
        console.log("🧹 Dropping outdated tables to clear memory schema...");

        // 1. Temporarily turn off foreign keys so we don't get dropping order errors
        await promisePool.query('SET FOREIGN_KEY_CHECKS = 0;');
        
        // 2. Drop everything so it builds perfectly fresh
        await promisePool.query('DROP TABLE IF EXISTS product_access;');
        await promisePool.query('DROP TABLE IF EXISTS feedback;');
        await promisePool.query('DROP TABLE IF EXISTS demo_requests;');
        await promisePool.query('DROP TABLE IF EXISTS event_registrations;');
        await promisePool.query('DROP TABLE IF EXISTS notifications;');
        await promisePool.query('DROP TABLE IF EXISTS logs;');
        await promisePool.query('DROP TABLE IF EXISTS users;');
        await promisePool.query('DROP TABLE IF EXISTS admins;');
        await promisePool.query('DROP TABLE IF EXISTS products;');
        await promisePool.query('DROP TABLE IF EXISTS events;');

        // 3. Re-enable constraint checks
        await promisePool.query('SET FOREIGN_KEY_CHECKS = 1;');

        console.log("⚙️ Building fresh, aligned database tables...");

        // Users Table (Now guaranteed to include full_name and company_name)
        await promisePool.query(`
            CREATE TABLE users (
                user_id INT AUTO_INCREMENT PRIMARY KEY,
                full_name VARCHAR(255) NOT NULL,
                username VARCHAR(255) NOT NULL UNIQUE,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                company_name VARCHAR(255) DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Admins Table
        await promisePool.query(`
            CREATE TABLE admins (
                admin_id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) NOT NULL UNIQUE,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                full_name VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Products Table
        await promisePool.query(`
            CREATE TABLE products (
                product_id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE
            );
        `);

        // Feedback Table
        await promisePool.query(`
            CREATE TABLE feedback (
                feedback_id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                product_id INT DEFAULT NULL,
                message TEXT NOT NULL,
                rating INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
            );
        `);

        // Product Access Table
        await promisePool.query(`
            CREATE TABLE product_access (
                access_id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                product_id INT DEFAULT NULL,
                product_name VARCHAR(255) DEFAULT NULL,
                granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                granted_by INT DEFAULT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                revoked_at TIMESTAMP NULL DEFAULT NULL,
                revoked_by INT DEFAULT NULL,
                cost DECIMAL(10,2) DEFAULT 0.00,
                feedback_id INT DEFAULT NULL,
                assigned_to VARCHAR(255) DEFAULT NULL,
                job_title VARCHAR(255) DEFAULT NULL,
                admin_notes TEXT DEFAULT NULL,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
            );
        `);

        // Demo Requests Table
        await promisePool.query(`
            CREATE TABLE demo_requests (
                request_id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT DEFAULT NULL,
                company_name VARCHAR(255) NOT NULL,
                request_message TEXT NOT NULL,
                preferred_date DATE NOT NULL,
                email VARCHAR(255) NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                admin_response TEXT DEFAULT NULL,
                admin_notes TEXT DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Events Table
        await promisePool.query(`
            CREATE TABLE events (
                event_id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                event_date DATE NOT NULL,
                location VARCHAR(255) NOT NULL,
                category VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Event Registrations Table
        await promisePool.query(`
            CREATE TABLE event_registrations (
                registration_id INT AUTO_INCREMENT PRIMARY KEY,
                event_id INT NOT NULL,
                user_id INT DEFAULT NULL,
                email VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE
            );
        `);

        // Notifications Table
        await promisePool.query(`
            CREATE TABLE notifications (
                notification_id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                message TEXT NOT NULL,
                read_status BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
            );
        `);

        // Logs Table
        await promisePool.query(`
            CREATE TABLE logs (
                log_id INT AUTO_INCREMENT PRIMARY KEY,
                admin_id INT DEFAULT NULL,
                action VARCHAR(255) NOT NULL,
                target_table VARCHAR(100) NOT NULL,
                description TEXT NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log("✅ Wiped out old instances and rebuilt clean schemas on Aiven!");
    } catch (error) {
        console.error("❌ Schema integration error:", error.message);
    }
};

initDb();

module.exports = promisePool;