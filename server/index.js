import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

import testRoutes from './routes/testRoutes.js';
import leadRoutes from './routes/leadRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import quizRoutes from './routes/quizRoutes.js';

dotenv.config();

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = [
  'http://localhost:5173',
  'https://marthington-set.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api/test', testRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/quiz', quizRoutes);

const startServer = () => {
  const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.warn(`Port ${PORT} is already in use. Another server instance is running, so this process will exit cleanly.`);
      return;
    }

    console.error('Server failed to start:', error);
    process.exit(1);
  });
};

startServer();

const connectMongo = async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.warn('MongoDB not configured, running in demo mode.');
    return;
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected');
  } catch (error) {
    console.warn('Mongo connection unavailable, running in demo mode:', error.message);
  }
};

connectMongo();
