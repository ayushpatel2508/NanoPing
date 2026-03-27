import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMonitorStore } from '../store/useMonitorStore';
import { dashboardApi } from '../api/dashboard';

export default function StatusPages() {
  const navigate = useNavigate();
  const { monitors, fetchMonitors } = useMonitorStore();
  const [stats, setStats] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      await fetchMonitors();
      setIsLoading(false);
    };
    load();
  }, [fetchMonitors]);

  // Fetch per-monitor uptime stats when monitors load
  useEffect(() => {
    if (monitors.length === 0) return;
    const fetchStats = async () => {
      const results: Record<string, any> = {};
      await Promise.all(
        monitors.map(async (m: any) => {
          try {
            const res = await dashboardApi.getMonitorStats(m.id, 30);
            results[m.id] = res?.data || res;
          } catch {
            results[m.id] = null;
          }
        })
      );
      setStats(results);
    };
    fetchStats();
  }, [monitors]);

  const totalUp = monitors.filter((m: any) => m.is_active && m.last_status === 'up').length;
  const totalDown = monitors.filter((m: any) => m.is_active && m.last_status === 'down').length;
  const overallStatus = totalDown === 0 && monitors.length > 0 ? 'operational' : totalDown > 0 ? 'degraded' : 'unknown';

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Status Pages</h1>
        <p className="text-slate-400 text-sm mt-1">Real-time operational status and 30-day uptime for all endpoints.</p>
      </div>

      {/* Overall System Banner */}
      <div className={`mb-8 rounded-2xl border p-6 flex items-center gap-4 ${
        overallStatus === 'operational'
          ? 'bg-emerald-500/5 border-emerald-500/20'
          : overallStatus === 'degraded'
          ? 'bg-red-500/5 border-red-500/20'
          : 'bg-[#1a1c23] border-white/[0.06]'
      }`}>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          overallStatus === 'operational' ? 'bg-emerald-500/15' : 'bg-red-500/15'
        }`}>
          <span className={`material-symbols-outlined text-2xl ${
            overallStatus === 'operational' ? 'text-emerald-400' : overallStatus === 'degraded' ? 'text-red-400' : 'text-slate-400'
          }`}>
            {overallStatus === 'operational' ? 'verified' : overallStatus === 'degraded' ? 'warning' : 'help'}
          </span>
        </div>
        <div>
          <p className="text-lg font-extrabold text-white">
            {overallStatus === 'operational' ? 'All Systems Operational' : overallStatus === 'degraded' ? 'Partial System Degradation' : 'No monitors configured'}
          </p>
          <p className="text-sm text-slate-400 mt-0.5">
            {monitors.length} monitors · {totalUp} up · {totalDown} down
          </p>
        </div>
        {overallStatus !== 'unknown' && (
          <div className="ml-auto">
            <span className={`text-[11px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-lg border ${
              overallStatus === 'operational'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border-red-500/20'
            }`}>
              {overallStatus}
            </span>
          </div>
        )}
      </div>

      {/* Monitor Status Cards */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-500">
          <span className="material-symbols-outlined text-4xl animate-spin mb-4">progress_activity</span>
          <p>Loading status data...</p>
        </div>
      ) : monitors.length === 0 ? (
        <div className="bg-[#1a1c23] border border-dashed border-white/[0.06] rounded-2xl flex flex-col items-center justify-center py-24 text-slate-500">
          <span className="material-symbols-outlined text-5xl mb-4 opacity-30">sensors</span>
          <p className="text-base font-semibold text-white mb-1">No monitors yet</p>
          <p className="text-sm">Add monitors in the Monitoring section to see status here.</p>
        </div>
      ) : (
        <div className="bg-[#1a1c23] border border-white/[0.06] rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-white/[0.06] bg-white/[0.02] flex items-center justify-between">
            <span className="text-sm font-bold text-white">All Endpoints</span>
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">{monitors.length} services</span>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {monitors.map((m: any) => {
              const monStats = stats[m.id];
              let uptimePct = '—';
              if (monStats && Array.isArray(monStats)) {
                const total = monStats.reduce((acc: number, d: any) => acc + (d.total_checks || 0), 0);
                const up = monStats.reduce((acc: number, d: any) => acc + (d.up_checks || 0), 0);
                if (total > 0) uptimePct = ((up / total) * 100).toFixed(2);
              }

              const isUp = m.is_active && m.last_status === 'up';
              const isDown = m.is_active && m.last_status === 'down';
              const isPaused = !m.is_active;

              return (
                <div
                  key={m.id}
                  onClick={() => navigate(`/dashboard/${m.id}`)}
                  className="px-6 py-5 flex items-center gap-4 hover:bg-white/[0.02] transition-colors cursor-pointer group"
                >
                  {/* Status Dot */}
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    isPaused ? 'bg-yellow-500' :
                    isUp ? 'bg-emerald-500' :
                    isDown ? 'bg-red-500 animate-pulse shadow-[0_0_6px_rgba(239,68,68,0.6)]' :
                    'bg-slate-500'
                  }`}></span>

                  {/* Name & URL */}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors uppercase">{m.name}</span>
                    <p className="text-xs text-slate-500 font-mono truncate mt-0.5">{m.url}</p>
                  </div>

                  {/* Status Badge */}
                  <span className={`text-[11px] font-bold uppercase tracking-widest px-2 py-1 rounded-md border ${
                    isPaused ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' :
                    isUp ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                    isDown ? 'text-red-400 bg-red-500/10 border-red-500/20' :
                    'text-slate-400 bg-slate-500/10 border-white/10'
                  }`}>
                    {isPaused ? 'Paused' : isUp ? 'Operational' : isDown ? 'Degraded' : 'Pending'}
                  </span>

                  {/* 30-day Uptime */}
                  <div className="text-right hidden sm:block ml-6 w-24 shrink-0">
                    <span className="text-base font-black text-emerald-400">{uptimePct}{uptimePct !== '—' ? '%' : ''}</span>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-0.5">30d uptime</p>
                  </div>

                  <span className="material-symbols-outlined text-slate-600 group-hover:text-emerald-400 transition-colors text-lg ml-2">arrow_forward_ios</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
