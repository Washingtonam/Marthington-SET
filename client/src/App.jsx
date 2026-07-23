import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, TimerReset, ShieldCheck, BrainCircuit, ArrowRight, Crown, Zap, TrendingUp } from 'lucide-react';
import { questions as defaultQuestions } from './data/questions';

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
  resultsLocked: true
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
  const [timeLeft, setTimeLeft] = useState(20);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/test/questions`)
      .then((res) => res.json())
      .then((data) => { if (data?.length) setQuestions(normalizeQuestions(data)); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (state.step >= questions.length) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev > 0 ? prev - 1 : 20);
    }, 1000);
    return () => clearInterval(timer);
  }, [state.step, questions.length]);

  const currentQuestion = questions[state.step];

  const progressPercent = useMemo(() => {
    if (!questions.length) return 0;
    return ((state.step + 1) / questions.length) * 100;
  }, [questions.length, state.step]);

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
        body: JSON.stringify({ name: state.lead.name || 'Guest', email: state.lead.email || 'guest@example.com', dob: state.lead.dob, answers, rawScore, iqScore })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.message || 'Submission failed');
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
      window.location.href = data.paymentLink;
    } catch (err) {
      setError(err.message || 'Payment failed');
    }
  };

  const renderQuizCard = () => (
    <motion.div
      variants={cardMotion}
      initial="initial"
      animate="animate"
      whileHover={{ y: -3 }}
      className="mx-auto w-full max-w-2xl overflow-hidden rounded-[32px] border border-slate-800/80 bg-slate-900/90 p-6 shadow-[0_0_40px_rgba(99,102,241,0.24)] backdrop-blur-xl sm:p-8"
    >
      <div className="relative mb-6 flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-sm font-semibold uppercase tracking-wide text-indigo-300">
            <span>🧠</span> {currentQuestion?.category}
          </span>
          <span className="flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-sm font-semibold text-amber-400">
            <span>🔥</span> 2x Streak
          </span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-slate-700/50 bg-slate-800/80 px-3 py-1 text-sm font-semibold text-slate-300">
          <TimerReset size={15} className="text-cyan-300" />
          <span className="font-mono text-indigo-300">{timeLeft}s</span>
        </div>
      </div>

      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-400">
          <span>Question {Math.min(state.step + 1, questions.length)} of {questions.length}</span>
          <span>{Math.round(progressPercent)}% Completed</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-800 p-0.5">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_0_12px_rgba(99,102,241,0.8)]"
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={currentQuestion?.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-6">
          <div className="space-y-3">
            <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-[1.75rem]">{currentQuestion?.question}</h2>
            <div className="space-y-4 rounded-2xl border border-slate-700/40 bg-slate-800/60 px-4 py-4 text-indigo-300">
              <div className="mb-3 rounded-3xl border border-slate-700/50 bg-slate-900/70 p-4 text-slate-100 shadow-[0_0_30px_rgba(15,23,42,0.35)]">
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Sequence</div>
                <div className="mt-3 text-base text-slate-300">{currentQuestion?.sequence}</div>
              </div>
              <p className="text-sm text-slate-400">
                <span className="mr-1">💡</span>
                <span className="italic">{currentQuestion?.hint || 'Look at how each number scales from the previous one.'}</span>
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {currentQuestion?.options?.map((option, index) => (
              <motion.button
                key={option.value}
                type="button"
                onClick={() => handleAnswer(index)}
                whileHover={optionMotion.whileHover}
                whileTap={optionMotion.whileTap}
                className="group flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-800/40 px-4 py-4 text-left text-slate-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 hover:-translate-y-0.5 hover:border-indigo-500 hover:bg-slate-800/80"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-slate-300 transition-colors group-hover:bg-indigo-500/20 group-hover:text-indigo-300">{option.label}</span>
                <span className="text-base font-semibold">{option.value}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );

  const renderLeadCollector = () => (
    <motion.div variants={cardMotion} initial="initial" animate="animate" className="overflow-hidden rounded-[28px] border border-fuchsia-400/20 bg-slate-950/75 p-6 shadow-[0_0_70px_rgba(192,132,252,0.16)] backdrop-blur-xl">
      <div className="mb-4 flex items-center gap-2 text-fuchsia-300"><Crown size={18} /> Almost there</div>
      <h3 className="mb-2 text-2xl font-semibold">Unlock the next stage</h3>
      <p className="mb-5 text-sm text-slate-400">We only use this to personalize your IQ report and keep your progress safe.</p>
      <form onSubmit={handleLeadSubmit} className="space-y-3">
        <input required value={state.lead.name} onChange={(e) => setState((prev) => ({ ...prev, lead: { ...prev.lead, name: e.target.value } }))} className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-slate-100 outline-none ring-0 transition focus:border-cyan-400/40" placeholder="Full name" />
        <input type="date" value={state.lead.dob} onChange={(e) => setState((prev) => ({ ...prev, lead: { ...prev.lead, dob: e.target.value } }))} className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/40" />
        <input required type="email" value={state.lead.email} onChange={(e) => setState((prev) => ({ ...prev, lead: { ...prev.lead, email: e.target.value } }))} className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400/40" placeholder="Email address" />
        <button type="submit" className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-4 py-3 font-semibold text-white shadow-lg shadow-cyan-500/20 transition-transform duration-200 hover:-translate-y-0.5 focus:outline-none">Continue <ArrowRight size={16}/></button>
      </form>
      <motion.div variants={glowMotion} className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
        <div className="flex items-center gap-2 text-cyan-300"><Sparkles className="h-4 w-4" /> Secure your premium report and badge unlock.</div>
      </motion.div>
    </motion.div>
  );

  const renderResultsTeaser = () => (
    <motion.div variants={cardMotion} initial="initial" animate="animate" className="overflow-hidden rounded-[28px] border border-amber-400/20 bg-slate-950/75 p-6 shadow-[0_0_70px_rgba(250,204,21,0.16)] backdrop-blur-xl">
      <div className="mb-5 flex items-center gap-2 text-amber-300"><ShieldCheck size={18} /> Premium insight locked</div>
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.12),_transparent_45%)]" />
        <div className="relative space-y-3">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Preliminary estimate</p>
          <h3 className="text-3xl font-semibold text-white">IQ Score: Locked 🔒</h3>
          <div className="grid gap-2 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300">
            <p><span className="mr-2 text-cyan-300"><TrendingUp size={16} className="inline" /></span>Percentile: Top 3%</p>
            <p><span className="mr-2 text-cyan-300"><Zap size={16} className="inline" /></span>Cognitive Strengths: High analytical capability</p>
          </div>
          <motion.button whileHover={{ y: -2, scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={handlePayment} className="mt-4 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-amber-400 px-4 py-3 font-semibold text-white shadow-lg shadow-fuchsia-500/20 transition-transform duration-200">Unlock Official Report & Certificate</motion.button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <motion.div variants={pageMotion} initial="initial" animate="animate" className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.2),_transparent_30%),linear-gradient(135deg,_#020617,_#111827_55%,_#020617)] px-4 py-6 text-slate-50 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute left-1/2 top-12 h-56 w-56 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute right-12 top-1/3 h-72 w-72 rounded-full bg-fuchsia-500/10 blur-3xl" />
      </div>
      <div className="relative mx-auto flex max-w-6xl flex-col gap-6">
        <motion.header initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease: 'easeOut' }} className="overflow-hidden rounded-[32px] border border-slate-800/70 bg-slate-900/70 p-6 shadow-[0_0_40px_rgba(99,102,241,0.18)] backdrop-blur-xl">
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Marthington SET</p>
              <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">A sophisticated cognitive assessment built for high-value certification.</h1>
              <p className="mt-3 text-base text-slate-400">Complete the test, receive a verified certificate, and present your strengths with confidence.</p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-cyan-300">
              <BrainCircuit size={16} /> Adaptive & premium
            </div>
          </div>
        </motion.header>

        <main className="w-full">
          <div className="space-y-6">
            {state.step < questions.length && state.step < 3 ? renderQuizCard() : null}
            {state.step === 3 ? renderLeadCollector() : null}
            {state.step === 4 ? renderResultsTeaser() : null}
            {error ? <div className="mx-auto max-w-2xl rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</div> : null}
          </div>
        </main>
      </div>
    </motion.div>
  );
}

export default App;
