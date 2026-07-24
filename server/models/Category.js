import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  educationLevel: { type: String, enum: ['general', 'nursery', 'primary', 'secondary', 'tertiary'], default: 'general' },
  description: { type: String, default: '' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Category', categorySchema);
