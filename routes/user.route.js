import express from 'express';
import { index, store } from '../controllers/userController.js';

const router = express.Router();

// Display users
router.get('/', index);

// Submit user
router.post('/create', store);

export default router;