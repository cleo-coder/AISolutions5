/*backend/models/User.js*/

const db = require('../config/db');

const createUser = (full_name, email, hashedPassword) => {
    const sql = 'INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)';
    return db.query(sql, [full_name, email, hashedPassword]);
};

const findUserByEmail = (email) => {
    const sql = 'SELECT * FROM users WHERE email = ? LIMIT 1';
    return db.query(sql, [email]);
};

module.exports = { createUser, findUserByEmail };
