import { randomUUID } from 'crypto';

const demoQuestions = [
  {
    _id: 'demo-q1',
    questionText: 'Which number comes next: 2, 4, 8, 16, ?',
    options: ['24', '32', '48', '64'],
    correctAnswerIndex: 1,
    category: 'Numerical',
    difficulty: 'Easy'
  },
  {
    _id: 'demo-q2',
    questionText: 'If all Bloops are Razzies and all Razzies are Lazzies, then all Bloops are:',
    options: ['Lazzies', 'Razzies', 'Bloops', 'None'],
    correctAnswerIndex: 0,
    category: 'Logical',
    difficulty: 'Medium'
  },
  {
    _id: 'demo-q3',
    questionText: 'Which shape completes the sequence?',
    options: ['Triangle', 'Circle', 'Square', 'Hexagon'],
    correctAnswerIndex: 1,
    category: 'Spatial',
    difficulty: 'Medium'
  },
  {
    _id: 'demo-q4',
    questionText: 'Choose the word that best fits: "The scientist made a ___ discovery."',
    options: ['Brilliant', 'Happy', 'Quiet', 'Slow'],
    correctAnswerIndex: 0,
    category: 'Verbal',
    difficulty: 'Easy'
  }
];

const demoUsers = [];

export const isDatabaseReady = () => false;

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
