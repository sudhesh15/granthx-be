import express from 'express';
import { chatWithContext } from '../services/chatService.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { query } = req.body;

    const response = await chatWithContext(query);

    res.json({ success: true, response });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
