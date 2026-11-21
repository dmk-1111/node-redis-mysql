import pool from '../config/dbConnection.js';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

//npm run migrate

async function migrate() {
    const connection = await pool.getConnection();

    try {
        await connection.query(`
            CREATE TABLE IF NOT EXISTS migrations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                migration VARCHAR(255) NOT NULL UNIQUE,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        const migrationDir = path.resolve('migrations');

        const files = fs.readdirSync(migrationDir)
            .filter(file => file.endsWith('.js'))
            .sort();

        const [executed] = await connection.query(
            'SELECT migration FROM migrations'
        );

        const executedFiles = executed.map(item => item.migration);

        for (const file of files) {
            if (executedFiles.includes(file)) {
                console.log(`Already migrated: ${file}`);
                continue;
            }

            console.log(`Running migration: ${file}`);

            const migration = await import(
                pathToFileURL(path.join(migrationDir, file)).href
            );

            await connection.beginTransaction();

            try {
                await migration.up(connection);

                await connection.query(
                    'INSERT INTO migrations (migration) VALUES (?)',
                    [file]
                );

                await connection.commit();

                console.log(`Completed: ${file}`);

            } catch (error) {
                await connection.rollback();
                throw error;
            }
        }

    } catch (error) {
        console.error('Migration failed:', error);

    } finally {
        connection.release();
        await pool.end();
    }
}

migrate();