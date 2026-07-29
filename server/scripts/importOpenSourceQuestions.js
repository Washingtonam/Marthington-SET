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
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Question from '../models/Question.js';

dotenv.config();

const QUESTIONS_FILE = path.join(process.cwd(), 'data', 'open-source-questions.json');

/**
 * Parse and normalize open-source question format to our schema
 */
function normalizeQuestion(q, index) {
  // Handle different common formats
  const question = q.question || q.questionText || q.title || '';
  const options = Array.isArray(q.options) 
    ? q.options 
    : Array.isArray(q.answers) 
      ? q.answers 
      : [];

  // Find correct answer index
  let correctAnswerIndex = 0;
  if (typeof q.correct === 'number') {
    correctAnswerIndex = q.correct;
  } else if (typeof q.correctAnswer === 'number') {
    correctAnswerIndex = q.correctAnswer;
  } else if (typeof q.correctAnswerIndex === 'number') {
    correctAnswerIndex = q.correctAnswerIndex;
  }

  return {
    question: question || `Question ${index + 1}`,
    options: options.slice(0, 4),
    correctAnswerIndex: Math.min(correctAnswerIndex, options.length - 1),
    correctAnswer: String.fromCharCode(65 + Math.min(correctAnswerIndex, options.length - 1)),
    hint: q.hint || '',
    difficulty: (q.difficulty || 'medium').toLowerCase(),
    category: q.category || q.subject || 'General Knowledge',
    explanation: q.explanation || q.answer || '',
    source: 'open-source',
    importedAt: new Date(),
    isPublic: true,
    isVerified: false
  };
}

/**
 * Import questions from JSON file
 */
async function importOpenSourceQuestions() {
  try {
    // Connect to MongoDB
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI environment variable not set');
    }

    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check if file exists
    if (!fs.existsSync(QUESTIONS_FILE)) {
      console.log(`📁 File not found: ${QUESTIONS_FILE}`);
      console.log('\n📋 SETUP INSTRUCTIONS:');
      console.log('1. Download questions from an open-source repo, e.g.:');
      console.log('   https://github.com/brahmcapital/Kahoots_Quiz_Data');
      console.log('   https://github.com/uclatommy/question_bank');
      console.log('2. Save as JSON file');
      console.log('3. Place in: server/data/open-source-questions.json');
      console.log('4. Run this script again\n');
      process.exit(1);
    }

    // Read and parse JSON
    console.log(`📂 Reading questions from: ${QUESTIONS_FILE}`);
    const fileContent = fs.readFileSync(QUESTIONS_FILE, 'utf-8');
    let questions = JSON.parse(fileContent);

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

// Run import
importOpenSourceQuestions();
