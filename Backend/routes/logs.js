const express = require("express");
const router = express.Router();
const pool = require("../db");

router.post("/", async (req, res) => {
    const { admin_id, action, target_table, description } = req.body;
    try {
        await pool.query(
            "INSERT INTO logs (admin_id, action, target_table, description) VALUES (?, ?, ?, ?)",
            [admin_id, action, target_table, description]
        );
        res.status(201).json({ message: "Log recorded" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get("/", async (req, res) => {
    try {
        const [rows] = await pool.query(`
      SELECT l.*, u.username AS admin_username
      FROM logs l
      LEFT JOIN users u ON l.admin_id = u.user_id
      ORDER BY l.timestamp DESC
    `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;