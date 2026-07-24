import express from 'express';
import jwt from 'jsonwebtoken';
import Question from '../models/Question.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
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

router.post('/questions/bulk-import', authMiddleware, async (req, res) => {
  try {
    const payload = Array.isArray(req.body) ? req.body : req.body?.questions;
    if (!Array.isArray(payload)) {
      return res.status(400).json({ message: 'Expected an array of questions' });
    }

    const items = payload.map((item) => ({
      ...item,
      questionText: item.questionText || item.question || '',
      options: Array.isArray(item.options) ? item.options : [],
      correctAnswerIndex: typeof item.correctAnswerIndex === 'number' ? item.correctAnswerIndex : null,
      category: item.category || 'general',
      educationLevel: item.educationLevel || 'general',
      topic: item.topic || '',
      sourceTextbook: item.sourceTextbook || '',
      questionType: item.questionType || 'multiple_choice',
      passageText: item.passageText || '',
      imageUrl: item.imageUrl || '',
      isVerified: typeof item.isVerified === 'boolean' ? item.isVerified : true
    }));

    const saved = await Question.insertMany(items);
    res.json({ ok: true, inserted: saved.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/questions/:id', authMiddleware, async (req, res) => {
  const updated = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

router.delete('/questions/:id', authMiddleware, async (req, res) => {
  await Question.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

router.post('/categories', authMiddleware, async (req, res) => {
  try {
    const category = new Category(req.body);
    await category.save();
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
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
