import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { initIndexing } from '../services/indexService.js';

const router = express.Router();

const upload = multer({ dest: 'uploads/' });

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) throw new Error('No file uploaded');

    const ext = path.extname(req.file.originalname).toLowerCase(); 
    const typedPath = ext ? `${req.file.path}${ext}` : req.file.path;

    fs.renameSync(req.file.path, typedPath);

    console.log('📩 /upload', {
      original: req.file.originalname,
      savedAs: typedPath,
      mime: req.file.mimetype,
      size: req.file.size
    });

    await initIndexing(typedPath);

    fs.unlinkSync(typedPath);

    res.json({ success: true, message: 'File indexed successfully' });
  } catch (error) {
    console.error('Upload index error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/url-or-text', async (req, res) => {
  try {
    const { input } = req.body;
    console.log('📩 /url-or-text', input);
    await initIndexing(input);
    res.json({ success: true, message: 'Content indexed successfully' });
  } catch (error) {
    console.error('URL/Text index error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
