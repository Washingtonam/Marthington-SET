import express from 'express';
import multer from 'multer';
import Question from '../models/Question.js';
import { generateQuestionBundle } from '../utils/pdfProcessor.js';
import { getOrGenerateQuestions, preGenerateCommonTopics } from '../services/questionCacheService.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload-pdf', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'PDF file is required' });
    }

    const { courseCode, courseTitle, userEmail, educationLevel = 'tertiary' } = req.body;
    const bundle = await generateQuestionBundle(req.file.buffer, {
      courseCode,
      courseTitle,
      userEmail,
      educationLevel
    });

    const questionsToSave = bundle.questions.map((item) => ({
      ...item,
      questionText: item.questionText || '',
      options: Array.isArray(item.options) ? item.options : [],
      correctAnswerIndex: typeof item.correctAnswerIndex === 'number' ? item.correctAnswerIndex : null,
      category: item.category || 'Course Quiz',
      educationLevel: item.educationLevel || educationLevel || 'tertiary',
      topic: item.topic || 'Course Review',
      sourceTextbook: item.sourceTextbook || courseTitle,
      courseCode: item.courseCode || courseCode,
      courseTitle: item.courseTitle || courseTitle,
      uploadedBy: item.uploadedBy || userEmail || 'unknown',
      isPublic: true,
      questionType: item.questionType || 'multiple_choice',
      passageText: item.passageText || '',
      imageUrl: item.imageUrl || '',
      isVerified: false
    }));

    const saved = await Question.insertMany(questionsToSave);

    res.json({ ok: true, sessionId: bundle.sessionId, courseCode: bundle.courseCode, courseTitle: bundle.courseTitle, inserted: saved.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/dashboard', async (_req, res) => {
  try {
    const [courses, totalCourses, totalQuestions, publicCourses] = await Promise.all([
      Question.find({ isPublic: true }).sort({ createdAt: -1 }).limit(8).lean(),
      Question.countDocuments({ isPublic: true }),
      Question.countDocuments(),
      Question.countDocuments({ isPublic: true, isVerified: true })
    ]);

    res.json({
      ok: true,
      stats: {
        totalCourses,
        totalQuestions,
        publicCourses,
        verifiedQuestions: publicCourses
      },
      courses
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/search', async (req, res) => {
  try {
    const search = (req.query.search || '').toString().trim();
    if (!search) return res.json([]);

    const query = {
      isPublic: true,
      $or: [
        { courseCode: { $regex: search, $options: 'i' } },
        { courseTitle: { $regex: search, $options: 'i' } },
        { topic: { $regex: search, $options: 'i' } }
      ]
    };

    const results = await Question.find(query).lean();
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ===== AI-POWERED QUESTION GENERATION ENDPOINTS =====

/**
 * GET /api/quiz/ai-questions?topic=...&difficulty=...&count=...
 * Get or generate questions for any topic using AI
 * Smart caching: checks DB first, generates if not found
 */
router.get('/ai-questions', async (req, res) => {
  try {
    const { topic, difficulty = 'medium', count = 10 } = req.query;

    if (!topic || !topic.trim()) {
      return res.status(400).json({
        ok: false,
        message: 'Topic parameter is required'
      });
    }

    const result = await getOrGenerateQuestions(topic.trim(), difficulty, parseInt(count) || 10);

    if (!result.success) {
      return res.status(500).json({
        ok: false,
        message: result.error || 'Failed to generate questions'
      });
    }

    res.json({
      ok: true,
      ...result,
      count: result.questions.length
    });
  } catch (error) {
    console.error('Error in /ai-questions:', error.message);
    res.status(500).json({
      ok: false,
      message: error.message || 'Internal server error'
    });
  }
});

/**
 * POST /api/quiz/pre-generate
 * Pre-generate questions for common topics (admin endpoint)
 * Speeds up initial user experience
 */
router.post('/pre-generate', async (req, res) => {
  try {
    // Optional: Add auth middleware here to restrict to admin
    console.log('Starting pre-generation of common topics...');
    
    // Run async without blocking response
    preGenerateCommonTopics().catch(err => 
      console.error('Error in background pre-generation:', err.message)
    );

    res.json({
      ok: true,
      message: 'Pre-generation started in background'
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: error.message
    });
  }
});

/**
 * GET /api/quiz/cached-topics
 * Get list of topics that have cached questions
 */
router.get('/cached-topics', async (req, res) => {
  try {
    const topics = await Question.distinct('category', {
      source: 'ai-generated'
    });

    const topicStats = await Promise.all(
      topics.map(async (topic) => ({
        topic,
        count: await Question.countDocuments({
          category: topic,
          source: 'ai-generated'
        })
      }))
    );

    res.json({
      ok: true,
      topics: topicStats.sort((a, b) => b.count - a.count)
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: error.message
    });
  }
});

export default router;
