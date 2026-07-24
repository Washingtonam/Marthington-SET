import { useEffect, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function CourseSearchBar({ onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      try {
        const res = await fetch(`${API_BASE_URL}/api/quiz/search?search=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
      } catch {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 text-sm text-slate-200">
      <input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2" placeholder="Search course code or title" />
      <div className="mt-3 space-y-2">
        {results.map((item) => (
          <button key={item._id || item.courseCode} onClick={() => onSelect?.(item)} className="flex w-full items-center justify-between rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-left">
            <span>{item.courseTitle || item.courseCode}</span>
            <span className="text-xs text-cyan-300">{item.courseCode}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
