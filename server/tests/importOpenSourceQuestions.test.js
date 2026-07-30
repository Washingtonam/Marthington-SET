import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeQuestion } from '../scripts/importOpenSourceQuestions.js';

test('normalizeQuestion maps common open-source formats to the app schema', () => {
  const normalized = normalizeQuestion({
    questionText: 'What is 2 + 2?',
    options: ['3', '4', '5', '6'],
    correctAnswerIndex: 1,
    category: 'Mathematics',
    difficulty: 'hard'
  }, 0);

  assert.equal(normalized.questionText, 'What is 2 + 2?');
  assert.deepEqual(normalized.options, ['3', '4', '5', '6']);
  assert.equal(normalized.correctAnswerIndex, 1);
  assert.equal(normalized.category, 'Mathematics');
  assert.equal(normalized.difficulty, 'Hard');
  assert.equal(normalized.source, 'open-source');
});

test('normalizeQuestion derives the answer index from a raw correct answer value', () => {
  const normalized = normalizeQuestion({
    question: 'What is the capital of France?',
    answers: ['London', 'Paris', 'Berlin', 'Madrid'],
    correctAnswer: 'Paris',
    subject: 'Geography',
    difficulty: 'easy'
  }, 1);

  assert.equal(normalized.questionText, 'What is the capital of France?');
  assert.equal(normalized.correctAnswerIndex, 1);
  assert.equal(normalized.category, 'Geography');
  assert.equal(normalized.difficulty, 'Easy');
});
