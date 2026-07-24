import mongoose from 'mongoose';
import Question from '../models/Question.js';
import dotenv from 'dotenv';

dotenv.config();

const questions = [
  {
    questionText: 'Which number comes next in the sequence?',
    sequence: '2, 4, 8, 16, ?',
    options: ['24', '32', '48', '64'],
    correctAnswerIndex: 1,
    category: 'Numerical',
    difficulty: 'Easy'
  },
  {
    questionText: 'Find the missing number in this alternating sequence:',
    sequence: '3, 6, 5, 10, 9, 18, ?',
    options: ['17', '20', '27', '36'],
    correctAnswerIndex: 0,
    category: 'Numerical',
    difficulty: 'Medium'
  },
  {
    questionText: 'Determine the final number in the series:',
    sequence: '2, 3, 7, 16, 32, ?',
    options: ['48', '57', '64', '72'],
    correctAnswerIndex: 1,
    category: 'Numerical',
    difficulty: 'Hard'
  },
  {
    questionText: 'Complete the relationship analogy:',
    sequence: 'LIGHT is to DARK as KNOWLEDGE is to ___',
    options: ['Intelligence', 'Ignorance', 'Wisdom', 'Obscurity'],
    correctAnswerIndex: 1,
    category: 'Verbal',
    difficulty: 'Easy'
  },
  {
    questionText: 'Which word does NOT belong in this group?',
    sequence: 'Microscope, Telescope, Binoculars, Mirror, Periscope',
    options: ['Microscope', 'Telescope', 'Mirror', 'Periscope'],
    correctAnswerIndex: 2,
    category: 'Verbal',
    difficulty: 'Medium'
  },
  {
    questionText: 'Evaluate the logical statement:',
    sequence: 'All Artists are Dreamers. Some Dreamers are Scientists. Therefore:',
    options: ['All Artists are Scientists', 'Some Artists might be Scientists', 'No Artists are Scientists', 'All Scientists are Dreamers'],
    correctAnswerIndex: 1,
    category: 'Logical',
    difficulty: 'Hard'
  },
  {
    questionText: 'Identify the missing value in the matrix relationship:',
    sequence: 'Row 1: [2, 4, 8] | Row 2: [3, 9, 27] | Row 3: [4, 16, ?]',
    options: ['32', '48', '64', '80'],
    correctAnswerIndex: 2,
    category: 'Abstract',
    difficulty: 'Easy'
  },
  {
    questionText: 'Which pattern rule satisfies the set?',
    sequence: '(4, 12, 6) → (8, 24, 12) → (10, 30, 15) → (6, 18, ?)',
    options: ['9', '12', '14', '21'],
    correctAnswerIndex: 0,
    category: 'Abstract',
    difficulty: 'Medium'
  },
  {
    questionText: 'Determine the missing term in the grid sequence:',
    sequence: 'A1 → C4 → E9 → G16 → ?',
    options: ['H20', 'I25', 'I20', 'J25'],
    correctAnswerIndex: 1,
    category: 'Abstract',
    difficulty: 'Hard'
  },
  {
    questionText: 'If a clock shows 3:00, what angle is formed between the hour and minute hands?',
    sequence: 'Hour hand at 3, Minute hand at 12',
    options: ['45°', '60°', '90°', '120°'],
    correctAnswerIndex: 2,
    category: 'Spatial',
    difficulty: 'Easy'
  },
  {
    questionText: 'Mental Rotation: Rotating a 2D shape 270 degrees clockwise is identical to:',
    sequence: '270° Clockwise Rotation',
    options: ['90° Counter-Clockwise', '180° Clockwise', '90° Clockwise', '45° Counter-Clockwise'],
    correctAnswerIndex: 0,
    category: 'Spatial',
    difficulty: 'Medium'
  },
  {
    questionText: 'Cube Folding Logic: A flat cross layout has 6 numbered square faces. If face 1 is the bottom base, which face is directly opposite it when folded into a cube?',
    sequence: 'Base = Face 1 (Standard 6-sided die arrangement)',
    options: ['Face 2', 'Face 4', 'Face 6', 'Face 5'],
    correctAnswerIndex: 2,
    category: 'Spatial',
    difficulty: 'Hard'
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
