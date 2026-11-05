const { Pool } = require("pg");

require("dotenv").config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL_POOLED,
    ssl: {
        rejectUnauthorized: false
    }
});

module.exports = pool;