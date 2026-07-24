import React from 'react';

export default function UnifiedTeaserResult({ percentage = 0, onUnlock }) {
  return (
    <div className="rounded-[28px] border border-amber-400/20 bg-slate-950/75 p-6 shadow-[0_0_70px_rgba(250,204,21,0.16)]">
      <div className="mb-4 text-sm uppercase tracking-[0.3em] text-cyan-300">Result Preview</div>
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <h3 className="text-3xl font-semibold text-white">You scored {percentage}%</h3>
        <p className="mt-2 text-sm text-slate-400">Unlock the detailed answer breakdown, explanations, and official certificate.</p>
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 blur-sm">
          <p className="text-sm text-slate-300">Question-by-question breakdown</p>
          <p className="text-sm text-slate-300">Correct answer key</p>
          <p className="text-sm text-slate-300">Personalized performance report</p>
        </div>
        <button onClick={onUnlock} className="mt-4 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-amber-400 px-4 py-3 font-semibold text-white">Pay to Unlock Full Report</button>
      </div>
    </div>
  );
}
