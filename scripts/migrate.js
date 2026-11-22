import pool from '../config/dbConnection.js';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

// npm run migrate

async function migrate() {
    const connection = await pool.connect();

    try {
        // Create migrations table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS migrations (
                id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                migration VARCHAR(255) NOT NULL UNIQUE,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        const migrationDir = path.resolve('migrations');

        // Get migration files
        const files = fs.readdirSync(migrationDir)
            .filter(file => file.endsWith('.js'))
            .sort();

        // Get executed migrations
        const result = await connection.query(
            'SELECT migration FROM migrations'
        );

        const executedFiles = result.rows.map(item => item.migration);

        // Run pending migrations
        for (const file of files) {
            if (executedFiles.includes(file)) {
                console.log(`Already migrated: ${file}`);
                continue;
            }

            console.log(`Running migration: ${file}`);

            const migration = await import(
                pathToFileURL(path.join(migrationDir, file)).href
            );

            await connection.query('BEGIN');

            try {
                // Run migration
                await migration.up(connection);

                // Record migration
                await connection.query(
                    'INSERT INTO migrations (migration) VALUES ($1)',
                    [file]
                );

                await connection.query('COMMIT');

                console.log(`Completed: ${file}`);

            } catch (error) {
                await connection.query('ROLLBACK');
                throw error;
            }
        }

        console.log('All migrations completed!');

    } catch (error) {
        console.error('Migration failed:', error);

    } finally {
        connection.release();
        await pool.end();
    }
}

migrate();