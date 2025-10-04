import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { initIndexing } from '../services/indexService.js';

const router = express.Router();

const uploadDir = '/tmp/uploads';
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    const safeBase =
      path.basename(file.originalname, ext).replace(/[^\w.-]+/g, '_') || 'upload';
    cb(null, `${Date.now()}-${safeBase}${ext.toLowerCase()}`);
  }
});

const upload = multer({ storage });

router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });

  const filePath = req.file.path;
  try {
    console.log('📩 /upload', {
      original: req.file.originalname,
      savedAs: filePath,
      mime: req.file.mimetype,
      size: req.file.size
    });

    await initIndexing(filePath);
    res.json({ success: true, message: 'File indexed successfully' });
  } catch (error) {
    console.error('Upload index error:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    try { fs.unlinkSync(filePath); } catch {}
  }
});

router.post('/url-or-text', async (req, res) => {
  try {
    const { input } = req.body;
    if (!input) return res.status(400).json({ success: false, error: 'Missing input' });
    console.log('📩 /url-or-text', input);
    await initIndexing(input);
    res.json({ success: true, message: 'Content indexed successfully' });
  } catch (error) {
    console.error('URL/Text index error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
