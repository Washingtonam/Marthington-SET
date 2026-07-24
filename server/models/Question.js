import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: { type: [String], required: true },
  correctAnswerIndex: { type: Number, required: true },
  category: { type: String, enum: ['Spatial', 'Logical', 'Numerical', 'Verbal', 'Abstract'], required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true }
});

export default mongoose.model('Question', questionSchema);
