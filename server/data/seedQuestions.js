import mongoose from 'mongoose';
import Question from '../models/Question.js';
import dotenv from 'dotenv';

dotenv.config();

const questions = [
  {
    questionText: 'Which number comes next in the sequence?',
    options: ['24', '32', '48', '64'],
    correctAnswerIndex: 1,
    category: 'Quantitative Reasoning',
    educationLevel: 'general',
    topic: 'Number Sequences',
    sourceTextbook: 'IQ Reasoning Starter',
    questionType: 'multiple_choice',
    difficulty: 'Easy',
    isVerified: true
  },
  {
    questionText: 'Choose the word that is most opposite in meaning to "bright".',
    options: ['shiny', 'dark', 'glowing', 'clear'],
    correctAnswerIndex: 1,
    category: 'Verbal Reasoning',
    educationLevel: 'primary',
    topic: 'Antonyms',
    sourceTextbook: 'Verbal Reasoning Bk 4',
    questionType: 'multiple_choice',
    difficulty: 'Medium',
    isVerified: true
  },
  {
    questionText: 'Solve: 12 + 8 = ?',
    options: ['18', '20', '22', '24'],
    correctAnswerIndex: 1,
    category: 'Mathematics',
    educationLevel: 'nursery',
    topic: 'Addition',
    sourceTextbook: 'Early Mathematics',
    questionType: 'multiple_choice',
    difficulty: 'Easy',
    isVerified: true
  },
  {
    questionText: 'What is the capital of Nigeria?',
    options: ['Lagos', 'Abuja', 'Kano', 'Port Harcourt'],
    correctAnswerIndex: 1,
    category: 'General Knowledge',
    educationLevel: 'secondary',
    topic: 'Geography',
    sourceTextbook: 'Senior Social Studies',
    questionType: 'multiple_choice',
    difficulty: 'Medium',
    isVerified: true
  }
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/marthington-iq');
  await Question.deleteMany({});
  await Question.insertMany(questions);
  console.log('Seeded questions');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
