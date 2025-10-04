import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import indexRoutes from './api/indexRoutes.js';
import chatRoutes from './api/chatRoutes.js';

const app = express();

app.use(
  cors({
    origin: [
      'https://granthx.vercel.app',
      'http://localhost:3000',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(express.json());

app.use('/api/index', indexRoutes);
app.use('/api/chat', chatRoutes);

app.get('/', (req, res) => {
  res.json({ ok: true, name: 'GranthX API', env: process.env.NODE_ENV || 'development' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error', message: err.message });
});

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`🚀 API running on http://localhost:${PORT}`));
}

export default app;