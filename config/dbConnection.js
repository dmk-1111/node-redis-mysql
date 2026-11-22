// dbConnection.js (ES Modules)
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    max: 10, // Maximum number of connections in the pool
    idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
    connectionTimeoutMillis: 2000 // Timeout if connection takes longer than 2 seconds
});

// Check DB Connection
export const checkDatabaseConnection = async () => {
    try {
        const result = await pool.query('SELECT NOW()');

        console.log('✅ PostgreSQL connected successfully!');
        console.log('Current time:', result.rows[0].now);
    } catch (error) {
        console.error('❌ PostgreSQL connection failed:', error.message);
    }
};

export default pool;