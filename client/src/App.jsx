import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, TimerReset, ShieldCheck, BrainCircuit, ArrowRight, Crown, Zap, TrendingUp } from 'lucide-react';
import { questions as defaultQuestions } from './data/questions';
import CourseUploadModal from './components/CourseUploadModal';
import CourseSearchBar from './components/CourseSearchBar';
import CourseDashboard from './components/CourseDashboard';
import UnifiedTeaserResult from './components/UnifiedTeaserResult';
import PaymentSuccessPage from './components/PaymentSuccessPage';
import LandingPage from './components/LandingPage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://marthington-set.onrender.com';

const normalizeQuestions = (questionList = []) => questionList.map((question, index) => {
  const options = question.options?.map((option, optIndex) => (
    typeof option === 'string'
      ? { label: String.fromCharCode(65 + optIndex), value: option }
      : option
  )) ?? [];

  const correctAnswer = question.correctAnswer
    ?? (typeof question.correctAnswerIndex === 'number' ? String.fromCharCode(65 + question.correctAnswerIndex) : undefined);

  const correctAnswerIndex = options.findIndex((opt) => opt.label === correctAnswer);

  return {
    id: question.id ?? question._id ?? `q${index + 1}`,
    category: question.category ?? 'General',
    difficulty: question.difficulty ?? 'Medium',
    question: question.question ?? question.questionText ?? '',
    sequence: question.sequence ?? options.map((opt) => opt.value).join(' / '),
    hint: question.hint ?? '',
    options,
    correctAnswer,
    correctAnswerIndex: correctAnswerIndex >= 0 ? correctAnswerIndex : undefined
  };
});

const initialState = {
  step: 0,
  answers: [],
  lead: { name: '', email: '', dob: '' },
  submitting: false,
  paid: false,
  resultsLocked: true,
  selectedCategory: 'Quantitative Reasoning',
  selectedEducationLevel: 'general'
};

const pageMotion = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } }
};

const cardMotion = {
  initial: { opacity: 0, y: 24, scale: 0.985 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: 'easeOut' } }
};

const optionMotion = {
  whileHover: { y: -3, scale: 1.01 },
  whileTap: { scale: 0.985 }
};

const glowMotion = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
};

const shapeIcons = {
  Triangle: (
    <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">
      <polygon points="32,8 56,52 8,52" fill="currentColor" />
    </svg>
  ),
  Circle: (
    <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">
      <circle cx="32" cy="32" r="22" fill="currentColor" />
    </svg>
  ),
  Square: (
    <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">
      <rect x="12" y="12" width="40" height="40" rx="6" fill="currentColor" />
    </svg>
  ),
  Hexagon: (
    <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">
      <polygon points="18,20 46,20 58,32 46,44 18,44 6,32" fill="currentColor" />
    </svg>
  )
};

const renderShapeSequence = (sequence = []) => (
  <div className="grid gap-3 sm:grid-cols-4">
    {sequence.map((shape) => (
      <div key={shape} className="group flex flex-col items-center gap-3 rounded-3xl border border-slate-700/40 bg-slate-800/70 p-4 text-slate-100">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-900 text-cyan-300 text-[1.25rem]">
          {shapeIcons[shape] || <span className="text-sm font-semibold">?</span>}
        </div>
        <span className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">{shape}</span>
      </div>
    ))}
  </div>
);

function App() {
  const [questions, setQuestions] = useState(normalizeQuestions(defaultQuestions));
  const [state, setState] = useState(initialState);
  const navigate = useNavigate();
  const location = useLocation();
  const [timeLeft, setTimeLeft] = useState(20);
  const [error, setError] = useState('');
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [showCourseTools, setShowCourseTools] = useState(false);
  const [submissionSummary, setSubmissionSummary] = useState(null);

  useEffect(() => {
    const savedPaid = typeof window !== 'undefined' ? window.localStorage.getItem('marthington-paid') : null;
    if (savedPaid === 'true') {
      setState((prev) => ({ ...prev, paid: true }));
    }
  }, []);

  useEffect(() => {
    if (state.step >= questions.length) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev > 0 ? prev - 1 : 20);
    }, 1000);
    return () => clearInterval(timer);
  }, [state.step, questions.length]);

  const loadQuestions = async (category, educationLevel) => {
    setLoadingQuestions(true);
    try {
      const query = new URLSearchParams({ category, educationLevel, limit: '12' });
      const res = await fetch(`${API_BASE_URL}/api/test/questions?${query.toString()}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length) {
        setQuestions(normalizeQuestions(data));
        setState((prev) => ({ ...prev, step: 0, answers: [] }));
      }
    } catch (err) {
      setError('Unable to load the selected test set.');
    } finally {
      setLoadingQuestions(false);
    }
  };

  const currentQuestion = questions[state.step];

  const progressPercent = useMemo(() => {
    if (!questions.length) return 0;
    return ((state.step + 1) / questions.length) * 100;
  }, [questions.length, state.step]);

  const handleStartTest = async () => {
    await loadQuestions(state.selectedCategory, state.selectedEducationLevel);
    setState((prev) => ({ ...prev, step: 1 }));
  };

  const handleAnswer = (selectedIndex) => {
    const nextAnswers = [...state.answers];
    nextAnswers[state.step] = { questionId: currentQuestion.id, selectedIndex };
    setState((prev) => ({ ...prev, answers: nextAnswers }));
    setTimeLeft(20);

    if (state.step < questions.length - 1) {
      setState((prev) => ({ ...prev, step: prev.step + 1 }));
    } else {
      finalizeQuiz(nextAnswers);
    }
  };

  const finalizeQuiz = async (answers) => {
    const rawScore = answers.reduce((count, answer) => {
      const question = questions.find((q) => q.id === answer.questionId);
      return count + (question?.correctAnswerIndex === answer.selectedIndex ? 1 : 0);
    }, 0);
    const iqScore = 100 + rawScore * 6;
    setState((prev) => ({ ...prev, submitting: true }));
    try {
      const res = await fetch(`${API_BASE_URL}/api/test/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: state.lead.name || 'Guest',
          email: state.lead.email || 'guest@example.com',
          dob: state.lead.dob,
          answers,
          rawScore,
          iqScore,
          testMetadata: {
            category: state.selectedCategory,
            educationLevel: state.selectedEducationLevel
          }
        })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.message || 'Submission failed');
      setSubmissionSummary(data.summary || null);
      setState((prev) => ({ ...prev, resultsLocked: true, submitting: false, paid: false }));
    } catch (err) {
      setError(err.message || 'Submission failed');
      setState((prev) => ({ ...prev, submitting: false }));
    }
  };

  const handleLeadSubmit = async (e) => {
    e.preventDefault();
    setState((prev) => ({ ...prev, submitting: true }));
    try {
      const res = await fetch(`${API_BASE_URL}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state.lead)
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.message || 'Lead submission failed');
      setState((prev) => ({ ...prev, submitting: false }));
      setError('');
      setState((prev) => ({ ...prev, step: prev.step + 1 }));
    } catch (err) {
      setError(err.message || 'Lead submission failed');
      setState((prev) => ({ ...prev, submitting: false }));
    }
  };

  const handlePayment = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/payments/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: state.lead.email, name: state.lead.name, amount: 49, subaccount: 'subaccount_123' })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.message || 'Payment failed');
      setState((prev) => ({ ...prev, paid: true }));
      window.localStorage.setItem('marthington-paid', 'true');
      window.location.href = data.paymentLink;
    } catch (err) {
      setError(err.message || 'Payment failed');
    }
  };

  const renderCategorySelector = () => (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-950 via-indigo-950/20 to-slate-950 pt-32 pb-24 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <motion.div variants={cardMotion} initial="initial" animate="animate" className="w-full max-w-3xl">
        {/* Header Section */}
        <div className="mb-12 text-center">
          <div className="inline-block mb-4 px-4 py-2 bg-indigo-950/50 border border-indigo-500/30 rounded-full">
            <span className="text-indigo-300 text-sm font-medium">✨ Premium Assessment</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight">
            A Sophisticated Cognitive Assessment
          </h1>
          <p className="text-xl text-slate-400 mb-2">
            Built for high-value certification.
          </p>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Complete the test, receive a verified certificate, and present your strengths with confidence.
          </p>
        </div>

        {/* Form Card */}
        <motion.div className="rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/40 to-purple-950/40 backdrop-blur-xl p-8 sm:p-12 shadow-2xl">
          <div className="space-y-8">
            {/* Category Selection */}
            <div>
              <label className="block mb-3">
                <p className="text-sm uppercase tracking-[0.15em] text-indigo-300 font-semibold mb-2">Test Category</p>
                <p className="text-slate-400 text-sm mb-4">Choose the subject area you want to be assessed on</p>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { value: 'Quantitative Reasoning', label: '📊 Quantitative Reasoning' },
                  { value: 'Verbal Reasoning', label: '📖 Verbal Reasoning' },
                  { value: 'Mathematics', label: '🔢 Mathematics' },
                  { value: 'General Knowledge', label: '🌍 General Knowledge' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setState((prev) => ({ ...prev, selectedCategory: option.value }))}
                    className={`relative group px-4 py-3 rounded-xl font-medium transition-all duration-300 border ${
                      state.selectedCategory === option.value
                        ? 'border-indigo-500/50 bg-indigo-600/30 text-white shadow-lg shadow-indigo-500/30'
                        : 'border-indigo-500/20 bg-indigo-950/20 text-slate-300 hover:border-indigo-500/40 hover:bg-indigo-950/40'
                    }`}
                  >
                    {option.label}
                    {state.selectedCategory === option.value && (
                      <motion.div
                        layoutId="active-category"
                        className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-600/20 to-purple-600/20 -z-10"
                        transition={{ type: 'spring', duration: 0.4 }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Education Level Selection */}
            <div>
              <label className="block mb-3">
                <p className="text-sm uppercase tracking-[0.15em] text-indigo-300 font-semibold mb-2">Education Level</p>
                <p className="text-slate-400 text-sm mb-4">Select the difficulty level that matches your background</p>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { value: 'general', label: 'General' },
                  { value: 'primary', label: 'Primary' },
                  { value: 'secondary', label: 'Secondary' },
                  { value: 'tertiary', label: 'Tertiary' },
                  { value: 'nursery', label: 'Nursery' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setState((prev) => ({ ...prev, selectedEducationLevel: option.value }))}
                    className={`px-3 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 border ${
                      state.selectedEducationLevel === option.value
                        ? 'border-indigo-500/50 bg-indigo-600/30 text-white shadow-md shadow-indigo-500/30'
                        : 'border-indigo-500/20 bg-indigo-950/20 text-slate-300 hover:border-indigo-500/40 hover:bg-indigo-950/40'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Info Box */}
            <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-4">
              <p className="text-sm text-slate-300 flex items-center gap-2">
                <span className="text-indigo-400">ℹ️</span>
                <span>After completing the test, you'll receive your IQ assessment and a shareable certificate of achievement.</span>
              </p>
            </div>

            {/* Start Button */}
            <motion.button
              onClick={handleStartTest}
              disabled={loadingQuestions}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-semibold text-lg shadow-lg shadow-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/70 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loadingQuestions ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                  Loading Questions...
                </>
              ) : (
                <>
                  Begin Assessment
                  <ArrowRight size={20} />
                </>
              )}
            </motion.button>

            {/* Footer Note */}
            <p className="text-xs text-center text-slate-500">
              Estimated time: 15-20 minutes • Free assessment • No payment required
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );

  const renderQuizCard = () => (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-950 via-indigo-950/20 to-slate-950 pt-24 pb-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <motion.div
        variants={cardMotion}
        initial="initial"
        animate="animate"
        className="w-full max-w-3xl overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 to-purple-950/40 backdrop-blur-xl p-8 sm:p-10 shadow-2xl"
      >
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-4 py-2 rounded-full border border-indigo-500/40 bg-indigo-600/20 text-indigo-300 text-sm font-semibold">
                📊 {currentQuestion?.category}
              </span>
              <span className="px-4 py-2 rounded-full border border-yellow-500/40 bg-yellow-600/20 text-yellow-300 text-sm font-semibold">
                🔥 2x Streak
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/30 bg-indigo-950/50">
              <TimerReset size={18} className="text-indigo-400" />
              <span className="font-mono text-lg font-bold text-indigo-300">{timeLeft}s</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-slate-400">
              <span>Question {Math.min(state.step + 1, questions.length)} of {questions.length}</span>
              <span>{Math.round(progressPercent)}% Complete</span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden bg-slate-800/50 border border-indigo-500/20">
              <motion.div
                className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/50"
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>

        {/* Question Content */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentQuestion?.id} 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }} 
            className="space-y-8"
          >
            {/* Question Text */}
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-white leading-tight">
                {currentQuestion?.question}
              </h2>
              
              {/* Sequence or Context Box */}
              {currentQuestion?.sequence && (
                <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/30 p-6">
                  <p className="text-sm uppercase tracking-wide text-indigo-300 font-semibold mb-3">
                    Sequence
                  </p>
                  <p className="text-lg font-semibold text-white">
                    {currentQuestion?.sequence}
                  </p>
                </div>
              )}

              {/* Hint */}
              {currentQuestion?.hint && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 flex gap-3">
                  <span className="text-xl flex-shrink-0">💡</span>
                  <p className="text-sm text-slate-300 italic">
                    {currentQuestion?.hint}
                  </p>
                </div>
              )}
            </div>

            {/* Answer Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {currentQuestion?.options?.map((option, index) => (
                <motion.button
                  key={option.value}
                  type="button"
                  onClick={() => handleAnswer(index)}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="group relative flex items-start gap-4 p-5 rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/20 to-purple-950/20 hover:from-indigo-950/40 hover:to-purple-950/40 hover:border-indigo-500/50 transition-all text-left"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex-shrink-0 text-white font-bold text-lg group-hover:shadow-lg group-hover:shadow-indigo-500/50 transition">
                    {option.label}
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="font-semibold text-white text-base leading-tight">
                      {option.value}
                    </p>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );

  const renderLeadCollector = () => (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-950 via-indigo-950/20 to-slate-950 pt-24 pb-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <motion.div variants={cardMotion} initial="initial" animate="animate" className="w-full max-w-2xl overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 to-purple-950/40 backdrop-blur-xl p-8 sm:p-10 shadow-2xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-indigo-300 mb-3">
            <Crown size={20} className="text-indigo-400" /> 
            <span className="font-semibold">Almost there</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Unlock Your Assessment</h2>
          <p className="text-slate-400">We only use this to personalize your report and keep your progress secure.</p>
        </div>

        <form onSubmit={handleLeadSubmit} className="space-y-4 mb-8">
          <div>
            <label className="block text-sm text-slate-300 mb-2 font-medium">Full Name</label>
            <input 
              required 
              value={state.lead.name} 
              onChange={(e) => setState((prev) => ({ ...prev, lead: { ...prev.lead, name: e.target.value } }))} 
              className="w-full rounded-2xl border border-indigo-500/30 bg-indigo-950/20 px-4 py-3 text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500/60 focus:bg-indigo-950/30 transition" 
              placeholder="John Doe" 
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2 font-medium">Date of Birth</label>
            <input 
              type="date" 
              value={state.lead.dob} 
              onChange={(e) => setState((prev) => ({ ...prev, lead: { ...prev.lead, dob: e.target.value } }))} 
              className="w-full rounded-2xl border border-indigo-500/30 bg-indigo-950/20 px-4 py-3 text-slate-100 outline-none focus:border-indigo-500/60 focus:bg-indigo-950/30 transition" 
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2 font-medium">Email Address</label>
            <input 
              required 
              type="email" 
              value={state.lead.email} 
              onChange={(e) => setState((prev) => ({ ...prev, lead: { ...prev.lead, email: e.target.value } }))} 
              className="w-full rounded-2xl border border-indigo-500/30 bg-indigo-950/20 px-4 py-3 text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500/60 focus:bg-indigo-950/30 transition" 
              placeholder="you@example.com" 
            />
          </div>
          <motion.button 
            type="submit" 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 font-semibold text-white shadow-lg shadow-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/70 transition"
          >
            Continue to Results <ArrowRight size={18}/>
          </motion.button>
        </form>

        <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-4">
          <div className="flex items-center gap-2 text-indigo-300 text-sm">
            <Sparkles className="w-4 h-4 text-indigo-400" /> 
            <span>Your data is encrypted and secure. We never share your information.</span>
          </div>
        </div>
      </motion.div>
    </div>
  );

  const renderResultsTeaser = () => (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-950 via-indigo-950/20 to-slate-950 pt-24 pb-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <motion.div variants={cardMotion} initial="initial" animate="animate" className="w-full max-w-3xl overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 to-purple-950/40 backdrop-blur-xl p-8 sm:p-10 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/30 bg-indigo-950/40 mb-4">
            <ShieldCheck size={18} className="text-indigo-400" />
            <span className="text-indigo-300 text-sm font-semibold">Premium Assessment Locked</span>
          </div>
          <h2 className="text-3xl font-bold text-white">Your Results Are Ready</h2>
        </div>

        <UnifiedTeaserResult 
          percentage={submissionSummary?.iqScore ? Math.min(100, submissionSummary.iqScore) : submissionSummary?.rawScore ? Math.round((submissionSummary.rawScore / Math.max(1, questions.length)) * 100) : 0} 
          onUnlock={handlePayment} 
        />

        <div className="mt-8 rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-6">
          <p className="text-sm text-slate-300 mb-3">
            <span className="font-semibold text-white block mb-2">✨ Unlock Your Full Report</span>
            Get detailed insights, answer breakdowns, certified report, and shareable badge.
          </p>
        </div>
      </motion.div>
    </div>
  );

  const renderMainExperience = () => (
    <motion.div variants={pageMotion} initial="initial" animate="animate" className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-950 via-indigo-950/20 to-slate-950 px-4 py-8 text-slate-50 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="absolute right-0 top-1/2 h-80 w-80 rounded-full bg-purple-600/10 blur-3xl" />
      </div>
      <div className="relative mx-auto flex max-w-6xl flex-col gap-6">
        <motion.header initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease: 'easeOut' }} className="overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 to-purple-950/40 p-8 shadow-2xl backdrop-blur-xl">
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div className="max-w-2xl">
              <div className="inline-block mb-3 px-4 py-2 bg-indigo-950/50 border border-indigo-500/30 rounded-full">
                <span className="text-indigo-300 text-sm font-medium">✨ Marthington SET</span>
              </div>
              <h1 className="text-4xl font-bold text-white mb-3">A Sophisticated Cognitive Assessment</h1>
              <p className="text-lg text-slate-300">Built for high-value certification. Complete the test, receive a verified certificate, and present your strengths with confidence.</p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-950/40 px-4 py-2 text-indigo-300 whitespace-nowrap">
              <BrainCircuit size={18} className="text-indigo-400" /> 
              <span className="font-semibold">Adaptive & Premium</span>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <motion.button 
              onClick={() => setShowCourseTools((prev) => !prev)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="rounded-xl border border-indigo-500/30 bg-indigo-950/30 hover:bg-indigo-950/50 px-4 py-2 text-sm font-medium text-indigo-300 transition"
            >
              {showCourseTools ? '✕ Hide course tools' : '+ Use course upload/search'}
            </motion.button>
          </div>
        </motion.header>

        <main className="w-full">
          <div className="space-y-6">
            {showCourseTools ? (
              <div className="mx-auto grid w-full max-w-6xl gap-4 lg:grid-cols-2">
                <CourseUploadModal />
                <CourseSearchBar />
              </div>
            ) : null}
            {showCourseTools ? <CourseDashboard /> : null}
            {state.step === 0 ? renderCategorySelector() : null}
            {state.step >= 1 && state.step < questions.length && state.step < 3 ? renderQuizCard() : null}
            {state.step === 3 ? renderLeadCollector() : null}
            {state.step === 4 ? renderResultsTeaser() : null}
            {error ? <div className="mx-auto max-w-2xl rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</div> : null}
          </div>
        </main>
      </div>
    </motion.div>
  );

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/quiz" element={renderMainExperience()} />
      <Route path="/payment-success" element={<PaymentSuccessPage />} />
      <Route path="*" element={<LandingPage />} />
    </Routes>
  );
}

export default App;
