import { useEffect, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function CourseDashboard() {
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState({ totalCourses: 0, totalQuestions: 0, publicCourses: 0, verifiedQuestions: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/quiz/dashboard`);
        const data = await res.json();
        if (data?.ok) {
          setCourses(data.courses || []);
          setStats(data.stats || stats);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  return (
    <section className="mx-auto w-full max-w-6xl rounded-[28px] border border-slate-800/80 bg-slate-900/80 p-6 shadow-[0_0_40px_rgba(99,102,241,0.18)] backdrop-blur-xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Course library</p>
          <h3 className="mt-1 text-2xl font-semibold text-white">Public course collections</h3>
        </div>
        <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-300">
          {loading ? 'Loading...' : `${stats.totalCourses} courses`}
        </div>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-4">
        {[
          ['Courses', stats.totalCourses],
          ['Questions', stats.totalQuestions],
          ['Public', stats.publicCourses],
          ['Verified', stats.verifiedQuestions]
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-slate-800 bg-slate-800/70 p-4">
            <div className="text-sm text-slate-400">{label}</div>
            <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {courses.length ? courses.map((course) => (
          <article key={course._id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-lg font-semibold text-white">{course.courseTitle || 'Untitled course'}</h4>
              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-xs uppercase text-cyan-300">{course.educationLevel || 'general'}</span>
            </div>
            <p className="mt-2 text-sm text-slate-400">{course.topic || 'Course material'}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-300">
              <span className="rounded-full bg-slate-800 px-3 py-1">{course.courseCode || 'COURSE'}</span>
              <span className="rounded-full bg-slate-800 px-3 py-1">{course.category || 'Course Quiz'}</span>
              <span className="rounded-full bg-slate-800 px-3 py-1">{course.isVerified ? 'Verified' : 'Pending review'}</span>
            </div>
          </article>
        )) : (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-800/50 p-6 text-sm text-slate-400 lg:col-span-2">
            No public course collections yet. Upload a PDF to seed the library.
          </div>
        )}
      </div>
    </section>
  );
}
