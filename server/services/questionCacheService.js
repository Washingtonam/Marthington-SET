import Question from '../models/Question.js';
import { generateQuestionsWithFallback } from './geminiService.js';

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Get or generate questions for a topic
 * Smart caching: checks MongoDB first, generates if not found
 */
export async function getOrGenerateQuestions(topic, difficulty = 'medium', count = 10, preferredSource = 'auto') {
  try {
    const normalizedSource = String(preferredSource || 'auto').toLowerCase();

    // Normalize difficulty input: accept 'easy/medium/hard' or education levels like 'secondary'
    const educationLevels = ['general', 'nursery', 'primary', 'secondary', 'tertiary'];
    const simpleDiff = (d) => {
      if (!d || typeof d !== 'string') return 'Medium';
      const k = d.toLowerCase();
      if (k.startsWith('e')) return 'Easy';
      if (k.startsWith('m')) return 'Medium';
      if (k.startsWith('h')) return 'Hard';
      return null;
    };

    let query = { category: topic, source: 'ai-generated' };
    const mappedDiff = simpleDiff(difficulty);
    if (mappedDiff) {
      query.difficulty = mappedDiff;
    } else if (educationLevels.includes(String(difficulty).toLowerCase())) {
      // caller probably sent an education level (e.g., 'secondary'); map to educationLevel and use default difficulty
      query.educationLevel = String(difficulty).toLowerCase();
      query.difficulty = 'Medium';
    } else {
      query.difficulty = 'Medium';
    }

    // Step 1: Check if questions already exist in MongoDB
    const cachedQuestions = await Question.find(query).limit(count);

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
    let openSourceQuestions = [];

    if (missingCount > 0) {
      console.log(`📝 Only found ${cachedQuestions.length}/${count} cached. Checking open-source bank for ${missingCount} questions...`);
      const query = {
        $or: [
          { category: { $regex: `^${escapeRegExp(topic)}$`, $options: 'i' } },
          { topic: { $regex: `^${escapeRegExp(topic)}$`, $options: 'i' } }
        ],
        source: 'open-source'
      };

      openSourceQuestions = await Question.find(query).limit(missingCount);
    }

    if (normalizedSource === 'open-source') {
      if (openSourceQuestions.length > 0) {
        return {
          success: true,
          questions: openSourceQuestions.slice(0, count),
          source: 'open-source',
          cached: 0,
          openSource: openSourceQuestions.length,
          availableTopics: await getAvailableTopics('open-source'),
          message: `Served ${openSourceQuestions.length} open-source questions`
        };
      }

      const fallbackQuestions = cachedQuestions.slice(0, count);
      return {
        success: true,
        questions: fallbackQuestions,
        source: fallbackQuestions.length > 0 ? 'partial-cache' : 'empty',
        cached: cachedQuestions.length,
        openSource: 0,
        availableTopics: await getAvailableTopics('open-source'),
        message: fallbackQuestions.length > 0 ? 'No matching open-source questions were found for that topic' : 'No questions are currently available for that topic'
      };
    }

    if (normalizedSource === 'ai-generated') {
      const { success, questions: generatedQuestions, error } = await generateQuestionsWithFallback(
        topic,
        difficulty,
        missingCount
      );

      if (!success || !generatedQuestions.length) {
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

      const savedQuestions = await Question.insertMany(
        generatedQuestions.map(q => ({
          ...q,
          category: topic,
          sequence: q.options.join(' / ')
        }))
      );

      return {
        success: true,
        questions: [...cachedQuestions, ...savedQuestions].slice(0, count),
        source: 'ai-generated',
        cached: cachedQuestions.length,
        generated: savedQuestions.length,
        message: `Served ${cachedQuestions.length} cached + ${savedQuestions.length} newly generated questions`
      };
    }

    if (openSourceQuestions.length > 0) {
      const combinedQuestions = [...cachedQuestions, ...openSourceQuestions];
      return {
        success: true,
        questions: combinedQuestions.slice(0, count),
        source: 'mixed',
        cached: cachedQuestions.length,
        openSource: openSourceQuestions.length,
        availableTopics: await getAvailableTopics('open-source'),
        message: `Served ${cachedQuestions.length} cached and ${openSourceQuestions.length} open-source questions`
      };
    }

    console.log(`📝 No open-source questions available for "${topic}". Generating ${missingCount} new questions...`);

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
      availableTopics: await getAvailableTopics('open-source'),
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
export async function getAvailableTopics(source = 'open-source') {
  try {
    const topics = await Question.distinct('category', {
      source: source === 'ai-generated' ? 'ai-generated' : 'open-source'
    });

    return topics.filter(Boolean).sort((a, b) => a.localeCompare(b));
  } catch (error) {
    console.error('Error fetching available topics:', error.message);
    return [];
  }
}

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
