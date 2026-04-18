import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMonitorStore } from '../store/useMonitorStore';
import { dashboardApi } from '../api/dashboard';
import { 
    ResponseTimeChart, 
    UptimeBarChart, 
} from '../components/Charts';

export default function History() {
  const { monitors, fetchMonitors } = useMonitorStore();
  const [allStats, setAllStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await fetchMonitors();
        const statsRes = await dashboardApi.getAllMonitorStats(days);
        if (statsRes.success) {
          setAllStats(statsRes.data);
        }
      } catch (err) {
        console.error('Failed to load history data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [fetchMonitors, days]);

  const getMonitorStats = (monitorId: string) => {
    return allStats.filter(s => s.monitor_id === monitorId);
  };

  if (loading && monitors.length === 0) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-slate-500 text-[13px]">Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Uptime History</h1>
          <p className="text-slate-500 text-[13px] mt-0.5">Performance metrics and trends for all monitors</p>
        </div>
        <div className="flex bg-[#16181e] rounded-md p-0.5 border border-white/[0.04]">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-[5px] text-[12px] font-medium transition-all duration-150 ${
                days === d ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {monitors.map((monitor: any) => {
          const stats = getMonitorStats(monitor.id);
          const avgUptime = stats.length > 0
            ? (stats.reduce((a: number, s: any) => a + parseFloat(s.uptime_percentage || 0), 0) / stats.length).toFixed(2)
            : '--';
          const avgRT = stats.length > 0
            ? Math.round(stats.reduce((a: number, s: any) => a + parseFloat(s.avg_response_time || 0), 0) / stats.length)
            : 0;
          const totalChecks = stats.reduce((a: number, s: any) => a + (s.total_checks || 0), 0);

          const isUp = monitor.is_active && monitor.last_status === 'up';
          
          return (
            <div key={monitor.id} className="bg-[#16181e] border border-white/[0.04] rounded-lg overflow-hidden hover:border-white/[0.06] transition-all duration-200 group">
              {/* Monitor Header */}
              <div className="px-5 py-4 border-b border-white/[0.04] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${isUp ? 'bg-emerald-500' : monitor.is_active ? 'bg-red-500 animate-pulse' : 'bg-amber-500'}`} />
                  <div>
                    <h3 className="text-[14px] font-semibold text-white group-hover:text-emerald-400 transition-colors duration-150">{monitor.name}</h3>
                    <p className="text-[11px] text-slate-600 font-mono mt-0.5">{monitor.url}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {/* Quick Stats */}
                  <div className="hidden sm:flex items-center gap-4 mr-2">
                    <div className="text-right">
                      <div className={`text-[14px] font-bold tabular-nums ${
                        avgUptime === '--' ? 'text-slate-600' :
                        parseFloat(avgUptime) >= 99 ? 'text-emerald-400' :
                        parseFloat(avgUptime) >= 95 ? 'text-amber-400' : 'text-red-400'
                      }`}>{avgUptime}{avgUptime !== '--' ? '%' : ''}</div>
                      <div className="text-[10px] text-slate-600">uptime</div>
                    </div>
                    <div className="w-px h-6 bg-white/[0.06]" />
                    <div className="text-right">
                      <div className="text-[14px] font-bold text-sky-400 tabular-nums">{avgRT}<span className="text-[10px] text-slate-600 ml-0.5">ms</span></div>
                      <div className="text-[10px] text-slate-600">avg</div>
                    </div>
                    <div className="w-px h-6 bg-white/[0.06]" />
                    <div className="text-right">
                      <div className="text-[14px] font-bold text-white tabular-nums">{totalChecks.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-600">checks</div>
                    </div>
                  </div>
                  <Link 
                    to={`/dashboard/${monitor.id}`}
                    className="px-3 py-1.5 text-[11px] font-medium text-slate-500 hover:text-emerald-400 bg-white/[0.03] hover:bg-emerald-500/10 border border-white/[0.04] hover:border-emerald-500/20 rounded-md transition-all duration-150"
                  >
                    Details
                  </Link>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-white/[0.04]">
                <div className="bg-[#16181e] p-5">
                  <div className="text-[11px] text-slate-500 font-medium mb-3 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">show_chart</span>
                    Response Time
                  </div>
                  <ResponseTimeChart data={stats} />
                </div>
                <div className="bg-[#16181e] p-5">
                  <div className="text-[11px] text-slate-500 font-medium mb-3 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">bar_chart</span>
                    Daily Uptime
                  </div>
                  <UptimeBarChart data={stats} />
                </div>
              </div>
            </div>
          );
        })}

        {monitors.length === 0 && (
          <div className="bg-[#16181e] border border-dashed border-white/[0.06] rounded-lg p-16 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-lg bg-white/[0.03] flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-2xl text-slate-700">monitoring</span>
            </div>
            <h2 className="text-lg font-bold text-white mb-1">No monitors yet</h2>
            <p className="text-[13px] text-slate-500 max-w-sm mb-6">Start tracking your websites and APIs to see performance history.</p>
            <Link to="/dashboard" className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-[#0a0a0a] font-semibold rounded-md text-[13px] transition-all">
              Create First Monitor
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
