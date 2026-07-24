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

const questionQuerySchema = Joi.object({
  category: Joi.string().allow(''),
  educationLevel: Joi.string().valid('general', 'nursery', 'primary', 'secondary', 'tertiary', '').allow(''),
  limit: Joi.number().integer().min(1).max(100).default(12)
});

router.get('/questions', async (req, res) => {
  try {
    const { value, error } = questionQuerySchema.validate(req.query);
    if (error) return res.status(400).json({ message: error.message });

    if (!isDatabaseReady()) {
      const questions = getDemoQuestions();
      const filtered = questions.filter((question) => {
        const passesCategory = !value.category || question.category === value.category || question.category?.toLowerCase() === value.category?.toLowerCase();
        const passesLevel = !value.educationLevel || question.educationLevel === value.educationLevel;
        return passesCategory && passesLevel;
      });
      return res.json(filtered.slice(0, value.limit));
    }

    const filter = {};
    if (value.category) filter.category = value.category;
    if (value.educationLevel) filter.educationLevel = value.educationLevel;

    const questions = await Question.find(filter).lean();
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    const payload = shuffled.slice(0, value.limit).map((question) => {
      const { correctAnswerIndex, ...rest } = question;
      return rest;
    });

    return res.json(payload);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/submit', async (req, res) => {
  try {
    const { email, name, dob, answers, testMetadata = {}, rawScore, iqScore } = req.body;

    if (!email || !name) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    const payload = Joi.object({
      email: Joi.string().email().required(),
      name: Joi.string().required(),
      dob: Joi.string().allow(''),
      answers: Joi.array().items(answerSchema).required(),
      testMetadata: Joi.object({
        category: Joi.string().allow(''),
        educationLevel: Joi.string().valid('general', 'nursery', 'primary', 'secondary', 'tertiary', '').allow('')
      }).default({}),
      rawScore: Joi.number().required(),
      iqScore: Joi.number().required()
    }).validate({ email, name, dob, answers, testMetadata, rawScore, iqScore });

    if (payload.error) {
      return res.status(400).json({ message: payload.error.message });
    }

    const resolvedRawScore = typeof rawScore === 'number' ? rawScore : 0;
    const resolvedIqScore = typeof iqScore === 'number' ? iqScore : 100 + resolvedRawScore * 6;

    if (!isDatabaseReady()) {
      const user = saveDemoSubmission({ name, email, dob, answers, rawScore: resolvedRawScore, iqScore: resolvedIqScore, testMetadata });
      return res.json({ ok: true, user, summary: { rawScore: resolvedRawScore, iqScore: resolvedIqScore, totalQuestions: answers.length, passed: resolvedRawScore >= Math.max(1, Math.floor(answers.length / 2)) } });
    }

    const existing = await User.findOne({ email });
    const user = existing || new User({ email, name, dob: dob ? new Date(dob) : undefined });
    user.testAnswers = answers;
    user.rawScore = resolvedRawScore;
    user.iqScore = resolvedIqScore;
    user.testMetadata = testMetadata;
    await user.save();

    res.json({ ok: true, user, summary: { rawScore: resolvedRawScore, iqScore: resolvedIqScore, totalQuestions: answers.length, passed: resolvedRawScore >= Math.max(1, Math.floor(answers.length / 2)) } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
