import { generateContent } from '../controllers/aiController.js';
import express from 'express';

const router = express.Router();

// The generation door
// Route: POST /api/generate
router.post('/', generateContent);

export default router;