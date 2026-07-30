/**
 * Open-Source Question Bank Importer
 * 
 * Usage:
 * 1. Download questions JSON from GitHub open-source repos
 * 2. Place in ./data/open-source-questions.json
 * 3. Run: node importOpenSourceQuestions.js
 * 
 * Recommended Open-Source Repos:
 * - https://github.com/brahmcapital/Kahoots_Quiz_Data (Kahoot questions)
 * - https://github.com/uclatommy/question_bank (General trivia)
 * - https://github.com/KevinLiao159/QuizGPT (Various subjects)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Question from '../models/Question.js';

const DEFAULT_REMOTE_URL = 'https://raw.githubusercontent.com/itmmckernan/triviaJSON/master/trivia.json';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const QUESTIONS_FILE = path.join(__dirname, '..', 'data', 'open-source-questions.json');

function normalizeDifficulty(value) {
  if (typeof value !== 'string') return 'Medium';
  const key = value.toLowerCase();
  if (key.startsWith('e')) return 'Easy';
  if (key.startsWith('m')) return 'Medium';
  if (key.startsWith('h')) return 'Hard';
  return 'Medium';
}

/**
 * Parse and normalize open-source question format to our schema
 */
export function normalizeQuestion(q, index) {
  const questionText = q.questionText || q.question || q.title || q.prompt || `Question ${index + 1}`;
  const rawOptions = Array.isArray(q.options)
    ? q.options
    : Array.isArray(q.answers)
      ? q.answers
      : Array.isArray(q.choices)
        ? q.choices
        : [];
  const options = rawOptions.map((option) => String(option ?? '')).filter(Boolean).slice(0, 4);

  let correctAnswerIndex = 0;
  if (Number.isInteger(q.correctAnswerIndex)) {
    correctAnswerIndex = q.correctAnswerIndex;
  } else if (Number.isInteger(q.correct)) {
    correctAnswerIndex = q.correct;
  } else if (Number.isInteger(q.correctAnswer)) {
    correctAnswerIndex = q.correctAnswer;
  } else if (typeof q.correctAnswer === 'string' || typeof q.correct === 'string') {
    const target = String(q.correct ?? q.correctAnswer ?? '').trim().toLowerCase();
    const directIndex = options.findIndex((option) => String(option).trim().toLowerCase() === target);
    if (directIndex >= 0) {
      correctAnswerIndex = directIndex;
    } else {
      const alpha = target.replace(/[^a-z]/g, '');
      if (alpha.length === 1) {
        const letterIndex = alpha.charCodeAt(0) - 97;
        if (letterIndex >= 0 && letterIndex < options.length) {
          correctAnswerIndex = letterIndex;
        }
      }
    }
  }

  const safeIndex = Math.max(0, Math.min(correctAnswerIndex, Math.max(0, options.length - 1)));
  const correctAnswer = options.length ? String.fromCharCode(65 + safeIndex) : 'A';

  return {
    questionText: questionText || `Question ${index + 1}`,
    options,
    correctAnswerIndex: safeIndex,
    correctAnswer,
    hint: q.hint || q.hintText || '',
    difficulty: normalizeDifficulty(q.difficulty || q.level),
    category: q.category || q.subject || q.topic || 'General Knowledge',
    explanation: q.explanation || q.answer || '',
    source: 'open-source',
    importedAt: new Date(),
    isPublic: true,
    isVerified: false,
    educationLevel: 'general',
    topic: q.topic || q.subject || q.category || 'General Knowledge',
    questionType: 'multiple_choice'
  };
}

async function loadQuestionsFromSource(source) {
  if (!source) {
    return null;
  }

  const trimmedSource = source.trim();
  if (!trimmedSource) {
    return null;
  }

  if (trimmedSource.startsWith('http://') || trimmedSource.startsWith('https://')) {
    const response = await fetch(trimmedSource);
    if (!response.ok) {
      throw new Error(`Failed to fetch remote JSON: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  const absolutePath = path.isAbsolute(trimmedSource)
    ? trimmedSource
    : path.resolve(process.cwd(), trimmedSource);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Source file not found: ${absolutePath}`);
  }

  const fileContent = fs.readFileSync(absolutePath, 'utf-8');
  return JSON.parse(fileContent);
}

/**
 * Import questions from JSON file or remote URL
 */
async function importOpenSourceQuestions() {
  try {
    const sourceArg = process.argv[2] || process.env.OPEN_SOURCE_QUESTIONS_URL || '';
    const source = sourceArg || DEFAULT_REMOTE_URL;

    let questionsPayload;
    let sourceLabel = 'local file';

    if (source.startsWith('http://') || source.startsWith('https://')) {
      sourceLabel = source;
      console.log(`🌐 Fetching questions from remote URL: ${source}`);
      questionsPayload = await loadQuestionsFromSource(source);
    } else {
      const resolvedPath = path.isAbsolute(source) ? source : path.resolve(process.cwd(), source);
      sourceLabel = resolvedPath;

      if (!fs.existsSync(resolvedPath)) {
        console.log(`📁 File not found: ${resolvedPath}`);
        console.log('\n📋 SETUP INSTRUCTIONS:');
        console.log('1. Download questions from an open-source repo, e.g.:');
        console.log('   https://github.com/itmmckernan/triviaJSON');
        console.log('   https://github.com/wanderdevof/TriviaJSON');
        console.log('2. Save as JSON file');
        console.log('3. Place in: server/data/open-source-questions.json');
        console.log('4. Or run: npm run import:open-source https://raw.githubusercontent.com/itmmckernan/triviaJSON/master/trivia.json\n');
        process.exit(1);
      }

      questionsPayload = await loadQuestionsFromSource(resolvedPath);
    }

    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MongoDB connection string not set. Please configure MONGODB_URI (or MONGO_URI) in your environment.');
    }

    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Read and parse JSON
    console.log(`📂 Reading questions from: ${sourceLabel}`);
    let questions = questionsPayload;

    // Handle both array and object responses
    if (!Array.isArray(questions)) {
      if (questions.questions && Array.isArray(questions.questions)) {
        questions = questions.questions;
      } else if (questions.data && Array.isArray(questions.data)) {
        questions = questions.data;
      } else {
        throw new Error('Could not find questions array in JSON file');
      }
    }

    console.log(`📚 Found ${questions.length} questions in file\n`);

    // Normalize and validate
    console.log('🔧 Normalizing questions...');
    const normalizedQuestions = questions
      .map((q, idx) => normalizeQuestion(q, idx))
      .filter(q => q.question && q.options.length >= 2);

    console.log(`✅ Normalized ${normalizedQuestions.length} questions\n`);

    // Group by category for stats
    const byCategory = {};
    normalizedQuestions.forEach(q => {
      if (!byCategory[q.category]) {
        byCategory[q.category] = 0;
      }
      byCategory[q.category]++;
    });

    console.log('📊 Questions by Category:');
    Object.entries(byCategory).forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count} questions`);
    });
    console.log();

    // Check for duplicates
    console.log('🔍 Checking for duplicates...');
    const questionSet = new Set();
    const duplicates = [];

    for (const q of normalizedQuestions) {
      const questionHash = q.question.trim().toLowerCase();
      if (questionSet.has(questionHash)) {
        duplicates.push(q.question);
      } else {
        questionSet.add(questionHash);
      }
    }

    if (duplicates.length > 0) {
      console.log(`⚠️  Found ${duplicates.length} potential duplicates (will be inserted anyway)\n`);
    } else {
      console.log('✅ No duplicates found\n');
    }

    // Import to MongoDB
    console.log('💾 Importing to MongoDB...');
    try {
      const result = await Question.insertMany(normalizedQuestions, { ordered: false });
      console.log(`✅ Successfully imported ${result.length} questions\n`);
    } catch (err) {
      // Handle duplicate key errors gracefully
      if (err.code === 11000) {
        console.log(`⚠️  Some questions already existed. Inserted ${err.result?.insertedIds?.length || 0} new questions\n`);
      } else {
        throw err;
      }
    }

    // Show final stats
    console.log('📈 Database Statistics:');
    const stats = await Question.aggregate([
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    stats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count} questions`);
    });

    const totalCount = await Question.countDocuments();
    console.log(`   TOTAL: ${totalCount} questions\n`);

    console.log('🎉 Import completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error importing questions:', error.message);
    process.exit(1);
  }
}

// Run import when invoked directly
if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  importOpenSourceQuestions();
}
