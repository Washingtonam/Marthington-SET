import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Question from '../models/Question.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import { createDemoUser, findDemoUserByEmail, getDemoAnalytics, isDatabaseReady, listDemoUsers, updateDemoUserRole } from '../utils/demoStore.js';

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

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (username === 'admin' && password === 'admin123') {
    const token = jwt.sign({ role: 'superadmin', email: 'admin@marthington.local' }, process.env.JWT_SECRET || 'super-secret');
    return res.json({ token, user: { email: 'admin@marthington.local', role: 'superadmin' } });
  }

  const normalizedEmail = (username || '').toLowerCase().trim();

  if (!isDatabaseReady()) {
    const demoUser = findDemoUserByEmail(normalizedEmail);
    if (!demoUser || !demoUser.password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const providedHash = crypto.createHash('sha256').update(password || '').digest('hex');
    if (providedHash !== demoUser.password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ role: demoUser.role, email: demoUser.email, userId: demoUser._id }, process.env.JWT_SECRET || 'super-secret');
    return res.json({ token, user: { id: demoUser._id, email: demoUser.email, role: demoUser.role, name: demoUser.name } });
  }

  try {
    const user = await User.findOne({ email: normalizedEmail });
    if (!user || !user.password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const providedHash = crypto.createHash('sha256').update(password || '').digest('hex');
    if (providedHash !== user.password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ role: user.role, email: user.email, userId: user._id }, process.env.JWT_SECRET || 'super-secret');
    return res.json({ token, user: { id: user._id, email: user.email, role: user.role, name: user.name } });
  } catch (error) {
    const demoUser = findDemoUserByEmail(normalizedEmail);
    if (!demoUser || !demoUser.password) {
      return res.status(500).json({ message: error.message });
    }

    const providedHash = crypto.createHash('sha256').update(password || '').digest('hex');
    if (providedHash !== demoUser.password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ role: demoUser.role, email: demoUser.email, userId: demoUser._id }, process.env.JWT_SECRET || 'super-secret');
    return res.json({ token, user: { id: demoUser._id, email: demoUser.email, role: demoUser.role, name: demoUser.name } });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'student' } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    if (!isDatabaseReady()) {
      const existing = findDemoUserByEmail(normalizedEmail);
      if (existing) {
        return res.status(409).json({ message: 'A user with this email already exists' });
      }

      const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
      const user = createDemoUser({
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role: ['student', 'teacher', 'admin', 'superadmin'].includes(role) ? role : 'student'
      });

      return res.status(201).json({ ok: true, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    }

    try {
      const existing = await User.findOne({ email: normalizedEmail });
      if (existing) {
        return res.status(409).json({ message: 'A user with this email already exists' });
      }

      const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
      const user = await User.create({
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role: ['student', 'teacher', 'admin', 'superadmin'].includes(role) ? role : 'student'
      });

      return res.status(201).json({ ok: true, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
      const existing = findDemoUserByEmail(normalizedEmail);
      if (existing) {
        return res.status(409).json({ message: 'A user with this email already exists' });
      }

      const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
      const user = createDemoUser({
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role: ['student', 'teacher', 'admin', 'superadmin'].includes(role) ? role : 'student'
      });

      return res.status(201).json({ ok: true, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/users/:id/role', authMiddleware, async (req, res) => {
  try {
    const { role } = req.body;
    const allowedRoles = ['student', 'teacher', 'admin', 'superadmin'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const actingUser = req.user;
    if (actingUser.role !== 'superadmin' && actingUser.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can change roles' });
    }

    if (!isDatabaseReady()) {
      const user = updateDemoUserRole(req.params.id, role);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      return res.json({ ok: true, user });
    }

    try {
      const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.json({ ok: true, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
      const user = updateDemoUserRole(req.params.id, role);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      return res.json({ ok: true, user });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/users', authMiddleware, async (_req, res) => {
  try {
    if (!isDatabaseReady()) {
      return res.json(listDemoUsers());
    }

    const users = await User.find().select('-password').sort({ createdAt: -1 }).lean();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
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
