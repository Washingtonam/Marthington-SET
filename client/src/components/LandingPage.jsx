import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Brain,
  BarChart3,
  Shield,
  Zap,
  CheckCircle,
  ChevronDown,
  Star,
  Users,
  Sparkles,
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const featureCards = [
  {
    icon: Brain,
    title: 'AI-Powered Practice',
    description:
      'Adaptive quizzes that learn your weak points and focus on what matters most.',
  },
  {
    icon: BarChart3,
    title: 'Performance Analytics',
    description:
      'Track your progress with detailed insights and personalized recommendations.',
  },
  {
    icon: Zap,
    title: 'Instant Feedback',
    description:
      'Get immediate explanations for every answer to accelerate your learning.',
  },
  {
    icon: Shield,
    title: 'Comprehensive Coverage',
    description:
      'Practice with hundreds of exam-like questions across all topics.',
  },
];

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Medical Student',
    image: '👩‍⚕️',
    content:
      'This platform completely transformed my exam preparation. I went from 65% to 92% in just 3 months!',
    rating: 5,
  },
  {
    name: 'Marcus Chen',
    role: 'Law Student',
    image: '👨‍⚖️',
    content:
      'The AI-powered recommendations helped me focus on exactly what I needed. Best investment in my education.',
    rating: 5,
  },
  {
    name: 'Amara Williams',
    role: 'Engineering Student',
    image: '👩‍🔬',
    content:
      "I love how the platform adapts to my learning pace. The explanations are crystal clear and helpful.",
    rating: 5,
  },
  {
    name: 'David Rodriguez',
    role: 'MBA Graduate',
    image: '👨‍💼',
    content:
      'Outstanding platform for serious learners. The analytics dashboard keeps me accountable and motivated.',
    rating: 5,
  },
];

const faqItems = [
  {
    question: 'How does the AI personalization work?',
    answer:
      'Our AI analyzes your answers in real-time to identify patterns and knowledge gaps. It then recommends practice questions specifically designed to address your weak areas while reinforcing your strengths.',
  },
  {
    question: 'Can I track my progress over time?',
    answer:
      'Yes! Our advanced analytics dashboard shows your performance trends, improvement areas, estimated readiness score, and detailed category breakdowns.',
  },
  {
    question: 'What exams are covered?',
    answer:
      'We support a wide range of standardized exams including medical entrance, law entrance, engineering, MBA, and many competitive examinations.',
  },
  {
    question: 'Is there a free trial?',
    answer:
      'Absolutely! You can start with our free tier to explore features. Premium plans unlock full AI capabilities and unlimited practice.',
  },
  {
    question: 'How often is content updated?',
    answer:
      'We update our question bank weekly with the latest exam patterns, trending topics, and student feedback to ensure you\'re always prepared.',
  },
];

const pricingPlans = [
  {
    name: 'Starter',
    price: '₹499',
    period: '/month',
    description: 'Perfect for casual learners',
    features: [
      'Unlimited practice questions',
      'Basic analytics',
      'Email support',
      'Access to 3 categories',
    ],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Professional',
    price: '₹1,299',
    period: '/month',
    description: 'Most popular for serious students',
    features: [
      'Everything in Starter',
      'AI-powered personalization',
      'Advanced analytics & insights',
      'Priority support',
      'All categories unlocked',
      'Performance reports',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Expert',
    price: '₹2,299',
    period: '/month',
    description: 'For those preparing intensively',
    features: [
      'Everything in Professional',
      'Personalized study plan',
      '1-on-1 mentor sessions',
      'Custom question sets',
      'Lifetime access to materials',
      'Dedicated success coach',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

function FAQItem({ item, isOpen, onToggle }) {
  return (
    <motion.div
      className={`border rounded-xl transition-all ${
        isOpen
          ? 'border-indigo-500/50 bg-indigo-950/30'
          : 'border-slate-700/50 bg-slate-900/50'
      }`}
      initial={false}
    >
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-800/50 transition"
      >
        <span className="text-left font-medium text-slate-100">{item.question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown className="w-5 h-5 text-indigo-400" />
        </motion.div>
      </button>
      <motion.div
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <p className="px-6 pb-4 text-slate-400">{item.answer}</p>
      </motion.div>
    </motion.div>
  );
}

export default function LandingPage() {
  const [openFAQ, setOpenFAQ] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950/20 to-slate-950">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Marthington IQ</span>
          </div>
          <button className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-indigo-500/50 transition">
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.section
        className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div variants={itemVariants}>
            <div className="inline-block mb-6 px-4 py-2 bg-indigo-950/50 border border-indigo-500/30 rounded-full">
              <span className="text-indigo-300 text-sm font-medium">✨ AI-Powered Learning</span>
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6 leading-tight">
              Ace Your Exams with AI-Powered Practice
            </h1>
            <p className="text-xl text-slate-400 mb-8 leading-relaxed">
              Evaluate yourself with intelligent quizzes that adapt to your learning pace. Get instant feedback, track progress, and achieve your highest potential.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-indigo-500/50 transition"
              >
                Start Free Trial <ArrowRight className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 border border-indigo-500/30 text-indigo-300 rounded-lg font-semibold hover:bg-indigo-950/30 transition"
              >
                Watch Demo
              </motion.button>
            </div>
            <div className="flex items-center gap-8 text-slate-400">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <span className="font-medium">4.9/5 from 2,000+ users</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <span className="font-medium">Join 50K+ students</span>
              </div>
            </div>
          </motion.div>

          {/* Hero Image/Illustration */}
          <motion.div
            variants={itemVariants}
            className="relative h-96 lg:h-full min-h-[400px]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-3xl blur-3xl" />
            <div className="relative h-full bg-gradient-to-br from-indigo-950/50 to-purple-950/50 border border-indigo-500/30 rounded-3xl flex items-center justify-center overflow-hidden">
              <div className="text-center">
                <Brain className="w-32 h-32 text-indigo-400 mx-auto mb-4 opacity-50" />
                <p className="text-slate-400">Intelligent Learning Platform</p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/50"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div className="text-center mb-16" variants={itemVariants}>
            <h2 className="text-4xl font-bold text-white mb-4">Why Choose Marthington IQ?</h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Powerful tools designed to accelerate your learning journey and maximize exam success.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featureCards.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="group p-6 bg-gradient-to-br from-indigo-950/30 to-purple-950/30 border border-indigo-500/20 rounded-2xl hover:border-indigo-500/50 hover:bg-indigo-950/40 transition-all"
                whileHover={{ y: -8 }}
              >
                <feature.icon className="w-12 h-12 text-indigo-400 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* How It Works */}
      <motion.section
        className="py-20 px-4 sm:px-6 lg:px-8"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div className="text-center mb-16" variants={itemVariants}>
            <h2 className="text-4xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-xl text-slate-400">Three simple steps to exam success</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { num: '1', title: 'Take Practice Quiz', desc: 'Answer AI-curated questions tailored to your level' },
              { num: '2', title: 'Get Instant Feedback', desc: 'Receive detailed explanations for every question' },
              { num: '3', title: 'Track & Improve', desc: 'Monitor progress and identify areas to focus on' },
            ].map((step, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                className="relative text-center group"
              >
                <div className="mb-6 flex justify-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-2xl font-bold text-white">
                    {step.num}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-slate-400">{step.desc}</p>
                {idx < 2 && (
                  <div className="hidden md:block absolute top-8 -right-4 w-8 text-indigo-500">
                    <ArrowRight className="w-full" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Testimonials Section - EMPHASIZED */}
      <motion.section
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-indigo-950/30 to-slate-950"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div className="text-center mb-16" variants={itemVariants}>
            <div className="inline-block mb-4 px-4 py-2 bg-indigo-950/50 border border-indigo-500/30 rounded-full">
              <span className="text-indigo-300 text-sm font-medium">⭐ Student Success Stories</span>
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">Trusted by 50K+ Students</h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              See how students like you are achieving remarkable exam results with Marthington IQ
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="p-6 bg-gradient-to-br from-slate-800/50 to-indigo-900/30 border border-indigo-500/20 rounded-2xl hover:border-indigo-500/50 transition-all"
                whileHover={{ scale: 1.05 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-3xl">{testimonial.image}</div>
                  <div>
                    <p className="font-semibold text-white text-sm">{testimonial.name}</p>
                    <p className="text-indigo-300 text-xs">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex gap-1 mb-4">
                  {Array(testimonial.rating)
                    .fill(0)
                    .map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    ))}
                </div>
                <p className="text-slate-300 text-sm italic">"{testimonial.content}"</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* FAQ Section */}
      <motion.section
        className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/50"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="max-w-3xl mx-auto">
          <motion.div className="text-center mb-12" variants={itemVariants}>
            <h2 className="text-4xl font-bold text-white mb-4">Frequently Asked Questions</h2>
            <p className="text-slate-400">Everything you need to know about Marthington IQ</p>
          </motion.div>

          <div className="space-y-4">
            {faqItems.map((item, idx) => (
              <FAQItem
                key={idx}
                item={item}
                isOpen={openFAQ === idx}
                onToggle={() => setOpenFAQ(openFAQ === idx ? -1 : idx)}
              />
            ))}
          </div>
        </div>
      </motion.section>

      {/* Pricing Section */}
      <motion.section
        className="py-20 px-4 sm:px-6 lg:px-8"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div className="text-center mb-16" variants={itemVariants}>
            <h2 className="text-4xl font-bold text-white mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Choose the perfect plan for your learning goals. All plans include a 7-day free trial.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className={`relative rounded-2xl overflow-hidden transition-all ${
                  plan.highlighted
                    ? 'ring-2 ring-indigo-500 md:scale-105'
                    : 'border border-slate-700/50'
                }`}
                whileHover={{ y: -8 }}
              >
                {plan.highlighted && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 to-purple-600" />
                )}
                <div
                  className={`p-8 ${
                    plan.highlighted
                      ? 'bg-gradient-to-br from-indigo-950/80 to-purple-950/80'
                      : 'bg-gradient-to-br from-slate-900/50 to-slate-800/50'
                  }`}
                >
                  {plan.highlighted && (
                    <div className="inline-block mb-4 px-3 py-1 bg-indigo-600/30 text-indigo-300 rounded-full text-xs font-semibold">
                      Most Popular
                    </div>
                  )}
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-slate-400 text-sm mb-6">{plan.description}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-slate-400">{plan.period}</span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full py-3 rounded-lg font-semibold mb-8 transition ${
                      plan.highlighted
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:shadow-indigo-500/50'
                        : 'border border-indigo-500/30 text-indigo-300 hover:bg-indigo-950/30'
                    }`}
                  >
                    {plan.cta}
                  </motion.button>
                  <ul className="space-y-3">
                    {plan.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-center gap-3 text-slate-300">
                        <CheckCircle className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Final CTA */}
      <motion.section
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-indigo-950/50 to-purple-950/50 border-t border-indigo-500/20"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2 className="text-4xl font-bold text-white mb-6" variants={itemVariants}>
            Ready to Transform Your Exam Prep?
          </motion.h2>
          <motion.p className="text-xl text-slate-300 mb-8" variants={itemVariants}>
            Start with our free trial today. No credit card required.
          </motion.p>
          <motion.button
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-10 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold text-lg hover:shadow-lg hover:shadow-indigo-500/50 transition"
          >
            Get Started Free
          </motion.button>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="bg-slate-950/80 border-t border-slate-800/50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-white">Marthington IQ</span>
              </div>
              <p className="text-slate-400 text-sm">
                AI-powered exam preparation for ambitious learners.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-indigo-300 transition">Features</a></li>
                <li><a href="#" className="hover:text-indigo-300 transition">Pricing</a></li>
                <li><a href="#" className="hover:text-indigo-300 transition">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-indigo-300 transition">About</a></li>
                <li><a href="#" className="hover:text-indigo-300 transition">Contact</a></li>
                <li><a href="#" className="hover:text-indigo-300 transition">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-indigo-300 transition">Privacy</a></li>
                <li><a href="#" className="hover:text-indigo-300 transition">Terms</a></li>
                <li><a href="#" className="hover:text-indigo-300 transition">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800/50 pt-8">
            <p className="text-center text-slate-500 text-sm">
              © 2024 Marthington IQ. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
