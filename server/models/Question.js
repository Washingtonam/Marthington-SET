import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true, trim: true },
  options: { type: [String], default: [] },
  correctAnswerIndex: { type: Number, default: null },
  category: { type: String, default: 'general' },
  educationLevel: { type: String, enum: ['general', 'nursery', 'primary', 'secondary', 'tertiary'], default: 'general' },
  topic: { type: String, default: '' },
  sourceTextbook: { type: String, default: '' },
  questionType: { type: String, enum: ['multiple_choice', 'true_false', 'image_matrix', 'comprehension'], default: 'multiple_choice' },
  passageText: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  isVerified: { type: Boolean, default: true },
  courseCode: { type: String, default: '', index: true },
  courseTitle: { type: String, default: '', index: true },
  uploadedBy: { type: String, default: '' },
  isPublic: { type: Boolean, default: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Question', questionSchema);
