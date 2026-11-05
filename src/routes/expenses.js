
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

// PUT: Update an existing expense
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, category, expense_date, note } = req.body;

        if (
            !Number.isInteger(Number(id)) ||
            Number(id) <= 0 ||
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
            `UPDATE expenses
             SET amount = $1,
                 category = $2,
                 expense_date = $3,
                 note = $4
             WHERE id = $5
             RETURNING *`,
            [amount, category, expense_date, note, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Expense not found"
            });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error updating expense:", error.message);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
