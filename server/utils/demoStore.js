import mongoose from 'mongoose';
import { randomUUID } from 'crypto';

const demoQuestions = [
  {
    _id: 'demo-q1',
    questionText: 'Which number comes next in the sequence?',
    sequence: '2, 4, 8, 16, ?',
    options: ['24', '32', '48', '64'],
    correctAnswerIndex: 1,
    category: 'Numerical',
    difficulty: 'Easy'
  },
  {
    _id: 'demo-q2',
    questionText: 'Find the missing number in this alternating sequence:',
    sequence: '3, 6, 5, 10, 9, 18, ?',
    options: ['17', '20', '27', '36'],
    correctAnswerIndex: 0,
    category: 'Numerical',
    difficulty: 'Medium'
  },
  {
    _id: 'demo-q3',
    questionText: 'Determine the final number in the series:',
    sequence: '2, 3, 7, 16, 32, ?',
    options: ['48', '57', '64', '72'],
    correctAnswerIndex: 1,
    category: 'Numerical',
    difficulty: 'Hard'
  },
  {
    _id: 'demo-q4',
    questionText: 'Complete the relationship analogy:',
    sequence: 'LIGHT is to DARK as KNOWLEDGE is to ___',
    options: ['Intelligence', 'Ignorance', 'Wisdom', 'Obscurity'],
    correctAnswerIndex: 1,
    category: 'Verbal',
    difficulty: 'Easy'
  },
  {
    _id: 'demo-q5',
    questionText: 'Which word does NOT belong in this group?',
    sequence: 'Microscope, Telescope, Binoculars, Mirror, Periscope',
    options: ['Microscope', 'Telescope', 'Mirror', 'Periscope'],
    correctAnswerIndex: 2,
    category: 'Verbal',
    difficulty: 'Medium'
  },
  {
    _id: 'demo-q6',
    questionText: 'Evaluate the logical statement:',
    sequence: 'All Artists are Dreamers. Some Dreamers are Scientists. Therefore:',
    options: ['All Artists are Scientists', 'Some Artists might be Scientists', 'No Artists are Scientists', 'All Scientists are Dreamers'],
    correctAnswerIndex: 1,
    category: 'Logical',
    difficulty: 'Hard'
  },
  {
    _id: 'demo-q7',
    questionText: 'Identify the missing value in the matrix relationship:',
    sequence: 'Row 1: [2, 4, 8] | Row 2: [3, 9, 27] | Row 3: [4, 16, ?]',
    options: ['32', '48', '64', '80'],
    correctAnswerIndex: 2,
    category: 'Abstract',
    difficulty: 'Easy'
  },
  {
    _id: 'demo-q8',
    questionText: 'Which pattern rule satisfies the set?',
    sequence: '(4, 12, 6) → (8, 24, 12) → (10, 30, 15) → (6, 18, ?)',
    options: ['9', '12', '14', '21'],
    correctAnswerIndex: 0,
    category: 'Abstract',
    difficulty: 'Medium'
  },
  {
    _id: 'demo-q9',
    questionText: 'Determine the missing term in the grid sequence:',
    sequence: 'A1 → C4 → E9 → G16 → ?',
    options: ['H20', 'I25', 'I20', 'J25'],
    correctAnswerIndex: 1,
    category: 'Abstract',
    difficulty: 'Hard'
  },
  {
    _id: 'demo-q10',
    questionText: 'If a clock shows 3:00, what angle is formed between the hour and minute hands?',
    sequence: 'Hour hand at 3, Minute hand at 12',
    options: ['45°', '60°', '90°', '120°'],
    correctAnswerIndex: 2,
    category: 'Spatial',
    difficulty: 'Easy'
  },
  {
    _id: 'demo-q11',
    questionText: 'Mental Rotation: Rotating a 2D shape 270 degrees clockwise is identical to:',
    sequence: '270° Clockwise Rotation',
    options: ['90° Counter-Clockwise', '180° Clockwise', '90° Clockwise', '45° Counter-Clockwise'],
    correctAnswerIndex: 0,
    category: 'Spatial',
    difficulty: 'Medium'
  },
  {
    _id: 'demo-q12',
    questionText: 'Cube Folding Logic: A flat cross layout has 6 numbered square faces. If face 1 is the bottom base, which face is directly opposite it when folded into a cube?',
    sequence: 'Base = Face 1 (Standard 6-sided die arrangement)',
    options: ['Face 2', 'Face 4', 'Face 6', 'Face 5'],
    correctAnswerIndex: 2,
    category: 'Spatial',
    difficulty: 'Hard'
  }
];

const demoUsers = [];

export const isDatabaseReady = () => mongoose.connection.readyState === 1;

export const getDemoQuestions = () => demoQuestions;

export const saveDemoSubmission = ({ name, email, dob, answers, rawScore, iqScore }) => {
  const existing = demoUsers.find((user) => user.email === email);
  const payload = {
    _id: existing?._id || randomUUID(),
    name,
    email,
    dob: dob || null,
    testAnswers: answers,
    rawScore,
    iqScore,
    hasPaid: false,
    createdAt: new Date().toISOString()
  };

  if (existing) {
    Object.assign(existing, payload);
    return existing;
  }

  demoUsers.push(payload);
  return payload;
};

export const upsertDemoLead = ({ name, email, dob }) => {
  const existing = demoUsers.find((user) => user.email === email);
  if (existing) {
    existing.name = name;
    if (dob) existing.dob = dob;
    return existing;
  }

  const payload = {
    _id: randomUUID(),
    name,
    email,
    dob: dob || null,
    testAnswers: [],
    rawScore: 0,
    iqScore: 0,
    hasPaid: false,
    createdAt: new Date().toISOString()
  };
  demoUsers.push(payload);
  return payload;
};

export const markDemoPayment = ({ email, txRef }) => {
  const existing = demoUsers.find((user) => user.email === email);
  if (!existing) return null;
  existing.hasPaid = true;
  existing.flutterwaveTxRef = txRef;
  return existing;
};

export const getDemoAnalytics = () => {
  const totalTestTakers = demoUsers.length;
  const paidUsers = demoUsers.filter((user) => user.hasPaid).length;
  return {
    totalTestTakers,
    conversionRate: totalTestTakers ? (paidUsers / totalTestTakers) * 100 : 0,
    totalRevenue: paidUsers * 49,
    completionFunnel: { started: totalTestTakers, completed: totalTestTakers, paid: paidUsers }
  };
};
