import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMonitorStore } from '../store/useMonitorStore';
import { useAuthStore } from '../store/useAuthStore';
import { dashboardApi } from '../api/dashboard';

export default function StatusPages() {
  const navigate = useNavigate();
  const { monitors, fetchMonitors } = useMonitorStore();
  const user = useAuthStore((state) => state.user);
  const [stats, setStats] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    if (!user?.id) return;
    const url = `${window.location.origin}/status/${user.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const load = async () => {
      await fetchMonitors();
      setIsLoading(false);
    };
    load();
  }, [fetchMonitors]);

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
    <div className="p-6 lg:p-8 w-full">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Status Pages</h1>
          <p className="text-slate-500 text-[13px] mt-0.5">Real-time operational status and 30-day uptime for all endpoints</p>
        </div>
        <button
          onClick={handleCopyLink}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-[13px] font-semibold transition-all shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">
            {copied ? 'check' : 'link'}
          </span>
          {copied ? 'Copied!' : 'Copy Public Link'}
        </button>
      </div>

      {/* Overall Status Banner */}
      <div className={`mb-6 rounded-lg border p-4 flex items-center gap-3 ${
        overallStatus === 'operational'
          ? 'bg-emerald-500/[0.04] border-emerald-500/15'
          : overallStatus === 'degraded'
          ? 'bg-red-500/[0.04] border-red-500/15'
          : 'bg-[#16181e] border-white/[0.04]'
      }`}>
        <div className={`w-9 h-9 rounded-md flex items-center justify-center ${
          overallStatus === 'operational' ? 'bg-emerald-500/10' : overallStatus === 'degraded' ? 'bg-red-500/10' : 'bg-white/[0.04]'
        }`}>
          <span className={`material-symbols-outlined text-xl ${
            overallStatus === 'operational' ? 'text-emerald-400' : overallStatus === 'degraded' ? 'text-red-400' : 'text-slate-500'
          }`}>
            {overallStatus === 'operational' ? 'check_circle' : overallStatus === 'degraded' ? 'error' : 'help'}
          </span>
        </div>
        <div className="flex-1">
          <p className="text-[14px] font-semibold text-white">
            {overallStatus === 'operational' ? 'All Systems Operational' : overallStatus === 'degraded' ? 'Partial System Degradation' : 'No monitors configured'}
          </p>
          <p className="text-[12px] text-slate-500 mt-0.5">
            {monitors.length} monitors — {totalUp} up, {totalDown} down
          </p>
        </div>
        {overallStatus !== 'unknown' && (
          <span className={`text-[11px] font-medium px-2.5 py-1 rounded-md ${
            overallStatus === 'operational'
              ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20'
              : 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20'
          }`}>
            {overallStatus === 'operational' ? 'Healthy' : 'Degraded'}
          </span>
        )}
      </div>

      {/* Monitor Status List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-5 h-5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-3" />
          <p className="text-[13px] text-slate-500">Loading status data...</p>
        </div>
      ) : monitors.length === 0 ? (
        <div className="bg-[#16181e] border border-dashed border-white/[0.06] rounded-lg flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 rounded-lg bg-white/[0.03] flex items-center justify-center mb-3">
            <span className="material-symbols-outlined text-2xl text-slate-700">sensors</span>
          </div>
          <p className="text-[13px] text-slate-400 font-medium">No monitors yet</p>
          <p className="text-[12px] text-slate-600 mt-0.5">Add monitors to see status here.</p>
        </div>
      ) : (
        <div className="bg-[#16181e] border border-white/[0.04] rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-white/[0.04] bg-white/[0.01] flex items-center justify-between">
            <span className="text-[13px] font-semibold text-white">All Endpoints</span>
            <span className="text-[11px] text-slate-600 tabular-nums">{monitors.length} services</span>
          </div>
          <div className="divide-y divide-white/[0.03]">
            {monitors.map((m: any) => {
              const monStats = stats[m.id];
              let avgUptime = '--';
              if (monStats && Array.isArray(monStats) && monStats.length > 0) {
                const avg = monStats.reduce((acc: number, d: any) => acc + parseFloat(d.uptime_percentage || 0), 0) / monStats.length;
                avgUptime = avg.toFixed(2);
              }

              const isUp = m.is_active && m.last_status === 'up';
              const isDown = m.is_active && m.last_status === 'down';
              const isPaused = !m.is_active;

              return (
                <div
                  key={m.id}
                  onClick={() => navigate(`/dashboard/${m.id}`)}
                  className="px-5 py-4 flex items-center gap-4 hover:bg-white/[0.015] transition-colors duration-100 cursor-pointer group"
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    isPaused ? 'bg-amber-500' :
                    isUp ? 'bg-emerald-500' :
                    isDown ? 'bg-red-500 animate-pulse shadow-[0_0_6px_rgba(239,68,68,0.5)]' :
                    'bg-slate-500'
                  }`} />

                  <div className="flex-1 min-w-0">
                    <span className="text-[13px] font-semibold text-white group-hover:text-emerald-400 transition-colors duration-150">{m.name}</span>
                    <p className="text-[11px] text-slate-600 font-mono truncate mt-0.5">{m.url}</p>
                  </div>

                  {/* Status Badge */}
                  <span className={`text-[11px] font-semibold px-2 py-1 rounded-md ${
                    isPaused ? 'text-amber-400 bg-amber-500/10 ring-1 ring-amber-500/20' :
                    isUp ? 'text-emerald-400 bg-emerald-500/10 ring-1 ring-emerald-500/20' :
                    isDown ? 'text-red-400 bg-red-500/10 ring-1 ring-red-500/20' :
                    'text-slate-400 bg-white/[0.04] ring-1 ring-white/10'
                  }`}>
                    {isPaused ? 'Paused' : isUp ? 'Operational' : isDown ? 'Degraded' : 'Pending'}
                  </span>

                  {/* 30d Uptime */}
                  <div className="text-right hidden sm:block w-20 shrink-0">
                    <span className={`text-[13px] font-bold tabular-nums ${
                      avgUptime === '--' ? 'text-slate-600' :
                      parseFloat(avgUptime) >= 99 ? 'text-emerald-400' :
                      parseFloat(avgUptime) >= 95 ? 'text-amber-400' : 'text-red-400'
                    }`}>{avgUptime}{avgUptime !== '--' ? '%' : ''}</span>
                    <p className="text-[10px] text-slate-600 mt-0.5">30d uptime</p>
                  </div>

                  <span className="material-symbols-outlined text-slate-700 text-[16px] group-hover:text-slate-400 transition-colors">chevron_right</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
