import { randomUUID } from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

let pdfParser = null;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function loadPdfParser() {
  if (pdfParser) return pdfParser;
  try {
    const mod = await import('pdf-parse');
    pdfParser = mod.default || mod;
    return pdfParser;
  } catch {
    pdfParser = null;
    return null;
  }
}

const normalizeText = (text = '') => text.replace(/\s+/g, ' ').trim();

const buildAiQuestionSet = async (extractedText, metadata = {}) => {
  const provider = OPENAI_API_KEY ? 'openai' : GEMINI_API_KEY ? 'gemini' : null;
  if (!provider) return null;

  const prompt = `Turn the following course material into 4 concise multiple-choice quiz questions. Return JSON only with an array named questions. Each item must include questionText, options (array of 4 strings), correctAnswerIndex, category, topic, difficulty, and educationLevel. Course title: ${metadata.courseTitle || 'Uploaded Course Material'}\n\nMaterial:\n${extractedText.slice(0, 4000)}`;

  try {
    if (provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'system', content: 'You create exam questions from educational content.' }, { role: 'user', content: prompt }],
          temperature: 0.4
        })
      });

      const data = await response.json();
      const message = data?.choices?.[0]?.message?.content || '';
      const payload = JSON.parse(message.match(/\[[\s\S]*\]/)?.[0] || '{}');
      return Array.isArray(payload) ? payload : payload.questions || null;
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4 }
      })
    });

    const data = await response.json();
    const message = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const payload = JSON.parse(message.match(/\[[\s\S]*\]/)?.[0] || '{}');
    return Array.isArray(payload) ? payload : payload.questions || null;
  } catch {
    return null;
  }
};

const fallbackQuestionSet = (metadata = {}) => {
  const title = metadata.courseTitle || 'Uploaded Course Material';
  const code = metadata.courseCode || 'COURSE';
  return [
    {
      questionText: `What is the primary focus of ${title}?`,
      options: ['Concept review', 'Practical application', 'General overview', 'All of the above'],
      correctAnswerIndex: 3,
      category: 'Course Quiz',
      educationLevel: metadata.educationLevel || 'tertiary',
      topic: 'Course Review',
      sourceTextbook: title,
      courseCode: code,
      courseTitle: title,
      uploadedBy: metadata.userEmail || 'system',
      isPublic: true,
      questionType: 'multiple_choice',
      difficulty: 'Medium',
      isVerified: false
    },
    {
      questionText: `Which learning outcome best matches ${title}?`,
      options: ['Memorization only', 'Application and understanding', 'Guessing', 'Avoiding revision'],
      correctAnswerIndex: 1,
      category: 'Course Quiz',
      educationLevel: metadata.educationLevel || 'tertiary',
      topic: 'Learning Outcomes',
      sourceTextbook: title,
      courseCode: code,
      courseTitle: title,
      uploadedBy: metadata.userEmail || 'system',
      isPublic: true,
      questionType: 'multiple_choice',
      difficulty: 'Easy',
      isVerified: false
    }
  ];
};

export async function processPdfBuffer(buffer, metadata = {}) {
  const parser = await loadPdfParser();
  let extractedText = '';

  if (parser) {
    try {
      const result = await parser(buffer);
      extractedText = normalizeText(result.text || '');
    } catch {
      extractedText = '';
    }
  }

  const courseTitle = metadata.courseTitle || 'Uploaded Course Material';
  const courseCode = metadata.courseCode || 'COURSE';
  const baseSeed = fallbackQuestionSet({ ...metadata, courseTitle, courseCode });

  if (extractedText) {
    const excerpt = extractedText.slice(0, 1400);
    const aiQuestions = await buildAiQuestionSet(extractedText, metadata);

    if (Array.isArray(aiQuestions) && aiQuestions.length) {
      return aiQuestions.map((item, index) => ({
        ...baseSeed[index % baseSeed.length],
        questionText: item.questionText || baseSeed[index % baseSeed.length].questionText,
        options: Array.isArray(item.options) ? item.options : baseSeed[index % baseSeed.length].options,
        correctAnswerIndex: typeof item.correctAnswerIndex === 'number' ? item.correctAnswerIndex : baseSeed[index % baseSeed.length].correctAnswerIndex,
        category: item.category || 'Course Quiz',
        educationLevel: item.educationLevel || metadata.educationLevel || 'tertiary',
        topic: item.topic || 'Content Review',
        sourceTextbook: courseTitle,
        courseCode,
        courseTitle,
        uploadedBy: metadata.userEmail || 'system',
        isPublic: true,
        questionType: 'multiple_choice',
        difficulty: item.difficulty || 'Medium',
        passageText: excerpt,
        isVerified: false
      }));
    }

    return [
      {
        ...baseSeed[0],
        questionText: `Based on the uploaded content, which keyword best describes the main idea of ${courseTitle}?`,
        options: ['Analysis', 'Overview', 'Application', 'Revision'],
        correctAnswerIndex: 1,
        passageText: excerpt,
        topic: 'Content Review'
      },
      {
        ...baseSeed[1],
        questionText: `Which statement is most supported by the uploaded material for ${courseTitle}?`,
        options: ['It contains practical guidance', 'It is unrelated to the course', 'It has no learning value', 'It is purely decorative'],
        correctAnswerIndex: 0,
        passageText: excerpt,
        topic: 'Evidence Review'
      }
    ];
  }

  return baseSeed;
}

export async function generateQuestionBundle(buffer, metadata = {}) {
  const questions = await processPdfBuffer(buffer, metadata);
  const sessionId = randomUUID();

  return {
    sessionId,
    courseCode: metadata.courseCode || 'COURSE',
    courseTitle: metadata.courseTitle || 'Uploaded Course Material',
    questions
  };
}
