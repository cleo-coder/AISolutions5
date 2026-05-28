const mysql = require('mysql2');
const dotenv = require('dotenv');
dotenv.config();

// Standard connection pool utilizing your live cloud environment variables
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

// Clean, backwards-compatible exports matching your routes exactly
module.exports = {
    query: (text, params) => promisePool.query(text, params),
    execute: (text, params) => promisePool.execute(text, params),
    pool: promisePool
};