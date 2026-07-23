import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, unique: true, index: true },
  dob: { type: Date },
  testAnswers: [{ questionId: String, selectedIndex: Number }],
  rawScore: { type: Number, default: 0 },
  iqScore: { type: Number, default: 0 },
  hasPaid: { type: Boolean, default: false },
  flutterwaveTxRef: { type: String, index: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('User', userSchema);
