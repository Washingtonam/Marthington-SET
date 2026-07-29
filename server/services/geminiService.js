import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate quiz questions using Google Gemini API
 * @param {string} topic - The topic to generate questions for
 * @param {string} difficulty - Difficulty level (easy, medium, hard)
 * @param {number} count - Number of questions to generate (default: 10)
 * @returns {Promise<Array>} Array of generated questions
 */
export async function generateQuestions(topic, difficulty = "medium", count = 10) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable not set");
    }

    // Use gemini-1.5-flash which is available on free tier
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Generate exactly ${count} multiple-choice quiz questions on the topic: "${topic}" at ${difficulty} difficulty level.

Return ONLY a valid JSON array with no additional text. Each question must have this exact structure:
{
  "question": "Question text here?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswerIndex": 0,
  "hint": "A helpful hint for this question",
  "difficulty": "${difficulty}",
  "category": "${topic}",
  "explanation": "Detailed explanation of the correct answer"
}

Important requirements:
- Correct answer index must be 0, 1, 2, or 3
- All options should be plausible but only one correct
- Options should be roughly similar in length
- Hints should be non-obvious but helpful
- Ensure variety and avoid repetitive questions
- Return valid JSON array only, no markdown or extra text

Generate the questions now:`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    // Parse the JSON response
    let questions;
    try {
      // Try to extract JSON array from response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error("No JSON array found in response");
      }
      questions = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", responseText);
      throw new Error("Failed to parse generated questions");
    }

    // Validate structure
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error("Generated invalid question structure");
    }

    // Clean and validate each question
    const validatedQuestions = questions.map((q, idx) => ({
      question: q.question || `Question ${idx + 1}`,
      options: Array.isArray(q.options) ? q.options.slice(0, 4) : [],
      correctAnswerIndex: typeof q.correctAnswerIndex === "number" ? q.correctAnswerIndex : 0,
      correctAnswer: String.fromCharCode(65 + (q.correctAnswerIndex || 0)),
      hint: q.hint || "",
      difficulty: q.difficulty || difficulty,
      category: q.category || topic,
      explanation: q.explanation || "No explanation provided",
      source: "ai-generated",
      generatedAt: new Date(),
    }));

    return validatedQuestions;
  } catch (error) {
    console.error("Error generating questions with Gemini:", error.message);
    throw error;
  }
}

/**
 * Fallback sample questions for common topics
 * Used when Gemini API is unavailable (no billing enabled)
 */
const FALLBACK_QUESTIONS = {
  default: [
    {
      question: "What is the primary function of a computer's CPU?",
      options: ["Storing data", "Executing instructions", "Displaying output", "Managing network connections"],
      correctAnswerIndex: 1,
      correctAnswer: "B",
      hint: "Think about what processes information in a computer",
      difficulty: "easy",
      category: "Computer Science",
      explanation: "The CPU (Central Processing Unit) executes instructions from programs and performs calculations."
    },
    {
      question: "Which of the following is an example of a high-level programming language?",
      options: ["Assembly", "Machine Code", "Python", "Bytecode"],
      correctAnswerIndex: 2,
      correctAnswer: "C",
      hint: "High-level languages are more human-readable",
      difficulty: "easy",
      category: "Computer Science",
      explanation: "Python is a high-level programming language that is easy to read and write for humans."
    },
    {
      question: "What does 'GUI' stand for?",
      options: ["Graph User Input", "Graphical User Interface", "Global User Identity", "General Utility Integration"],
      correctAnswerIndex: 1,
      correctAnswer: "B",
      hint: "It's the visual part of software you interact with",
      difficulty: "easy",
      category: "Computer Science",
      explanation: "GUI stands for Graphical User Interface - the visual elements users interact with in applications."
    },
    {
      question: "Which data structure works on the principle of 'Last In, First Out'?",
      options: ["Queue", "Stack", "Array", "Tree"],
      correctAnswerIndex: 1,
      correctAnswer: "B",
      hint: "Think of a stack of plates",
      difficulty: "medium",
      category: "Computer Science",
      explanation: "A Stack follows LIFO (Last In, First Out) principle where the last element added is the first one removed."
    },
    {
      question: "What is the time complexity of binary search?",
      options: ["O(n)", "O(n²)", "O(log n)", "O(1)"],
      correctAnswerIndex: 2,
      correctAnswer: "C",
      hint: "It reduces the search space by half each time",
      difficulty: "medium",
      category: "Computer Science",
      explanation: "Binary search has O(log n) time complexity because it divides the search space in half with each iteration."
    }
  ]
};

function generateFallbackQuestions(topic, difficulty = "medium", count = 10) {
  const fallbackQs = FALLBACK_QUESTIONS.default || [];
  
  // Filter by difficulty or return all if not available
  const filtered = fallbackQs.length > 0 ? fallbackQs : FALLBACK_QUESTIONS.default;
  
  // Return requested count (or all available)
  return filtered.slice(0, Math.min(count, filtered.length));
}

/**
 * Generate questions with fallback strategy
 * If Gemini API fails (no billing), use sample questions
 */
export async function generateQuestionsWithFallback(topic, difficulty = "medium", count = 10) {
  try {
    const questions = await generateQuestions(topic, difficulty, count);
    return { success: true, questions, source: "ai-generated" };
  } catch (error) {
    console.error("AI generation failed:", error.message);
    console.log("⚠️ Falling back to sample questions. To use AI generation, enable billing on your Google Cloud project.");
    
    // Use fallback sample questions
    const fallbackQuestions = generateFallbackQuestions(topic, difficulty, count);
    
    if (fallbackQuestions.length > 0) {
      return { 
        success: true, 
        questions: fallbackQuestions, 
        source: "fallback-sample",
        warning: "Using sample questions. Enable billing on Google Cloud to use AI generation."
      };
    }
    
    return { success: false, questions: [], source: "failed", error: error.message };
  }
}
