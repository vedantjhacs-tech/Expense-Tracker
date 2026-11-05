const express = require("express");

const pool = require("../db");

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM expenses ORDER BY expense_date DESC"
        );

        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching expenses:", error.message);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;