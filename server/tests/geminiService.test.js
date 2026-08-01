import test from 'node:test';
import assert from 'node:assert/strict';
import { generateFallbackQuestions } from '../services/geminiService.js';

test('generateFallbackQuestions uses the requested topic in fallback questions', () => {
  const questions = generateFallbackQuestions('Mathematics', 'medium', 3);

  assert.equal(questions.length, 3);
  assert.equal(questions[0].category, 'Mathematics');
  assert.match(questions[0].questionText, /Mathematics/i);
  assert.match(questions[1].questionText, /Mathematics/i);
});
