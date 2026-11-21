import express from 'express';
import dotenv from 'dotenv';
import path from 'path';

import userRoutes from './routes/user.route.js';
import { connectRedis } from './config/redisConnection.js';
import { checkDatabaseConnection } from './config/dbConnection.js';

dotenv.config();

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Set static public
app.use(express.static(path.join(import.meta.dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', './views');

// Routes

app.get('/', (req, res) => {
    res.redirect('/users');
});

app.use('/users', userRoutes);

const PORT = process.env.PORT || 3000;

const startServer = async () => {

    // Start Express server
    app.listen(PORT, () => {
        console.log(`🚀 Server running at http://localhost:${PORT}/users`);
    });

    // Connect Mysql and Redis separately
    try {
        await checkDatabaseConnection();
        await connectRedis();
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
    }
};

startServer();