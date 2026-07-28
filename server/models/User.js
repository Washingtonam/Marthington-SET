import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, unique: true, index: true },
  password: { type: String, default: '' },
  role: { type: String, enum: ['student', 'teacher', 'admin', 'superadmin'], default: 'student' },
  isActive: { type: Boolean, default: true },
  dob: { type: Date },
  testAnswers: [{ questionId: String, selectedIndex: Number }],
  rawScore: { type: Number, default: 0 },
  percentageScore: { type: Number, default: 0 },
  iqScore: { type: Number, default: 0 },
  testType: { type: String, enum: ['iq', 'aptitude', 'course_quiz'], default: 'iq' },
  courseCode: { type: String, default: '' },
  hasPaid: { type: Boolean, default: false },
  flutterwaveTxRef: { type: String, index: true },
  certificateUnlocked: { type: Boolean, default: false },
  certificateUrl: { type: String, default: '' },
  certificateIssuedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('User', userSchema);
