import { useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function CourseUploadModal({ onUploaded }) {
  const [form, setForm] = useState({ courseCode: '', courseTitle: '', userEmail: '', educationLevel: 'tertiary' });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage('Please choose a PDF file.');
      return;
    }

    const fd = new FormData();
    fd.append('pdf', file);
    fd.append('courseCode', form.courseCode);
    fd.append('courseTitle', form.courseTitle);
    fd.append('userEmail', form.userEmail);
    fd.append('educationLevel', form.educationLevel);

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/quiz/upload-pdf`, { method: 'POST', body: fd });
      const data = await res.json();
      setMessage(data.ok ? 'Course quiz generated successfully.' : data.message || 'Upload failed');
      if (data.ok && onUploaded) onUploaded(data);
    } catch (error) {
      setMessage(error.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-slate-700 bg-slate-900/70 p-4 text-sm text-slate-200">
      <input required value={form.courseCode} onChange={(e) => setForm({ ...form, courseCode: e.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2" placeholder="Course Code" />
      <input required value={form.courseTitle} onChange={(e) => setForm({ ...form, courseTitle: e.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2" placeholder="Course Title" />
      <input required type="email" value={form.userEmail} onChange={(e) => setForm({ ...form, userEmail: e.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2" placeholder="Your Email" />
      <select value={form.educationLevel} onChange={(e) => setForm({ ...form, educationLevel: e.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2">
        <option value="nursery">Nursery</option>
        <option value="primary">Primary</option>
        <option value="secondary">Secondary</option>
        <option value="tertiary">Tertiary</option>
        <option value="general">General</option>
      </select>
      <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full rounded-xl border border-dashed border-slate-700 bg-slate-800 px-3 py-2" />
      <button type="submit" disabled={loading} className="w-full rounded-xl bg-cyan-600 px-3 py-2 font-semibold text-white disabled:opacity-70">{loading ? 'Generating...' : 'Upload & Generate Quiz'}</button>
      {message ? <p className="text-xs text-cyan-300">{message}</p> : null}
    </form>
  );
}
