import express from 'express';
import Joi from 'joi';
import Question from '../models/Question.js';
import User from '../models/User.js';
import { getDemoQuestions, saveDemoSubmission, isDatabaseReady } from '../utils/demoStore.js';

const router = express.Router();

const answerSchema = Joi.object({
  questionId: Joi.string().required(),
  selectedIndex: Joi.number().min(0).required()
});

router.get('/questions', async (_req, res) => {
  if (!isDatabaseReady()) {
    return res.json(getDemoQuestions());
  }

  const questions = await Question.find().lean();
  res.json(questions);
});

router.post('/submit', async (req, res) => {
  try {
    const { email, name, dob, answers, rawScore, iqScore } = req.body;

    if (!email || !name) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    const payload = Joi.object({
      email: Joi.string().email().required(),
      name: Joi.string().required(),
      dob: Joi.string().allow(''),
      answers: Joi.array().items(answerSchema).required(),
      rawScore: Joi.number().required(),
      iqScore: Joi.number().required()
    }).validate({ email, name, dob, answers, rawScore, iqScore });

    if (payload.error) {
      return res.status(400).json({ message: payload.error.message });
    }

    if (!isDatabaseReady()) {
      const user = saveDemoSubmission({ name, email, dob, answers, rawScore, iqScore });
      return res.json({ ok: true, user });
    }

    const existing = await User.findOne({ email });
    const user = existing || new User({ email, name, dob: dob ? new Date(dob) : undefined });
    user.testAnswers = answers;
    user.rawScore = rawScore;
    user.iqScore = iqScore;
    await user.save();

    res.json({ ok: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
