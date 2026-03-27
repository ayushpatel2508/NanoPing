import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMonitorStore } from '../store/useMonitorStore';
import { dashboardApi } from '../api/dashboard';
import { 
    ResponseTimeChart, 
    UptimeBarChart, 
    StatusPieChart, 
    HeartbeatTimeline 
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
      <div className="p-8 flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-slate-400 font-medium">Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Uptime History</h1>
          <p className="text-slate-400 mt-1">Detailed performance metrics for all your monitors</p>
        </div>
        <div className="flex bg-[#0f1115] rounded-xl p-1 border border-[#1e2028]">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                days === d ? 'bg-[#1a1c23] text-emerald-400 shadow-lg border border-emerald-500/10' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {d === 7 ? '7 Days' : d === 30 ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-8">
        {monitors.map((monitor) => {
          const stats = getMonitorStats(monitor.id);
          const lastCheck = monitor.last_check_status || 'unknown';
          
          return (
            <div key={monitor.id} className="bg-[#0f1115] rounded-2xl border border-[#1e2028] overflow-hidden hover:border-[#2a2d36] transition-all shadow-xl group">
              {/* Monitor Info Bar */}
              <div className="px-6 py-4 bg-[#13151b] border-b border-[#1e2028] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${lastCheck === 'up' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]'}`} />
                  <div>
                    <h3 className="font-bold text-white group-hover:text-emerald-400 transition-colors uppercase tracking-wider text-sm">{monitor.name}</h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{monitor.url}</p>
                  </div>
                </div>
                <Link 
                  to={`/dashboard/monitors/${monitor.id}`}
                  className="px-4 py-1.5 bg-[#1a1c23] hover:bg-[#2a2d36] text-slate-300 hover:text-white text-xs font-bold rounded-lg border border-[#1e2028] transition-all"
                >
                  VIEW DETAILS
                </Link>
              </div>

              {/* Graphs Grid */}
              <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Response Time Area */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-400 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">speed</span>
                      RESPONSE TIME
                    </h4>
                  </div>
                  <div className="bg-[#13151b] rounded-xl p-4 border border-[#1a1c23]">
                    <ResponseTimeChart data={stats} />
                  </div>
                </div>

                {/* Uptime Bar Chart */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-400 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                      DAILY UPTIME
                    </h4>
                  </div>
                  <div className="bg-[#13151b] rounded-xl p-4 border border-[#1a1c23]">
                    <UptimeBarChart data={stats} />
                  </div>
                </div>

                {/* Status Distribution Pie */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-400 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">donut_large</span>
                      CHECK DISTRIBUTION
                    </h4>
                  </div>
                  <div className="bg-[#13151b] rounded-xl p-4 border border-[#1a1c23]">
                    {/* Note: In a real app, we'd fetch recent checks for each monitor. 
                        For this view, we can derive a simpler distribution from the historical stats if needed,
                        or just pass empty if we don't have raw checks. In History.tsx, we'll fetch them or use dummy.
                    */}
                    <StatusPieChart checks={[]} />
                    <p className="text-[10px] text-slate-600 mt-2 text-center">Visit monitor details for full distribution breakdown.</p>
                  </div>
                </div>

                {/* Heartbeat / Timeline placeholder */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-400 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">monitoring</span>
                      RECENT HEARTBEAT
                    </h4>
                  </div>
                  <div className="bg-[#13151b] rounded-xl p-4 border border-[#1a1c23] h-[192px] flex flex-col justify-center">
                     <HeartbeatTimeline checks={[]} />
                     <p className="text-[10px] text-slate-600 mt-4 text-center italic">Live heartbeat timeline is available in the individual monitor view.</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {monitors.length === 0 && (
          <div className="bg-[#0f1115] rounded-3xl border border-dashed border-[#1e2028] p-20 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-4xl text-emerald-500">add_moderator</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">No monitors yet</h2>
            <p className="text-slate-400 max-w-sm mb-8">Start tracking your websites and APIs to see their historical performance here.</p>
            <Link to="/dashboard" className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20">
              Create First Monitor
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
