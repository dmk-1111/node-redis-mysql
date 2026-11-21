// dbConnection.js (ES Modules)
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true, // the request is placed in a queue and waits until a connection is released.
    connectionLimit: 10, // Default 10 means queries are running at the same time
    queueLimit: 0 //Unlimited queue
});

// Check DB Connection
export const checkDatabaseConnection = async () => {
    try {
        const [rows] = await pool.execute('SELECT true AS solution');
        console.log('✅ MySQL connected successfully!', rows[0].solution);

        return true;
    } catch (error) {
        console.error('❌ MySQL connection failed:', error.message);

        return false;
    }
};

export default pool;