import pool from '../config/dbConnection.js';
import redisClient from '../config/redisConnection.js';

const CACHE_KEY = 'users:all';

// Display users
export const index = async (req, res) => {
    try {
        let users = null;

        const reqSearch = (req.query.reqSearch || '').trim();

        if (reqSearch !== '') {
            // Search data
            users = await search(reqSearch);
        }else{

            // 1. Check Redis cache
            const cachedUsers = await redisClient.get(CACHE_KEY);
    
            if (cachedUsers) {
                console.log('Redis Cache HIT');
    
                users = JSON.parse(cachedUsers);
    
            } else {
                console.log('Redis Cache MISS');
    
                // 2. Query MySQL
                const [rows] = await pool.execute(
                    'SELECT * FROM users ORDER BY id DESC'
                );
    
                users = rows;
    
                // 3. Store data in Redis for 60 seconds
                await redisClient.setEx(
                    CACHE_KEY,
                    60,
                    JSON.stringify(users)
                );
            }
        }

        res.render('index', { users, reqSearch });

    } catch (error) {
        console.error(error.message);
        return res.status(500).send('Error message: ' + error.message);
    }
};

const search = async (reqSearch) => {
    const keys = await redisClient.keys('users:hash:*');
    let rows = [];

    // 1. Mapping keys
    let users = await Promise.all(
        keys.map(key => redisClient.hGetAll(key))
    );

    // 2. Search Redis
    rows = users.filter(user =>
        user.name?.toLowerCase().includes(reqSearch.toLowerCase()) ||
        user.email?.toLowerCase().includes(reqSearch.toLowerCase())
    );

    if(rows.length === 0){
        const [mysqlRows] = await pool.execute(
            `SELECT * FROM users
            WHERE name LIKE ? OR email LIKE ?
            ORDER BY id DESC`,
            [`%${reqSearch}%`, `%${reqSearch}%`]
        );
        rows = mysqlRows;
        // 3. Store MySQL results in Redis
        for (const user of mysqlRows) {
            await redisClient.hSet(`users:hash:${user.id}`, {
                id: String(user.id),
                name: user.name,
                email: user.email
            });
        }
    }

    return rows;
}

// Submit user
export const store = async (req, res) => {
    try {
        const { email, name } = req.body;

        // Check existing email
        const [existingUser] = await pool.execute(
            'SELECT id FROM users WHERE email = ? LIMIT 1',
            [email]
        );

        if (existingUser.length > 0) {

            const [users] = await pool.execute(
                'SELECT * FROM users ORDER BY id DESC'
            );

            return res.status(409).render('index', {
                users,
                error: 'Email already exists!',
                old: { name, email }
            });
        }

        // Insert user
        await pool.execute(
            'INSERT INTO users (name, email) VALUES (?, ?)',
            [name, email]
        );

        // Clear Redis cache
        await redisClient.del(CACHE_KEY);

        return res.redirect('/users/');

    } catch (error) {
        console.error(error.message);
         return res.status(500).send('Error message: ' + error.message);
    }
};