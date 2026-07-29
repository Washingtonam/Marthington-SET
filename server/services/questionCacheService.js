import Question from '../models/Question.js';
import { generateQuestionsWithFallback } from './geminiService.js';

/**
 * Get or generate questions for a topic
 * Smart caching: checks MongoDB first, generates if not found
 */
export async function getOrGenerateQuestions(topic, difficulty = 'medium', count = 10) {
  try {
    // Step 1: Check if questions already exist in MongoDB
    const cachedQuestions = await Question.find({
      category: topic,
      difficulty: difficulty,
      source: 'ai-generated'
    }).limit(count);

    if (cachedQuestions.length >= count) {
      console.log(`✅ Serving ${count} cached questions for "${topic}"`);
      return {
        success: true,
        questions: cachedQuestions.slice(0, count),
        source: 'cache',
        message: 'Questions retrieved from cache'
      };
    }

    const missingCount = count - cachedQuestions.length;
    console.log(`📝 Only found ${cachedQuestions.length}/${count} cached. Generating ${missingCount} new questions...`);

    // Step 2: Generate missing questions using AI
    const { success, questions: generatedQuestions, error } = await generateQuestionsWithFallback(
      topic,
      difficulty,
      missingCount
    );

    if (!success || !generatedQuestions.length) {
      console.warn(`⚠️ AI generation failed: ${error}`);
      
      // Return whatever we have from cache
      if (cachedQuestions.length > 0) {
        return {
          success: true,
          questions: cachedQuestions,
          source: 'partial-cache',
          message: `Returned ${cachedQuestions.length} cached questions (generation failed)`
        };
      }

      throw new Error(`Unable to generate questions: ${error}`);
    }

    // Step 3: Cache newly generated questions in MongoDB
    const savedQuestions = await Question.insertMany(
      generatedQuestions.map(q => ({
        ...q,
        category: topic,
        sequence: q.options.join(' / ')
      }))
    );

    console.log(`💾 Cached ${savedQuestions.length} new questions for "${topic}"`);

    // Step 4: Combine cached + newly generated
    const allQuestions = [...cachedQuestions, ...savedQuestions];

    return {
      success: true,
      questions: allQuestions.slice(0, count),
      source: 'mixed',
      cached: cachedQuestions.length,
      generated: savedQuestions.length,
      message: `Served ${cachedQuestions.length} cached + ${savedQuestions.length} newly generated questions`
    };

  } catch (error) {
    console.error('Error in getOrGenerateQuestions:', error.message);
    return {
      success: false,
      questions: [],
      error: error.message
    };
  }
}

/**
 * Pre-populate common topics to reduce first-time AI calls
 */
export async function preGenerateCommonTopics() {
  const commonTopics = [
    { topic: 'Quantitative Reasoning', difficulty: 'medium' },
    { topic: 'Verbal Reasoning', difficulty: 'medium' },
    { topic: 'Mathematics', difficulty: 'medium' },
    { topic: 'General Knowledge', difficulty: 'medium' },
    { topic: 'Science', difficulty: 'easy' },
    { topic: 'English Grammar', difficulty: 'easy' }
  ];

  console.log('🚀 Pre-generating questions for common topics...');

  for (const { topic, difficulty } of commonTopics) {
    try {
      const existing = await Question.countDocuments({
        category: topic,
        difficulty: difficulty
      });

      if (existing < 10) {
        const result = await getOrGenerateQuestions(topic, difficulty, 10);
        if (result.success) {
          console.log(`✅ Pre-generated: ${topic} (${difficulty})`);
        }
      }
    } catch (error) {
      console.error(`Error pre-generating ${topic}:`, error.message);
    }
  }
}

/**
 * Clear old AI-generated questions (optional cleanup)
 */
export async function clearOldCachedQuestions(olderThanDays = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await Question.deleteMany({
      source: 'ai-generated',
      generatedAt: { $lt: cutoffDate }
    });

    console.log(`🗑️ Deleted ${result.deletedCount} old cached questions`);
    return result;
  } catch (error) {
    console.error('Error clearing old cached questions:', error.message);
    throw error;
  }
}
