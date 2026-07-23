import mongoose from 'mongoose';
import Question from '../models/Question.js';
import dotenv from 'dotenv';

dotenv.config();

const questions = [
  {
    questionText: 'Which number comes next: 2, 4, 8, 16, ?',
    options: ['24', '32', '48', '64'],
    correctAnswerIndex: 1,
    category: 'Numerical',
    difficulty: 'Easy'
  },
  {
    questionText: 'If all Bloops are Razzies and all Razzies are Lazzies, then all Bloops are:',
    options: ['Lazzies', 'Razzies', 'Bloops', 'None'],
    correctAnswerIndex: 0,
    category: 'Logical',
    difficulty: 'Medium'
  },
  {
    questionText: 'Which shape completes the sequence?',
    options: ['Triangle', 'Circle', 'Square', 'Hexagon'],
    correctAnswerIndex: 1,
    category: 'Spatial',
    difficulty: 'Medium'
  },
  {
    questionText: 'Choose the word that best fits: "The scientist made a ___ discovery."',
    options: ['Brilliant', 'Happy', 'Quiet', 'Slow'],
    correctAnswerIndex: 0,
    category: 'Verbal',
    difficulty: 'Easy'
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
