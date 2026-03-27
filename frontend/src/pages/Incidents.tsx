import { useEffect, useState } from 'react';
import { dashboardApi } from '../api/dashboard';

function formatDate(d: string | Date): string {
  const date = new Date(d);
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatDuration(seconds: number): string {
  if (!seconds) return '—';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

export default function Incidents() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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

  const ongoing = incidents.filter((i) => !i.is_resolved).length;
  const resolved = incidents.filter((i) => i.is_resolved).length;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Incidents</h1>
        <p className="text-slate-400 text-sm mt-1">Active and historical outage events across all monitors.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-[#1a1c23] border border-white/[0.06] rounded-2xl p-5">
          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-2">Total</div>
          <div className="text-3xl font-extrabold text-white">{incidents.length}</div>
          <div className="text-xs text-slate-500 mt-1">All time incidents</div>
        </div>
        <div className="bg-[#1a1c23] border border-red-500/10 rounded-2xl p-5">
          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-2">Ongoing</div>
          <div className="text-3xl font-extrabold text-red-400">{ongoing}</div>
          <div className="text-xs text-slate-500 mt-1">Active right now</div>
        </div>
        <div className="bg-[#1a1c23] border border-emerald-500/10 rounded-2xl p-5">
          <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-2">Resolved</div>
          <div className="text-3xl font-extrabold text-emerald-400">{resolved}</div>
          <div className="text-xs text-slate-500 mt-1">Successfully resolved</div>
        </div>
      </div>

      {/* Incidents Table */}
      <div className="bg-[#1a1c23] border border-white/[0.06] rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-white/[0.06] bg-white/[0.02] flex items-center justify-between">
          <span className="text-sm font-bold text-white">Incident History</span>
          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">{incidents.length} events</span>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500">
            <span className="material-symbols-outlined text-4xl animate-spin mb-4">progress_activity</span>
            <p>Loading incidents...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 text-red-400">{error}</div>
        ) : incidents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500">
            <span className="material-symbols-outlined text-5xl mb-4 text-emerald-500/20">verified</span>
            <p className="text-base font-semibold text-white mb-1">All systems operational</p>
            <p className="text-sm">No incidents have been recorded.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#13151b]/50 border-b border-white/[0.06]">
                  <th className="px-6 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest w-28">Status</th>
                  <th className="px-6 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Monitor</th>
                  <th className="px-6 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest hidden md:table-cell">Started</th>
                  <th className="px-6 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest hidden lg:table-cell">Resolved</th>
                  <th className="px-6 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest text-right">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {incidents.map((inc: any) => (
                  <tr key={inc.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 align-middle">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${inc.is_resolved ? 'bg-emerald-500' : 'bg-red-500 animate-pulse shadow-[0_0_6px_rgba(239,68,68,0.6)]'}`}></span>
                        <span className={`text-[11px] font-bold uppercase tracking-widest ${inc.is_resolved ? 'text-emerald-400' : 'text-red-400'}`}>
                          {inc.is_resolved ? 'Resolved' : 'Ongoing'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-middle">
                      <span className="text-sm font-bold text-white uppercase">{inc.monitor_name}</span>
                    </td>
                    <td className="px-6 py-4 align-middle hidden md:table-cell">
                      <span className="text-xs text-slate-400">{formatDate(inc.started_at)}</span>
                    </td>
                    <td className="px-6 py-4 align-middle hidden lg:table-cell">
                      <span className="text-xs text-slate-400">{inc.resolved_at ? formatDate(inc.resolved_at) : '—'}</span>
                    </td>
                    <td className="px-6 py-4 align-middle text-right">
                      <span className="text-sm font-bold text-white">{formatDuration(inc.duration_seconds)}</span>
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
