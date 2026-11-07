
const express = require("express");
const pool = require("../db");
const authenticateToken = require("../middleware/auth");

const router = express.Router();

router.use(authenticateToken);

// Validate date format and calendar date
function isValidDate(date) {
    if (typeof date !== "string") return false;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;

    const parsedDate = new Date(date);

    return (
        !Number.isNaN(parsedDate.getTime()) &&
        parsedDate.toISOString().slice(0, 10) === date
    );
}

// Validate expense input
function isValidExpense(amount, category, date, note) {
    return (
        typeof amount === "number" &&
        Number.isFinite(amount) &&
        amount > 0 &&
        typeof category === "string" &&
        category.trim().length > 0 &&
        category.trim().length <= 50 &&
        isValidDate(date) &&
        (note === undefined || note === null ||
            (typeof note === "string" && note.length <= 500))
    );
}

// GET: Fetch logged-in user's expenses
router.get("/", async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM expenses
             WHERE user_id = $1
             ORDER BY expense_date DESC`,
            [req.user.userId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching expenses:", error.message);
        res.status(500).json({ message: "Server error" });
    }
});

// GET: Monthly expense summary
router.get("/summary", async (req, res) => {
    try {
        const { month } = req.query;

        if (
            typeof month !== "string" ||
            !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)
        ) {
            return res.status(400).json({
                message: "Please provide month in YYYY-MM format"
            });
        }

        const startDate = `${month}-01`;

        const [totalResult, categoryResult] = await Promise.all([
            pool.query(
                `SELECT
                    COUNT(*) AS total_expenses,
                    COALESCE(SUM(amount), 0) AS total_amount
                 FROM expenses
                 WHERE user_id = $1
                 AND expense_date >= $2::date
                 AND expense_date < ($2::date + INTERVAL '1 month')`,
                [req.user.userId, startDate]
            ),

            pool.query(
                `SELECT
                    category,
                    SUM(amount) AS total_amount,
                    COUNT(*) AS expense_count
                 FROM expenses
                 WHERE user_id = $1
                 AND expense_date >= $2::date
                 AND expense_date < ($2::date + INTERVAL '1 month')
                 GROUP BY category
                 ORDER BY SUM(amount) DESC`,
                [req.user.userId, startDate]
            )
        ]);

        res.json({
            month,
            totalExpenses: Number(totalResult.rows[0].total_expenses),
            totalAmount: Number(totalResult.rows[0].total_amount),
            categoryBreakdown: categoryResult.rows.map((row) => ({
                category: row.category,
                totalAmount: Number(row.total_amount),
                expenseCount: Number(row.expense_count)
            }))
        });
    } catch (error) {
        console.error("Error generating summary:", error.message);
        res.status(500).json({ message: "Server error" });
    }
});

// POST: Add a new expense
router.post("/", async (req, res) => {
    try {
        const { amount, category, expense_date, note } = req.body;

        if (!isValidExpense(amount, category, expense_date, note)) {
            return res.status(400).json({
                message: "Please provide valid expense details"
            });
        }

        const result = await pool.query(
            `INSERT INTO expenses
             (user_id, amount, category, expense_date, note)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [
                req.user.userId,
                amount,
                category.trim(),
                expense_date,
                note ?? null
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Error adding expense:", error.message);
        res.status(500).json({ message: "Server error" });
    }
});

// PUT: Update user's own expense
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, category, expense_date, note } = req.body;

        if (
            !Number.isSafeInteger(Number(id)) ||
            Number(id) <= 0 ||
            !isValidExpense(amount, category, expense_date, note)
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
             WHERE id = $5 AND user_id = $6
             RETURNING *`,
            [
                amount,
                category.trim(),
                expense_date,
                note ?? null,
                id,
                req.user.userId
            ]
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

// DELETE: Delete user's own expense
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (!Number.isSafeInteger(Number(id)) || Number(id) <= 0) {
            return res.status(400).json({
                message: "Please provide a valid expense ID"
            });
        }

        const result = await pool.query(
            `DELETE FROM expenses
             WHERE id = $1 AND user_id = $2
             RETURNING *`,
            [id, req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Expense not found"
            });
        }

        res.json({
            message: "Expense deleted successfully",
            data: result.rows[0]
        });
    } catch (error) {
        console.error("Error deleting expense:", error.message);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
