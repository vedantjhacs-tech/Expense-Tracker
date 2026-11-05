const pool = require("./db");

async function setupDatabase() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id BIGSERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS expenses (
                id BIGSERIAL PRIMARY KEY,
                user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
                amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
                category VARCHAR(50) NOT NULL,
                expense_date DATE NOT NULL,
                note TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);

        console.log("Database tables created successfully!");
    } catch (error) {
        console.error("Database setup failed:", error.message);
    } finally {
        await pool.end();
    }
}

setupDatabase();