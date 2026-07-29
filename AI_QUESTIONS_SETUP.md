# AI-Powered Question Generation System Setup Guide

## Overview
This system uses **Google Gemini API** to dynamically generate quiz questions on any topic, with intelligent **MongoDB caching** to minimize API costs and improve response times.

## Architecture

```
User Request for Topic
       ↓
Check MongoDB Cache
       ↓
    Found? → Return Cached Questions ✅
       ↓ No
Call Gemini API
       ↓
Generate Questions ✨
       ↓
Save to MongoDB Cache 💾
       ↓
Return Questions to User
```

## Setup Instructions

### 1. Get Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Create new API key"
3. Copy your API key

### 2. Configure Environment Variables

Add to your `.env` file:

```bash
GEMINI_API_KEY=your-api-key-here
```

### 3. Install Dependencies

```bash
cd server
npm install
```

### 4. Start the Server

```bash
npm start
```

## API Endpoints

### Get or Generate Questions

**Endpoint:** `GET /api/quiz/ai-questions`

**Query Parameters:**
- `topic` (required): The subject/topic to generate questions for
- `difficulty` (optional): 'easy', 'medium', or 'hard' (default: 'medium')
- `count` (optional): Number of questions (default: 10, max: 20)

**Example Request:**
```bash
curl "http://localhost:5000/api/quiz/ai-questions?topic=Advanced%20Calculus&difficulty=hard&count=15"
```

**Response:**
```json
{
  "ok": true,
  "success": true,
  "questions": [
    {
      "question": "What is the derivative of x^3?",
      "options": ["3x^2", "x^3", "3x", "2x^2"],
      "correctAnswerIndex": 0,
      "correctAnswer": "A",
      "hint": "Use the power rule",
      "difficulty": "hard",
      "category": "Advanced Calculus",
      "explanation": "Using the power rule: d/dx(x^n) = n*x^(n-1)",
      "source": "ai-generated",
      "generatedAt": "2024-01-15T10:30:00Z"
    }
    // ... more questions
  ],
  "source": "cache|mixed|ai-generated",
  "count": 10
}
```

### Pre-generate Common Topics (Admin)

**Endpoint:** `POST /api/quiz/pre-generate`

Starts background generation of questions for common topics:
- Quantitative Reasoning
- Verbal Reasoning
- Mathematics
- General Knowledge
- Science
- English Grammar

**Example Request:**
```bash
curl -X POST "http://localhost:5000/api/quiz/pre-generate"
```

**Response:**
```json
{
  "ok": true,
  "message": "Pre-generation started in background"
}
```

### Get Cached Topics List

**Endpoint:** `GET /api/quiz/cached-topics`

Returns all topics with cached AI-generated questions and their counts.

**Example Request:**
```bash
curl "http://localhost:5000/api/quiz/cached-topics"
```

**Response:**
```json
{
  "ok": true,
  "topics": [
    { "topic": "Mathematics", "count": 45 },
    { "topic": "Science", "count": 32 },
    { "topic": "General Knowledge", "count": 28 }
  ]
}
```

## Frontend Integration

### 1. Update Category Selector

Allow users to input custom topics instead of just selecting from a dropdown:

```jsx
// In App.jsx - renderCategorySelector function
const [customTopic, setCustomTopic] = useState('');

// Add input field for custom topic
<input 
  type="text" 
  placeholder="Enter any topic (e.g., 'Quantum Physics', 'Renaissance History')"
  value={customTopic}
  onChange={(e) => setCustomTopic(e.target.value)}
/>
```

### 2. Call AI Generation Endpoint

Modify `loadQuestions` function in App.jsx:

```jsx
const loadQuestions = async (category, educationLevel) => {
  setLoadingQuestions(true);
  try {
    // Use AI generation endpoint
    const topic = state.selectedCategory || 'General Knowledge';
    const query = new URLSearchParams({ 
      topic, 
      difficulty: educationLevel, 
      count: '12' 
    });
    
    const res = await fetch(
      `${API_BASE_URL}/api/quiz/ai-questions?${query.toString()}`
    );
    const data = await res.json();
    
    if (data.ok && Array.isArray(data.questions) && data.questions.length) {
      setQuestions(normalizeQuestions(data.questions));
      setState((prev) => ({ ...prev, step: 0, answers: [] }));
    }
  } catch (err) {
    setError('Unable to load questions. Please try again.');
  } finally {
    setLoadingQuestions(false);
  }
};
```

## Caching Strategy

### How It Works

1. **First Request for Topic:**
   - Checks MongoDB for existing questions
   - If not found, calls Gemini API
   - Saves generated questions to MongoDB
   - Next requests serve from cache (instant!)

2. **Subsequent Requests:**
   - Serves from MongoDB cache immediately
   - No API calls = No additional cost

3. **Cost Optimization:**
   - Only pay for generating unique topics
   - Popular topics cached permanently
   - ~5¢ per 1000 questions generated

### Example Cache Timeline

```
Time: 0:00 - User requests "Quantum Physics"
  └─ API call → Gemini generates 10 questions
  └─ Questions saved to MongoDB
  └─ User gets questions

Time: 0:05 - Another user requests "Quantum Physics"
  └─ Questions found in MongoDB cache
  └─ No API call needed
  └─ Instant response (cached)

Time: 0:10 - User requests same topic again
  └─ Instant cached response
  └─ Database lookup only
```

## Error Handling

If Gemini API fails:

1. System checks for any cached questions on that topic
2. Returns partial cache if available
3. Shows user-friendly error message
4. Suggests alternative topics

```json
{
  "ok": false,
  "message": "Unable to generate questions: GEMINI_API_KEY not configured",
  "error": "..."
}
```

## Performance Metrics

### Response Times
- **First request (new topic):** ~3-5 seconds (includes API call)
- **Cached request:** <100ms (database lookup only)
- **Pre-generated topics:** Instant after loading

### Cost Estimation
- Gemini API: ~$0.000075 per 1K tokens
- Average question generation: ~3K tokens per 10 questions
- Cost per topic: ~$0.00023 per 10 questions

## Troubleshooting

### Issue: "GEMINI_API_KEY not set"
**Solution:** Add `GEMINI_API_KEY` to your `.env` file

### Issue: Questions look duplicated
**Solution:** Gemini occasionally repeats content. Implement deduplication:
```js
const uniqueQuestions = Array.from(
  new Map(questions.map(q => [q.question, q])).values()
);
```

### Issue: Empty response from Gemini
**Solution:** 
- Check API quota/rate limits
- Verify API key is valid
- Try smaller `count` parameter first

## Future Enhancements

- [ ] Add question difficulty validation
- [ ] Implement question scoring/quality metrics
- [ ] Add multi-language support
- [ ] Create admin dashboard for cache management
- [ ] Add fallback to open-source question banks
- [ ] Implement rate limiting per user/topic
- [ ] Add question explanations with links to resources

## Related Files

- `/server/services/geminiService.js` - Gemini API integration
- `/server/services/questionCacheService.js` - Caching logic
- `/server/routes/quizRoutes.js` - API endpoints
- `/server/models/Question.js` - MongoDB schema

---

**Questions?** Check the API endpoints section or review the service files for detailed comments.
