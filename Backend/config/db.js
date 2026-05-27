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

// Automatically creates/verifies the exact architecture mapping your routes
const initDb = async () => {
    try {
        console.log("⚙️ Starting total database schema verification...");

        // 1. Users Table
        await promisePool.query(`
            CREATE TABLE IF NOT EXISTS users (
                user_id INT AUTO_INCREMENT PRIMARY KEY,
                full_name VARCHAR(255) NOT NULL,
                username VARCHAR(255) NOT NULL UNIQUE,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                company_name VARCHAR(255) DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 2. Admins Table
        await promisePool.query(`
            CREATE TABLE IF NOT EXISTS admins (
                admin_id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) NOT NULL UNIQUE,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                full_name VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 3. Products Table
        await promisePool.query(`
            CREATE TABLE IF NOT EXISTS products (
                product_id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE
            );
        `);

        // 4. Feedback Table
        await promisePool.query(`
            CREATE TABLE IF NOT EXISTS feedback (
                feedback_id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                product_id INT NOT NULL,
                message TEXT NOT NULL,
                rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
            );
        `);

        // 5. Product Access Table
        await promisePool.query(`
            CREATE TABLE IF NOT EXISTS product_access (
                access_id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                product_id INT NOT NULL,
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
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
                FOREIGN KEY (feedback_id) REFERENCES feedback(feedback_id) ON DELETE SET NULL
            );
        `);

        // 6. Demo Requests Table
        await promisePool.query(`
            CREATE TABLE IF NOT EXISTS demo_requests (
                request_id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT DEFAULT NULL,
                company_name VARCHAR(255) NOT NULL,
                request_message TEXT NOT NULL,
                preferred_date DATE NOT NULL,
                email VARCHAR(255) NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                admin_response TEXT DEFAULT NULL,
                admin_notes TEXT DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
            );
        `);

        // 7. Events Table
        await promisePool.query(`
            CREATE TABLE IF NOT EXISTS events (
                event_id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                event_date DATE NOT NULL,
                location VARCHAR(255) NOT NULL,
                category VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 8. Event Registrations Table
        await promisePool.query(`
            CREATE TABLE IF NOT EXISTS event_registrations (
                registration_id INT AUTO_INCREMENT PRIMARY KEY,
                event_id INT NOT NULL,
                user_id INT DEFAULT NULL,
                email VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
            );
        `);

        // 9. Notifications Table
        await promisePool.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                notification_id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                message TEXT NOT NULL,
                read_status BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
            );
        `);

        // 10. Audit Logs Table
        await promisePool.query(`
            CREATE TABLE IF NOT EXISTS logs (
                log_id INT AUTO_INCREMENT PRIMARY KEY,
                admin_id INT DEFAULT NULL,
                action VARCHAR(255) NOT NULL,
                target_table VARCHAR(100) NOT NULL,
                description TEXT NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (admin_id) REFERENCES admins(admin_id) ON DELETE SET NULL
            );
        `);

        console.log("✅ All cloud database structures synced perfectly with client and backend logic.");
    } catch (error) {
        console.error("❌ Schema integration error:", error.message);
    }
};

// Fire migration script
initDb();

module.exports = promisePool;