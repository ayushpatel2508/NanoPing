export default function Maintenance() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Maintenance Windows</h1>
          <p className="text-slate-400 text-sm mt-1">Schedule and manage downtime periods to suppress false offline alerts.</p>
        </div>
        <button className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-2.5 px-6 rounded-xl text-sm transition-all hover:shadow-[0_0_25px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">calendar_add_on</span> Create Window
        </button>
      </div>

      <div className="bg-[#1a1c23] border border-white/[0.06] rounded-3xl p-12 flex flex-col items-center justify-center text-center shadow-xl">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6 border border-emerald-500/20">
          <span className="material-symbols-outlined text-4xl text-emerald-500">calendar_clock</span>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No maintenance scheduled</h3>
        <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
          Plan ahead for server updates or migrations. Maintenance windows prevent downtime alerts from being sent while you're working.
        </p>
      </div>
    </div>
  );
}
