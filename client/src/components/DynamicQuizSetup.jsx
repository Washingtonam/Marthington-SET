import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Search, Zap, BookOpen, TrendingUp } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://marthington-set.onrender.com';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

// Suggested popular subjects for quick access
const POPULAR_SUBJECTS = [
  { name: 'Mathematics', icon: '📊', description: 'Algebra, Geometry, Calculus' },
  { name: 'Physics', icon: '⚛️', description: 'Mechanics, Thermodynamics, Waves' },
  { name: 'Chemistry', icon: '🧪', description: 'Organic, Inorganic, Biochemistry' },
  { name: 'Biology', icon: '🧬', description: 'Anatomy, Ecology, Genetics' },
  { name: 'English Literature', icon: '📖', description: 'Grammar, Writing, Analysis' },
  { name: 'History', icon: '📜', description: 'World Events, Civilizations, Wars' },
  { name: 'Economics', icon: '💰', description: 'Microeconomics, Macroeconomics' },
  { name: 'Computer Science', icon: '💻', description: 'Programming, Algorithms, AI' },
];

const DIFFICULTY_LEVELS = [
  { value: 'nursery', label: 'Nursery', color: 'from-emerald-600 to-teal-600' },
  { value: 'primary', label: 'Primary', color: 'from-blue-600 to-indigo-600' },
  { value: 'secondary', label: 'Secondary', color: 'from-purple-600 to-indigo-600' },
  { value: 'tertiary', label: 'Tertiary', color: 'from-pink-600 to-purple-600' },
];

export default function DynamicQuizSetup({ onStartQuiz }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('secondary');
  const [questionCount, setQuestionCount] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestedSubjects, setSuggestedSubjects] = useState(POPULAR_SUBJECTS);

  // Filter suggestions as user types
  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setError('');
    
    if (value.trim().length > 0) {
      const filtered = POPULAR_SUBJECTS.filter(subject =>
        subject.name.toLowerCase().includes(value.toLowerCase()) ||
        subject.description.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestedSubjects(filtered.length > 0 ? filtered : POPULAR_SUBJECTS);
    } else {
      setSuggestedSubjects(POPULAR_SUBJECTS);
    }
  };

  // Handle subject selection
  const handleSelectSubject = (subject) => {
    setSearchQuery(subject);
  };

  // Start the quiz with AI-generated questions
  const handleStartQuiz = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter or select a subject');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Call the AI question generation endpoint with full URL
      const response = await fetch(
        `${API_BASE_URL}/api/quiz/ai-questions?topic=${encodeURIComponent(searchQuery.trim())}&difficulty=${selectedDifficulty}&count=${questionCount}`
      );

      const data = await response.json();

      if (!data.ok || !data.questions || data.questions.length === 0) {
        throw new Error(data.message || 'Failed to generate questions');
      }

      // Pass questions and metadata to parent
      onStartQuiz({
        questions: data.questions,
        subject: searchQuery.trim(),
        difficulty: selectedDifficulty,
        questionCount: data.questions.length,
        source: data.source,
      });
    } catch (err) {
      setError(err.message || 'Failed to generate questions. Please try again.');
      console.error('Error generating questions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-950 via-indigo-950/20 to-slate-950 pt-20 pb-16 px-4 sm:px-6 lg:px-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-12">
          <div className="inline-block mb-4 px-4 py-2 bg-indigo-950/50 border border-indigo-500/30 rounded-full">
            <span className="text-indigo-300 text-sm font-medium">🚀 Dynamic Quiz Platform</span>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            What do you want to learn today?
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Search any subject, choose your level, and get a personalized AI-generated quiz instantly.
          </p>
        </motion.div>

        {/* Main Search & Setup Card */}
        <motion.div
          variants={itemVariants}
          className="rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 to-purple-950/40 backdrop-blur-xl p-8 sm:p-10 shadow-2xl mb-12"
        >
          {/* Search Input */}
          <div className="mb-8">
            <label className="block text-sm uppercase tracking-wide text-indigo-300 font-semibold mb-3">
              📚 Search Subject or Course
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-4 w-5 h-5 text-indigo-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="e.g., Advanced Calculus, Quantum Physics, Renaissance History..."
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-indigo-500/30 bg-indigo-950/20 text-white placeholder-slate-500 outline-none focus:border-indigo-500/60 focus:bg-indigo-950/30 focus:ring-2 focus:ring-indigo-500/20 transition text-lg"
              />
            </div>
          </div>

          {/* Difficulty Level Selection */}
          <div className="mb-8">
            <label className="block text-sm uppercase tracking-wide text-indigo-300 font-semibold mb-4">
              📊 Select Difficulty Level
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {DIFFICULTY_LEVELS.map((level) => (
                <motion.button
                  key={level.value}
                  onClick={() => setSelectedDifficulty(level.value)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`relative py-3 px-4 rounded-xl font-semibold transition-all border ${
                    selectedDifficulty === level.value
                      ? `border-indigo-500/60 bg-gradient-to-r ${level.color} text-white shadow-lg shadow-indigo-500/30`
                      : 'border-indigo-500/20 bg-indigo-950/20 text-slate-300 hover:border-indigo-500/40 hover:bg-indigo-950/40'
                  }`}
                >
                  {level.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Question Count Selection */}
          <div className="mb-8">
            <label className="block text-sm uppercase tracking-wide text-indigo-300 font-semibold mb-4">
              ❓ Number of Questions
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="5"
                max="30"
                step="1"
                value={questionCount}
                onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                className="flex-1 h-2 bg-indigo-950/30 rounded-full appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex items-center justify-center w-16 py-2 rounded-lg border border-indigo-500/30 bg-indigo-950/30">
                <span className="text-white font-bold text-lg">{questionCount}</span>
              </div>
            </div>
            <p className="text-sm text-slate-400 mt-2">Adjust for quick practice (5-10) or comprehensive review (20-30)</p>
          </div>

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-950/20 text-red-300 text-sm"
            >
              {error}
            </motion.div>
          )}

          {/* Start Quiz Button */}
          <motion.button
            onClick={handleStartQuiz}
            disabled={isLoading || !searchQuery.trim()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-lg shadow-lg shadow-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/70 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                />
                Generating Your Quiz...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                Start Quiz Now
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </motion.button>

          <p className="text-center text-sm text-slate-400 mt-4">
            Estimated time: {Math.ceil(questionCount / 3)} minutes • AI-generated • Instant results
          </p>
        </motion.div>

        {/* Popular Subjects Grid */}
        <motion.div variants={itemVariants}>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-indigo-400" />
            Popular Subjects
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {suggestedSubjects.map((subject, idx) => (
              <motion.button
                key={subject.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => handleSelectSubject(subject.name)}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className="group p-5 rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/20 to-purple-950/20 hover:from-indigo-950/40 hover:to-purple-950/40 hover:border-indigo-500/40 transition-all text-left"
              >
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                  {subject.icon}
                </div>
                <h3 className="font-semibold text-white mb-1">{subject.name}</h3>
                <p className="text-xs text-slate-400">{subject.description}</p>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Features Highlight */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12"
        >
          {[
            {
              icon: '🤖',
              title: 'AI-Powered',
              desc: 'Questions generated on-the-fly for any subject',
            },
            {
              icon: '⚡',
              title: 'Instant Setup',
              desc: 'No waiting - quiz ready in seconds',
            },
            {
              icon: '📈',
              title: 'Smart Scoring',
              desc: 'Get immediate feedback and detailed insights',
            },
          ].map((feature, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-950/20"
            >
              <div className="text-2xl mb-2">{feature.icon}</div>
              <h3 className="font-semibold text-white text-sm">{feature.title}</h3>
              <p className="text-xs text-slate-400 mt-1">{feature.desc}</p>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
