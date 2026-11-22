import pool from '../config/dbConnection.js';
import redisClient from '../config/redisConnection.js';

const CACHE_KEY = 'users:all';

// Display users
export const index = async (req, res) => {
    try {
        let users = [];

        const reqSearch = (req.query.reqSearch || '').trim();

        if (reqSearch !== '') {
            // Search data
            users = await search(reqSearch);
        } else {
            // 1. Check Redis cache
            const cachedUsers = await redisClient.get(CACHE_KEY);

            if (cachedUsers) {
                console.log('Redis Cache HIT');

                users = JSON.parse(cachedUsers);
            } else {
                console.log('Redis Cache MISS');

                // 2. Query PostgreSQL
                const result = await pool.query(
                    'SELECT * FROM users ORDER BY id DESC'
                );

                users = result.rows;

                // 3. Store data in Redis for 60 seconds
                await redisClient.setEx(
                    CACHE_KEY,
                    60,
                    JSON.stringify(users)
                );

                // 4. Store individual users in Redis hashes
                for (const user of users) {
                    await redisClient.hSet(`users:hash:${user.id}`, {
                        id: String(user.id),
                        name: user.name,
                        email: user.email
                    });
                }
            }
        }

        return res.render('index', { users, reqSearch });

    } catch (error) {
        console.error(error.message);
        return res.status(500).send('Error message: ' + error.message);
    }
};

// Search users
const search = async (reqSearch) => {
    const keys = await redisClient.keys('users:hash:*');

    // 1. Get users from Redis hashes
    const users = await Promise.all(
        keys.map(key => redisClient.hGetAll(key))
    );

    // 2. Search in Redis
    let rows = users.filter(user =>
        user.name?.toLowerCase().includes(reqSearch.toLowerCase()) ||
        user.email?.toLowerCase().includes(reqSearch.toLowerCase())
    );

    // 3. If no matching data in Redis, search PostgreSQL
    if (rows.length === 0) {
        console.log('Redis Search MISS - Querying PostgreSQL');

        const result = await pool.query(
            `SELECT * FROM users
             WHERE name ILIKE $1 OR email ILIKE $1
             ORDER BY id DESC`,
            [`%${reqSearch}%`]
        );

        rows = result.rows;

        // 4. Store PostgreSQL results in Redis hashes
        for (const user of rows) {
            await redisClient.hSet(`users:hash:${user.id}`, {
                id: String(user.id),
                name: user.name,
                email: user.email
            });
        }
    } else {
        console.log('Redis Search HIT');
    }

    return rows;
};

// Submit user
export const store = async (req, res) => {
    try {
        const { email, name } = req.body;

        // 1. Check existing email
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1 LIMIT 1',
            [email]
        );

        if (existingUser.rows.length > 0) {
            const result = await pool.query(
                'SELECT * FROM users ORDER BY id DESC'
            );

            return res.status(409).render('index', {
                users: result.rows,
                error: 'Email already exists!',
                old: { name, email },
                reqSearch: ''
            });
        }

        // 2. Insert user
        const result = await pool.query(
            `INSERT INTO users (name, email)
             VALUES ($1, $2)
             RETURNING id`,
            [name, email]
        );

        const userId = result.rows[0].id;

        // 3. Store the new user in Redis hash
        await redisClient.hSet(`users:hash:${userId}`, {
            id: String(userId),
            name,
            email
        });

        // 4. Clear all users cache
        await redisClient.del(CACHE_KEY);

        return res.redirect('/users/');

    } catch (error) {
        console.error(error.message);
        return res.status(500).send('Error message: ' + error.message);
    }
};