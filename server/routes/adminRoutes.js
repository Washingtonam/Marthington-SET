import express from 'express';
import jwt from 'jsonwebtoken';
import Question from '../models/Question.js';
import User from '../models/User.js';
import { getDemoAnalytics, isDatabaseReady } from '../utils/demoStore.js';

const router = express.Router();

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super-secret');
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin123') {
    const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET || 'super-secret');
    return res.json({ token });
  }
  return res.status(401).json({ message: 'Invalid credentials' });
});

router.get('/questions', authMiddleware, async (_req, res) => {
  const questions = await Question.find().lean();
  res.json(questions);
});

router.post('/questions', authMiddleware, async (req, res) => {
  const question = new Question(req.body);
  await question.save();
  res.json(question);
});

router.put('/questions/:id', authMiddleware, async (req, res) => {
  const updated = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

router.delete('/questions/:id', authMiddleware, async (req, res) => {
  await Question.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

router.get('/analytics', authMiddleware, async (_req, res) => {
  if (!isDatabaseReady()) {
    return res.json(getDemoAnalytics());
  }

  const totalTestTakers = await User.countDocuments();
  const paidUsers = await User.countDocuments({ hasPaid: true });
  const conversionRate = totalTestTakers ? (paidUsers / totalTestTakers) * 100 : 0;
  const totalRevenue = paidUsers * 49;
  res.json({ totalTestTakers, conversionRate, totalRevenue, completionFunnel: { started: totalTestTakers, completed: totalTestTakers, paid: paidUsers } });
});

export default router;
