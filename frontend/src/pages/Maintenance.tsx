import React from 'react';

export default function Maintenance() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-extrabold text-white mb-2">Maintenance Windows</h1>
      <p className="text-slate-400 mb-8">Schedule and manage downtime periods to suppress false offline alerts.</p>
      <div className="bg-[#1a1c23] border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center text-slate-500 h-64">
        <span className="material-symbols-outlined text-4xl mb-4 text-emerald-500/50">calendar_month</span>
        No maintenance windows scheduled.
      </div>
    </div>
  );
}
