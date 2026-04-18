import { useEffect, useState } from 'react';
import { dashboardApi } from '../api/dashboard';
import { useNavigate } from 'react-router-dom';

function formatDate(d: string | Date): string {
  const date = new Date(d);
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatDuration(seconds: number): string {
  if (!seconds) return '-';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

export default function Incidents() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'ongoing' | 'resolved'>('all');

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const res = await dashboardApi.getGlobalIncidents(50);
        setIncidents(res?.data || []);
      } catch (err) {
        setError('Failed to load incidents.');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const ongoing = incidents.filter((i) => !i.is_resolved);
  const resolved = incidents.filter((i) => i.is_resolved);

  const filtered = filter === 'all' ? incidents : filter === 'ongoing' ? ongoing : resolved;

  return (
    <div className="p-6 lg:p-8 w-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">Incidents</h1>
        <p className="text-slate-500 text-[13px] mt-0.5">Active and historical outage events across all monitors</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-[#16181e] border border-white/[0.04] rounded-lg p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-white/[0.04] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[16px] text-slate-400">warning</span>
          </div>
          <div>
            <div className="text-lg font-bold text-white leading-none tabular-nums">{incidents.length}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Total Events</div>
          </div>
        </div>
        <div className="bg-[#16181e] border border-white/[0.04] rounded-lg p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-red-500/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[16px] text-red-400">local_fire_department</span>
          </div>
          <div>
            <div className="text-lg font-bold text-red-400 leading-none tabular-nums">{ongoing.length}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Ongoing</div>
          </div>
        </div>
        <div className="bg-[#16181e] border border-white/[0.04] rounded-lg p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-emerald-500/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[16px] text-emerald-400">check_circle</span>
          </div>
          <div>
            <div className="text-lg font-bold text-emerald-400 leading-none tabular-nums">{resolved.length}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Resolved</div>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-[#16181e] border border-white/[0.04] rounded-lg overflow-hidden">
        {/* Filter Bar */}
        <div className="px-5 py-3 border-b border-white/[0.04] bg-white/[0.01] flex items-center justify-between">
          <div className="flex items-center gap-1">
            {(['all', 'ongoing', 'resolved'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md text-[12px] font-medium capitalize transition-all duration-150 ${
                  filter === f
                    ? f === 'ongoing' ? 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20'
                      : f === 'resolved' ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20'
                        : 'bg-white/[0.06] text-white ring-1 ring-white/10'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <span className="text-[11px] text-slate-600 tabular-nums">{filtered.length} events</span>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <div className="w-5 h-5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-3" />
            <p className="text-[13px]">Loading incidents...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16 text-red-400 text-[13px] font-medium">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 rounded-lg bg-emerald-500/5 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-2xl text-emerald-500/40">verified</span>
            </div>
            <p className="text-[13px] text-slate-400 font-medium">
              {filter === 'all' ? 'All systems operational' : `No ${filter} incidents`}
            </p>
            <p className="text-[12px] text-slate-600 mt-0.5">No incidents have been recorded.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  <th className="px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider w-28">Status</th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Monitor</th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Started</th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Resolved</th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right w-28">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {filtered.map((inc: any) => (
                  <tr key={inc.id} 
                    onClick={() => navigate(`/dashboard/${inc.monitor_id}`)}
                    className="hover:bg-white/[0.015] transition-colors duration-100 cursor-pointer group"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${inc.is_resolved ? 'bg-emerald-500' : 'bg-red-500 animate-pulse shadow-[0_0_6px_rgba(239,68,68,0.5)]'}`} />
                        <span className={`text-[11px] font-semibold uppercase ${inc.is_resolved ? 'text-emerald-400' : 'text-red-400'}`}>
                          {inc.is_resolved ? 'Resolved' : 'Active'}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[13px] font-semibold text-white group-hover:text-emerald-400 transition-colors duration-150">{inc.monitor_name}</span>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="text-[12px] text-slate-400 tabular-nums font-mono">{formatDate(inc.started_at)}</span>
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <span className="text-[12px] text-slate-400 tabular-nums font-mono">{inc.resolved_at ? formatDate(inc.resolved_at) : '-'}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-[13px] font-semibold text-white tabular-nums">{formatDuration(inc.duration_seconds)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
