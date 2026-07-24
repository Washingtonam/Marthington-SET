import express from 'express';
import multer from 'multer';
import Question from '../models/Question.js';
import { generateQuestionBundle } from '../utils/pdfProcessor.js';

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

export default router;
