export const questions = [
  {
    id: 1,
    category: 'Numerical',
    difficulty: 'Easy',
    question: 'Which number comes next in the sequence?',
    sequence: '2, 4, 8, 16, ?',
    hint: 'Each number doubles the value of the preceding number.',
    options: [
      { label: 'A', value: '24' },
      { label: 'B', value: '32' },
      { label: 'C', value: '48' },
      { label: 'D', value: '64' }
    ],
    correctAnswer: 'B'
  },
  {
    id: 2,
    category: 'Numerical',
    difficulty: 'Medium',
    question: 'Find the missing number in this alternating sequence:',
    sequence: '3, 6, 5, 10, 9, 18, ?',
    hint: 'Notice the pattern alternates between multiplication (*2) and subtraction (-1).',
    options: [
      { label: 'A', value: '17' },
      { label: 'B', value: '20' },
      { label: 'C', value: '27' },
      { label: 'D', value: '36' }
    ],
    correctAnswer: 'A'
  },
  {
    id: 3,
    category: 'Numerical',
    difficulty: 'Hard',
    question: 'Determine the final number in the series:',
    sequence: '2, 3, 7, 16, 32, ?',
    hint: 'Look at the differences between consecutive terms (+1^2, +2^2, +3^2, +4^2...).',
    options: [
      { label: 'A', value: '48' },
      { label: 'B', value: '57' },
      { label: 'C', value: '64' },
      { label: 'D', value: '72' }
    ],
    correctAnswer: 'B'
  },
  {
    id: 4,
    category: 'Verbal',
    difficulty: 'Easy',
    question: 'Complete the relationship analogy:',
    sequence: 'LIGHT is to DARK as KNOWLEDGE is to ___',
    hint: 'Identify the opposite relationship.',
    options: [
      { label: 'A', value: 'Intelligence' },
      { label: 'B', value: 'Ignorance' },
      { label: 'C', value: 'Wisdom' },
      { label: 'D', value: 'Obscurity' }
    ],
    correctAnswer: 'B'
  },
  {
    id: 5,
    category: 'Verbal',
    difficulty: 'Medium',
    question: 'Which word does NOT belong in this group?',
    sequence: 'Microscope, Telescope, Binoculars, Mirror, Periscope',
    hint: 'Four of these tools magnify or project distant optical views.',
    options: [
      { label: 'A', value: 'Microscope' },
      { label: 'B', value: 'Telescope' },
      { label: 'C', value: 'Mirror' },
      { label: 'D', value: 'Periscope' }
    ],
    correctAnswer: 'C'
  },
  {
    id: 6,
    category: 'Verbal',
    difficulty: 'Hard',
    question: 'Evaluate the logical statement:',
    sequence: 'All Artists are Dreamers. Some Dreamers are Scientists. Therefore:',
    hint: "Draw a Venn diagram or test if 'Artists' and 'Scientists' must overlap.",
    options: [
      { label: 'A', value: 'All Artists are Scientists' },
      { label: 'B', value: 'Some Artists might be Scientists' },
      { label: 'C', value: 'No Artists are Scientists' },
      { label: 'D', value: 'All Scientists are Dreamers' }
    ],
    correctAnswer: 'B'
  },
  {
    id: 7,
    category: 'Abstract',
    difficulty: 'Easy',
    question: 'Identify the missing value in the matrix relationship:',
    sequence: 'Row 1: [2, 4, 8] | Row 2: [3, 9, 27] | Row 3: [4, 16, ?]',
    hint: 'Each row follows a power progression (x, x^2, x^3).',
    options: [
      { label: 'A', value: '32' },
      { label: 'B', value: '48' },
      { label: 'C', value: '64' },
      { label: 'D', value: '80' }
    ],
    correctAnswer: 'C'
  },
  {
    id: 8,
    category: 'Abstract',
    difficulty: 'Medium',
    question: 'Which pattern rule satisfies the set?',
    sequence: '(4, 12, 6) → (8, 24, 12) → (10, 30, 15) → (6, 18, ?)',
    hint: 'First term is multiplied by 3, then divided by 2.',
    options: [
      { label: 'A', value: '9' },
      { label: 'B', value: '12' },
      { label: 'C', value: '14' },
      { label: 'D', value: '21' }
    ],
    correctAnswer: 'A'
  },
  {
    id: 9,
    category: 'Abstract',
    difficulty: 'Hard',
    question: 'Determine the missing term in the grid sequence:',
    sequence: 'A1 → C4 → E9 → G16 → ?',
    hint: 'Letters skip by +2 (A, C, E, G...), while numbers represent square terms (1^2, 2^2, 3^2, 4^2...).',
    options: [
      { label: 'A', value: 'H20' },
      { label: 'B', value: 'I25' },
      { label: 'C', value: 'I20' },
      { label: 'D', value: 'J25' }
    ],
    correctAnswer: 'B'
  },
  {
    id: 10,
    category: 'Spatial',
    difficulty: 'Easy',
    question: 'If a clock shows 3:00, what angle is formed between the hour and minute hands?',
    sequence: 'Hour hand at 3, Minute hand at 12',
    hint: 'A full clock face is 360° divided into 12 hour segments.',
    options: [
      { label: 'A', value: '45°' },
      { label: 'B', value: '60°' },
      { label: 'C', value: '90°' },
      { label: 'D', value: '120°' }
    ],
    correctAnswer: 'C'
  },
  {
    id: 11,
    category: 'Spatial',
    difficulty: 'Medium',
    question: 'Mental Rotation: Rotating a 2D shape 270 degrees clockwise is identical to:',
    sequence: '270° Clockwise Rotation',
    hint: 'Think about full 360° rotation complements.',
    options: [
      { label: 'A', value: '90° Counter-Clockwise' },
      { label: 'B', value: '180° Clockwise' },
      { label: 'C', value: '90° Clockwise' },
      { label: 'D', value: '45° Counter-Clockwise' }
    ],
    correctAnswer: 'A'
  },
  {
    id: 12,
    category: 'Spatial',
    difficulty: 'Hard',
    question: 'Cube Folding Logic: A flat cross layout has 6 numbered square faces. If face 1 is the bottom base, which face is directly opposite it when folded into a cube?',
    sequence: 'Base = Face 1 (Standard 6-sided die arrangement)',
    hint: 'Opposite faces in a cube grid never touch along a direct border line.',
    options: [
      { label: 'A', value: 'Face 2' },
      { label: 'B', value: 'Face 4' },
      { label: 'C', value: 'Face 6' },
      { label: 'D', value: 'Face 5' }
    ],
    correctAnswer: 'C'
  }
];
