import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../api/dashboard';
import { useMonitorStore } from '../store/useMonitorStore';

const PAGE_SIZE = 20;

function formatDate(d: string | Date): string {
  const date = new Date(d);
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function Logs() {
  const navigate = useNavigate();
  const { monitors, fetchMonitors } = useMonitorStore();

  const [checks, setChecks] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [monitorFilter, setMonitorFilter] = useState<string>('all');

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const load = useCallback(async (p: number) => {
    try {
      setIsLoading(true);
      setError('');
      const res = await dashboardApi.getGlobalChecks(p, PAGE_SIZE);
      // res shape: { success, data: [...], total, page, limit }
      setChecks(res?.data || []);
      setTotal(res?.total || 0);
    } catch {
      setError('Failed to load ping history.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMonitors();
  }, [fetchMonitors]);

  useEffect(() => {
    load(page);
  }, [page, load]);

  const goTo = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
  };

  const filteredChecks = monitorFilter === 'all'
    ? checks
    : checks.filter((c: any) => c.monitor_name?.toLowerCase() === monitorFilter.toLowerCase());

  const upCount = filteredChecks.filter((c: any) => c.status === 'up').length;
  const avgLatency = (() => {
    const withTime = filteredChecks.filter((c: any) => c.response_time);
    if (withTime.length === 0) return 0;
    return Math.round(withTime.reduce((a: number, c: any) => a + c.response_time, 0) / withTime.length);
  })();

  // Build page range to display (max 5 buttons)
  const pageRange = (() => {
    const range: number[] = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, start + 4);
    for (let i = start; i <= end; i++) range.push(i);
    return range;
  })();

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Ping Logs</h1>
          <p className="text-slate-400 text-sm mt-1">
            Paginated ping history · showing page {page} of {totalPages} · {total} total records
          </p>
        </div>
        {/* Monitor Filter */}
        <select
          value={monitorFilter}
          onChange={(e) => { setMonitorFilter(e.target.value); setPage(1); }}
          className="bg-[#1a1c23] border border-white/[0.08] text-slate-300 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500/50 transition-all"
        >
          <option value="all">All Monitors</option>
          {monitors.map((m: any) => (
            <option key={m.id} value={m.name}>{m.name}</option>
          ))}
        </select>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-[#1a1c23] border border-white/[0.06] rounded-2xl p-5">
          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-2">Total Records</div>
          <div className="text-3xl font-extrabold text-white">{total}</div>
          <div className="text-xs text-slate-500 mt-1">All ping history</div>
        </div>
        <div className="bg-[#1a1c23] border border-emerald-500/10 rounded-2xl p-5">
          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-2">Up (this page)</div>
          <div className="text-3xl font-extrabold text-emerald-400">{upCount}</div>
          <div className="text-xs text-slate-500 mt-1">Successful responses</div>
        </div>
        <div className="bg-[#1a1c23] border border-sky-500/10 rounded-2xl p-5">
          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-2">Avg Latency</div>
          <div className="text-3xl font-extrabold text-sky-400">{avgLatency}ms</div>
          <div className="text-xs text-slate-500 mt-1">This page mean</div>
        </div>
      </div>

      {/* Quick Monitor Jump */}
      {monitors.length > 0 && (
        <div className="mb-8">
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-3">Jump to monitor detail</p>
          <div className="flex flex-wrap gap-2">
            {monitors.map((m: any) => (
              <button
                key={m.id}
                onClick={() => navigate(`/dashboard/${m.id}`)}
                className="px-3 py-1.5 bg-[#1a1c23] border border-white/[0.06] hover:border-emerald-500/30 hover:text-emerald-400 text-slate-400 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Table Card */}
      <div className="bg-[#1a1c23] border border-white/[0.06] rounded-2xl overflow-hidden shadow-sm">
        {/* Table Header */}
        <div className="px-6 py-4 border-b border-white/[0.06] bg-white/[0.02] flex items-center justify-between">
          <span className="text-sm font-bold text-white">
            Global Ping History
            <span className="ml-3 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest">
              {PAGE_SIZE} per page
            </span>
          </span>
          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
          </span>
        </div>

        {/* Table Body */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500">
            <span className="material-symbols-outlined text-4xl animate-spin mb-4">progress_activity</span>
            <p>Loading ping history...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 text-red-400 font-medium">{error}</div>
        ) : filteredChecks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500">
            <span className="material-symbols-outlined text-5xl mb-4 opacity-30">receipt_long</span>
            <p className="text-base font-semibold text-white mb-1">No logs yet</p>
            <p className="text-sm">Ping records will appear once monitoring begins.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#13151b]/50 border-b border-white/[0.06]">
                  <th className="px-6 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Time</th>
                  <th className="px-6 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Monitor</th>
                  <th className="px-6 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest w-28">Status</th>
                  <th className="px-6 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest hidden md:table-cell">HTTP</th>
                  <th className="px-6 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest text-right hidden lg:table-cell">Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredChecks.map((c: any) => (
                  <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-xs text-slate-400 font-mono">{formatDate(c.checked_at)}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => navigate(`/dashboard/${c.monitor_id}`)}
                        className="text-sm font-bold text-white hover:text-emerald-400 transition-colors uppercase"
                      >
                        {c.monitor_name}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[11px] font-bold uppercase tracking-widest px-2 py-1 rounded-md border ${
                        c.status === 'up'
                          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                          : 'text-red-400 bg-red-500/10 border-red-500/20'
                      }`}>{c.status}</span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-300 hidden md:table-cell">{c.status_code || '—'}</td>
                    <td className="px-6 py-4 text-sm font-bold text-sky-400 text-right hidden lg:table-cell">{c.response_time ? `${c.response_time}ms` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {!isLoading && !error && total > PAGE_SIZE && (
          <div className="px-6 py-4 border-t border-white/[0.06] flex items-center justify-between bg-white/[0.02]">
            <button
              onClick={() => goTo(page - 1)}
              disabled={page === 1}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border border-white/[0.08] text-slate-400 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <span className="material-symbols-outlined text-base">chevron_left</span>
              Prev
            </button>

            <div className="flex items-center gap-1">
              {pageRange[0] > 1 && (
                <>
                  <button onClick={() => goTo(1)} className="w-8 h-8 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all">1</button>
                  {pageRange[0] > 2 && <span className="text-slate-600 text-xs px-1">···</span>}
                </>
              )}
              {pageRange.map((p) => (
                <button
                  key={p}
                  onClick={() => goTo(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                    p === page
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {p}
                </button>
              ))}
              {pageRange[pageRange.length - 1] < totalPages && (
                <>
                  {pageRange[pageRange.length - 1] < totalPages - 1 && <span className="text-slate-600 text-xs px-1">···</span>}
                  <button onClick={() => goTo(totalPages)} className="w-8 h-8 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all">{totalPages}</button>
                </>
              )}
            </div>

            <button
              onClick={() => goTo(page + 1)}
              disabled={page === totalPages}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border border-white/[0.08] text-slate-400 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Next
              <span className="material-symbols-outlined text-base">chevron_right</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
