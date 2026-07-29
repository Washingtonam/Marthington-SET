# Open-Source Question Banks

This guide helps you find, download, and integrate open-source question banks into Marthington IQ.

## Why Use Open-Source Banks?

✅ **Free & Reliable** - No licensing costs, vetted by community
✅ **Diverse Topics** - Thousands of questions across many subjects
✅ **Instant Fallback** - If AI generation fails, serve from static banks
✅ **Scalability** - Reduces dependency on API costs
✅ **Offline Support** - Questions available even if AI API is down

## Recommended GitHub Repositories

### 1. **OpenTDB (Open Trivia Database)**
- **URL:** https://github.com/uclatommy/OpenTriviaQA
- **Questions:** 4,000+ trivia questions
- **Categories:** General Knowledge, History, Sports, Science
- **Format:** JSON
- **License:** Open

**Download:**
```bash
git clone https://github.com/uclatommy/OpenTriviaQA.git
# Copy the JSON files to server/data/
```

### 2. **Kahoots Quiz Dataset**
- **URL:** https://github.com/brahmcapital/Kahoots_Quiz_Data
- **Questions:** 10,000+ from Kahoot platform
- **Categories:** Education, STEM, History, Languages
- **Format:** CSV/JSON
- **License:** MIT

**Download:**
```bash
git clone https://github.com/brahmcapital/Kahoots_Quiz_Data.git
```

### 3. **Question Bank by KevinLiao159**
- **URL:** https://github.com/KevinLiao159/QuizGPT
- **Questions:** 2,000+ multi-choice questions
- **Categories:** Math, Science, History, Geography
- **Format:** JSON
- **License:** MIT

**Download:**
```bash
git clone https://github.com/KevinLiao159/QuizGPT.git
```

### 4. **IQ Test Questions Dataset**
- **URL:** https://github.com/search?q=iq-test-questions-dataset
- **Questions:** 1,000+ IQ test questions
- **Difficulty:** Progressive (Easy → Hard)
- **Format:** JSON
- **License:** Various

### 5. **Educational Resources (OER Commons)**
- **URL:** https://www.oercommons.org/
- **Questions:** Thousands of academic questions
- **Categories:** All subjects
- **Format:** Multiple formats
- **License:** Various open licenses

## Setup Process

### Step 1: Download Questions

Choose a repository and download the questions file:

```bash
# Example: Download OpenTDB
wget https://raw.githubusercontent.com/uclatommy/OpenTriviaQA/master/questions.json
```

### Step 2: Place in Data Folder

```bash
cd server
mkdir -p data
cp questions.json data/open-source-questions.json
```

### Step 3: Format Validation

Ensure your JSON file has one of these structures:

**Format A (array of questions):**
```json
[
  {
    "question": "What is the capital of France?",
    "options": ["London", "Paris", "Berlin", "Madrid"],
    "correctAnswer": 1,
    "category": "Geography",
    "difficulty": "easy"
  }
]
```

**Format B (object with questions array):**
```json
{
  "questions": [
    { ... }
  ]
}
```

### Step 4: Run Import Script

```bash
cd server
node scripts/importOpenSourceQuestions.js
```

Expected output:
```
📂 Reading questions from: server/data/open-source-questions.json
📚 Found 4,000 questions in file

🔧 Normalizing questions...
✅ Normalized 3,998 questions

📊 Questions by Category:
   Geography: 1,200 questions
   Science: 1,100 questions
   History: 900 questions
   Sports: 798 questions

💾 Importing to MongoDB...
✅ Successfully imported 3,998 questions

📈 Database Statistics:
   open-source: 3,998 questions
   ai-generated: 450 questions
   TOTAL: 4,448 questions

🎉 Import completed successfully!
```

## Combining Multiple Banks

To combine questions from multiple sources:

```bash
# Download multiple repositories
git clone https://github.com/uclatommy/OpenTriviaQA.git
git clone https://github.com/brahmcapital/Kahoots_Quiz_Data.git

# Merge JSON files
node server/scripts/mergeQuestions.js

# Import combined file
node server/scripts/importOpenSourceQuestions.js
```

## JSON Format Conversion

If your source uses a different format, create a conversion script:

```javascript
// Example: Convert CSV to JSON
const csv = require('csv-parse');
const fs = require('fs');

fs.createReadStream('questions.csv')
  .pipe(csv())
  .on('data', (row) => {
    console.log(JSON.stringify({
      question: row.question,
      options: [row.optionA, row.optionB, row.optionC, row.optionD],
      correctAnswerIndex: parseInt(row.correct),
      category: row.category,
      difficulty: row.difficulty
    }));
  });
```

## Strategy: Hybrid Approach

**Recommended setup for maximum coverage:**

```
┌─────────────────────────────────────────┐
│     User Requests Questions              │
└──────────────┬──────────────────────────┘
               │
        ┌──────▼──────┐
        │Check Cache? │
        └──────┬──────┘
         ┌─────┴─────┐
         │           │
      YES│           │NO
         │           │
         ▼           ▼
      [Cache]   [Open-Source]
                     │
                     ├─Found? → Return
                     │
                     ├─Not Found → Call AI
                     │
                     └─Cache + Return
```

## Fallback Strategy

Modify `questionCacheService.js`:

```javascript
export async function getOrGenerateQuestions(topic, difficulty, count) {
  // Try cache first
  const cached = await Question.find({...}).limit(count);
  if (cached.length >= count) return cached;

  // Try open-source bank
  const openSource = await Question.find({
    category: topic,
    source: 'open-source'
  }).limit(count - cached.length);

  if (cached.length + openSource.length >= count) {
    return [...cached, ...openSource];
  }

  // Last resort: AI generation
  const generated = await generateQuestions(topic, difficulty, count);
  return [...cached, ...openSource, ...generated];
}
```

## Legal & Licensing

**Important:** Always respect the licenses of open-source content.

- **MIT License** - Can use commercially, credit authors
- **CC0 (Public Domain)** - No restrictions
- **CC-BY** - Can use if you attribute
- **CC-BY-SA** - Must share-alike

Check each repository's `LICENSE` file before importing.

## Performance Tips

1. **Index Categories**: Faster lookups
   ```javascript
   db.questions.createIndex({ category: 1, source: 1 })
   ```

2. **Regular Backups**
   ```bash
   mongodump --db marthington-db
   ```

3. **Monitor Database Size**
   ```javascript
   db.questions.stats()
   ```

4. **Archive Old Questions** (every 3 months)
   ```bash
   node scripts/archiveOldQuestions.js
   ```

## Troubleshooting

### Q: Import fails with "No JSON array found"
**A:** Ensure JSON structure matches Format A or B above. Validate with:
```bash
jq . server/data/open-source-questions.json
```

### Q: Duplicate questions after multiple imports
**A:** MongoDB should reject duplicates if you index the `question` field:
```javascript
db.questions.createIndex({ question: 1 }, { unique: true })
```

### Q: Questions have wrong category mapping
**A:** Edit the mapping in `importOpenSourceQuestions.js`:
```javascript
const categoryMapping = {
  'Science': 'Science',
  'geo': 'Geography',
  'hist': 'History'
};
```

### Q: Need to delete imported questions
**A:** 
```javascript
await Question.deleteMany({ source: 'open-source' })
```

## What's Next?

After setting up open-source banks:

1. ✅ Pre-generate common AI topics
2. ✅ Monitor cache hit rates
3. ✅ Optimize Gemini prompts based on quality
4. ✅ Add admin dashboard for question management
5. ✅ Implement ML to score question quality

---

**Questions?** Check individual repository READMEs or open an issue in this project.
