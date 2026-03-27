import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMonitorStore } from '../store/useMonitorStore';
import { useSocket } from '../hooks/useSocket';
import { dashboardApi } from '../api/dashboard';

export default function Dashboard() {
  const navigate = useNavigate();
  
  const { 
    monitors, 
    isLoading, 
    fetchMonitors, 
    createMonitor,
    updateMonitorStatus,
  } = useMonitorStore();
  const [showModal, setShowModal] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({ name: '', url: '', check_interval: 5, alert_threshold: 3 });
  const [checksCache, setChecksCache] = useState<Record<string, any[]>>({});
  const [statusFilter, setStatusFilter] = useState<'all' | 'up' | 'down' | 'paused'>('all');

  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on('check:new', (data: any) => {
      // Update checksCache for the mini status bars if we need them later
      setChecksCache((prev) => {
        const existing = prev[data.monitor_id] || [];
        return {
          ...prev,
          [data.monitor_id]: [data, ...existing].slice(0, 20)
        };
      });
    });

    socket.on('monitor:status_update', (data: any) => {
      updateMonitorStatus(data);
    });

    return () => {
      socket.off('check:new');
      socket.off('monitor:status_update');
    };
  }, [socket, updateMonitorStatus]);

  useEffect(() => {
    fetchMonitors();
  }, [fetchMonitors]);

  // Fetch last 20 checks for each monitor (for mini status bar)
  useEffect(() => {
    if (monitors.length === 0) return;
    const fetchChecks = async () => {
      const cache: Record<string, any[]> = {};
      await Promise.all(
        monitors.map(async (m: any) => {
          try {
            const res = await dashboardApi.getRecentChecks(m.id);
            if (res.success) cache[m.id] = res.data.slice(0, 20);
          } catch {}
        })
      );
      setChecksCache(cache);
    };
    fetchChecks();
  }, [monitors]);

  const handleCreate = async () => {
    setFormError('');
    if (!form.name || !form.url) {
      setFormError('Name and URL are required.');
      return;
    }

    // Auto-prepend https:// if missing
    let finalUrl = form.url.trim();
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = `https://${finalUrl}`;
    }

    const success = await createMonitor({ ...form, url: finalUrl });
    if (success) {
      setShowModal(false);
      setForm({ name: '', url: '', check_interval: 5, alert_threshold: 3 });
    } else {
      // The store sets the error in state, but we can catch it here via the store or just show a fallback
      setFormError(useMonitorStore.getState().error || 'Failed to create monitor. Check your URL.');
    }
  };

  const getStatusColor = (m: any) => {
    if (!m.is_active) return 'bg-yellow-500';
    if (m.last_status === 'up') return 'bg-emerald-500';
    if (m.last_status === 'down') return 'bg-red-500';
    return 'bg-slate-500';
  };

  const getStatusLabel = (m: any) => {
    if (!m.is_active) return 'Paused';
    if (m.last_status === 'up') return 'Up';
    if (m.last_status === 'down') return 'Down';
    return 'Pending';
  };


  const filteredMonitors = monitors.filter((m: any) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'up') return m.is_active && m.last_status === 'up';
    if (statusFilter === 'down') return m.is_active && m.last_status === 'down';
    if (statusFilter === 'paused') return !m.is_active;
    return true;
  });

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Monitoring</h1>
          <p className="text-slate-400 text-sm mt-1">Global overview of all your monitored endpoints.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-2.5 px-6 rounded-xl text-sm transition-all hover:shadow-[0_0_25px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">add</span> Add Monitor
        </button>
      </div>

      <div className="bg-[#1a1c23] border border-white/[0.06] rounded-2xl overflow-hidden shadow-sm">
        {/* Filter Tabs & Header */}
        <div className="px-6 py-4 border-b border-white/[0.06] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            {(['all', 'up', 'down', 'paused'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  statusFilter === f
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white border border-transparent hover:border-slate-800'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <span className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">{filteredMonitors.length} monitor{filteredMonitors.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Monitor Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#13151b]/50 border-b border-white/[0.06]">
                <th className="px-6 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest w-40">Status</th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Monitor</th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest hidden md:table-cell">Check Interval</th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest hidden lg:table-cell">Uptime</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {isLoading && monitors.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-20 text-slate-500">
                    <span className="material-symbols-outlined text-4xl animate-spin">progress_activity</span>
                    <p className="mt-3">Loading monitors...</p>
                  </td>
                </tr>
              ) : filteredMonitors.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-20 text-slate-500">
                    <span className="material-symbols-outlined text-4xl mb-3 block opacity-50">radar</span>
                    <p>No monitors match this filter.</p>
                  </td>
                </tr>
              ) : (
                filteredMonitors.map((m: any) => {
                  const checks = checksCache[m.id] || [];
                  const uptime = checks.length > 0 ? ((checks.filter(c => c.status === 'up').length / checks.length) * 100).toFixed(2) : '—';
                  
                  return (
                    <tr 
                      key={m.id} 
                      onClick={() => navigate(`/dashboard/${m.id}`)}
                      className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-5 align-middle">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${getStatusColor(m)}`}></span>
                          <span className={`text-[11px] font-bold uppercase tracking-widest ${
                            !m.is_active ? 'text-yellow-500' :
                            m.last_status === 'up' ? 'text-emerald-500' :
                            m.last_status === 'down' ? 'text-red-500' : 'text-slate-500'
                          }`}>
                            {getStatusLabel(m)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 align-middle">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors uppercase">{m.name}</span>
                          <span className="text-xs text-slate-500 font-mono mt-0.5 truncate max-w-[200px] sm:max-w-sm">{m.url}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 align-middle hidden md:table-cell">
                        <span className="text-xs font-medium text-slate-400">{m.check_interval} mins</span>
                      </td>
                      <td className="px-6 py-5 align-middle hidden lg:table-cell">
                        <span className="text-sm font-black text-emerald-400">{uptime}%</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Monitor Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-md px-4" onClick={() => setShowModal(false)}>
          <div className="bg-[#1a1c23] border border-white/[0.1] rounded-3xl p-8 w-full max-w-md shadow-2xl relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
             <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 to-blue-500 opacity-80" />
            <h2 className="text-2xl font-extrabold text-white mb-8 tracking-tight">Add Monitor</h2>

            {formError && (
              <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center font-bold">
                {formError}
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-extrabold tracking-widest block mb-1.5 ml-1">Friendly Name</label>
                <input type="text" placeholder="e.g. Production API" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-[#13151b] border border-white/[0.06] rounded-2xl px-5 py-3.5 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-slate-600"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-extrabold tracking-widest block mb-1.5 ml-1">Target URL</label>
                <input type="url" placeholder="https://api.myapp.com/health" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })}
                  className="w-full bg-[#13151b] border border-white/[0.06] rounded-2xl px-5 py-3.5 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-slate-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-extrabold tracking-widest block mb-1.5 ml-1">Frequency (min)</label>
                  <input type="number" min={1} max={60} value={form.check_interval} onChange={(e) => setForm({ ...form, check_interval: parseInt(e.target.value) || 5 })}
                    className="w-full bg-[#13151b] border border-white/[0.06] rounded-2xl px-5 py-3.5 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-extrabold tracking-widest block mb-1.5 ml-1">Threshold</label>
                  <input type="number" min={1} max={10} value={form.alert_threshold} onChange={(e) => setForm({ ...form, alert_threshold: parseInt(e.target.value) || 3 })}
                    className="w-full bg-[#13151b] border border-white/[0.06] rounded-2xl px-5 py-3.5 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-10">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/5 py-3.5 rounded-2xl text-sm font-bold transition-all">Cancel</button>
              <button onClick={handleCreate} className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-3.5 rounded-2xl text-sm transition-all shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_4px_25px_rgba(16,185,129,0.4)]">
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
