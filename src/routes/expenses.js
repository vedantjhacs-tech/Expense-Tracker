
const express = require("express");
const pool = require("../db");

const router = express.Router();

// GET: Fetch all expenses
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

// POST: Add a new expense
router.post("/", async (req, res) => {
    try {
        const { amount, category, expense_date, note } = req.body;

        // Validate expense details
        if (
            !Number.isFinite(Number(amount)) ||
            Number(amount) <= 0 ||
            !category?.trim() ||
            !expense_date
        ) {
            return res.status(400).json({
                message: "Please provide valid expense details"
            });
        }

        const result = await pool.query(
            `INSERT INTO expenses (amount, category, expense_date, note)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [amount, category, expense_date, note]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Error adding expense:", error.message);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
