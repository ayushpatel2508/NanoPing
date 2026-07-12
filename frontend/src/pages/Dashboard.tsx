import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMonitorStore } from '../store/useMonitorStore';
import { useSocket } from '../hooks/useSocket';
import { dashboardApi } from '../api/dashboard';
import { Skeleton } from 'boneyard-js/react';

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
  const isMock = new URLSearchParams(window.location.search).get('mock') === 'true';

  useEffect(() => {
    if (!socket) return;

    socket.on('check:new', (data: any) => {
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

  useEffect(() => {
    if (monitors.length === 0) return;
    const fetchChecks = async () => {
      const cache: Record<string, any[]> = {};
      await Promise.all(
        monitors.map(async (m: any) => {
          try {
            const res = await dashboardApi.getRecentChecks(m.id);
            if (res.success) cache[m.id] = res.data.slice(0, 20);
          } catch { }
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

    let finalUrl = form.url.trim();
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = `https://${finalUrl}`;
    }

    const success = await createMonitor({ ...form, url: finalUrl });
    if (success) {
      setShowModal(false);
      setForm({ name: '', url: '', check_interval: 5, alert_threshold: 3 });
    } else {
      setFormError(useMonitorStore.getState().error || 'Failed to create monitor. Check your URL.');
    }
  };

  const getStatusColor = (m: any) => {
    if (!m.is_active) return 'bg-amber-500';
    if (m.last_status === 'up') return 'bg-emerald-500';
    if (m.last_status === 'down') return 'bg-red-500';
    return 'bg-slate-500';
  };

  const getStatusLabel = (m: any) => {
    if (!m.is_active) return 'Paused';
    if (m.last_status === 'up') return 'Operational';
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

  const upCount = monitors.filter((m: any) => m.is_active && m.last_status === 'up').length;
  const downCount = monitors.filter((m: any) => m.is_active && m.last_status === 'down').length;
  const pausedCount = monitors.filter((m: any) => !m.is_active).length;

  return (
    <div className="p-6 lg:p-8 w-full">
      {/* Page Header */}
      <Skeleton name="dashboard-header" loading={isLoading && !isMock}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Monitors</h1>
            <p className="text-slate-500 text-[13px] mt-0.5">Real-time health overview of your endpoints</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-emerald-500 hover:bg-emerald-400 text-[#0a0a0a] font-semibold py-2 px-5 rounded-lg text-[13px] transition-all duration-200 hover:shadow-[0_0_20px_rgba(16,185,129,0.25)] flex items-center gap-1.5 active:scale-[0.97]"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Monitor
          </button>
        </div>
      </Skeleton>

      {/* Summary Strip */}
      {monitors.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-[#16181e] border border-white/[0.04] rounded-lg p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-white/[0.04] flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px] text-slate-400">dns</span>
            </div>
            <div>
              <div className="text-lg font-bold text-white leading-none">{monitors.length}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Total</div>
            </div>
          </div>
          <div className="bg-[#16181e] border border-white/[0.04] rounded-lg p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-emerald-500/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px] text-emerald-400">check_circle</span>
            </div>
            <div>
              <div className="text-lg font-bold text-emerald-400 leading-none">{upCount}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Operational</div>
            </div>
          </div>
          <div className="bg-[#16181e] border border-white/[0.04] rounded-lg p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-red-500/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px] text-red-400">error</span>
            </div>
            <div>
              <div className="text-lg font-bold text-red-400 leading-none">{downCount}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Down</div>
            </div>
          </div>
          <div className="bg-[#16181e] border border-white/[0.04] rounded-lg p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-amber-500/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px] text-amber-400">pause_circle</span>
            </div>
            <div>
              <div className="text-lg font-bold text-amber-400 leading-none">{pausedCount}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Paused</div>
            </div>
          </div>
        </div>
      )}

      {/* Main Table */}
      <Skeleton name="dashboard-table" loading={isLoading && !isMock}>
        <div className="bg-[#16181e] border border-white/[0.04] rounded-lg overflow-hidden">
          {/* Filter Bar */}
          <div className="px-5 py-3 border-b border-white/[0.04] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white/[0.01]">
            <div className="flex items-center gap-1">
              {(['all', 'up', 'down', 'paused'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1.5 rounded-md text-[12px] font-medium capitalize transition-all duration-150 ${statusFilter === f
                    ? f === 'up' ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20'
                      : f === 'down' ? 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20'
                        : f === 'paused' ? 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20'
                          : 'bg-white/[0.06] text-white ring-1 ring-white/10'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]'
                    }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <span className="text-[11px] text-slate-600 tabular-nums">{filteredMonitors.length} of {monitors.length} monitors</span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  <th className="px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider w-36">Status</th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Endpoint</th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell w-44">Last 20 Checks</th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell w-28 text-right">Uptime</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {(isLoading && monitors.length === 0 && !isMock) ? (
                  <tr>
                    <td colSpan={4} className="text-center py-20 text-slate-500">
                      <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-[13px]">Loading monitors...</p>
                    </td>
                  </tr>
                ) : filteredMonitors.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-20">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-white/[0.03] flex items-center justify-center">
                          <span className="material-symbols-outlined text-2xl text-slate-700">sensors_off</span>
                        </div>
                        <div>
                          <p className="text-[13px] text-slate-400 font-medium">{monitors.length === 0 ? 'No monitors yet' : 'No monitors match this filter'}</p>
                          <p className="text-[12px] text-slate-600 mt-0.5">{monitors.length === 0 ? 'Create your first monitor to start tracking uptime.' : 'Try a different filter.'}</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredMonitors.map((m: any) => {
                    const checks = checksCache[m.id] || [];
                    const uptime = checks.length > 0 ? ((checks.filter(c => c.status === 'up').length / checks.length) * 100).toFixed(1) : '--';

                    return (
                      <tr
                        key={m.id}
                        onClick={() => navigate(`/dashboard/${m.id}`)}
                        className="hover:bg-white/[0.02] transition-colors duration-100 cursor-pointer group"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${getStatusColor(m)} ${m.is_active && m.last_status === 'down' ? 'animate-pulse shadow-[0_0_6px_rgba(239,68,68,0.5)]' : ''}`} />
                            <span className={`text-[12px] font-semibold ${
                              !m.is_active ? 'text-amber-400' :
                              m.last_status === 'up' ? 'text-emerald-400' :
                              m.last_status === 'down' ? 'text-red-400' : 'text-slate-500'
                            }`}>
                              {getStatusLabel(m)}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div>
                            <span className="text-[13px] font-semibold text-white group-hover:text-emerald-400 transition-colors duration-150">{m.name}</span>
                            <span className="block text-[11px] text-slate-600 font-mono mt-0.5 truncate max-w-[220px] sm:max-w-md">{m.url}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 hidden md:table-cell">
                          {/* Mini heartbeat bar */}
                          <div className="flex items-center gap-[2px]">
                            {checks.length > 0 ? (
                              [...checks].reverse().slice(-20).map((c: any, i: number) => (
                                <div
                                  key={i}
                                  className={`w-[6px] h-4 rounded-[2px] transition-all duration-150 ${
                                    c.status === 'up' ? 'bg-emerald-500/70 hover:bg-emerald-400' : 'bg-red-500/70 hover:bg-red-400'
                                  }`}
                                  title={`${c.status} — ${c.response_time || 0}ms`}
                                />
                              ))
                            ) : (
                              Array.from({ length: 20 }).map((_, i) => (
                                <div key={i} className="w-[6px] h-4 rounded-[2px] bg-white/[0.04]" />
                              ))
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 hidden lg:table-cell text-right">
                          <span className={`text-[14px] font-bold tabular-nums ${
                            uptime === '--' ? 'text-slate-600' :
                            parseFloat(uptime) >= 99 ? 'text-emerald-400' :
                            parseFloat(uptime) >= 95 ? 'text-amber-400' : 'text-red-400'
                          }`}>{uptime}{uptime !== '--' ? '%' : ''}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Skeleton>

      {/* Add Monitor Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={() => setShowModal(false)}>
          <div
            className="bg-[#16181e] border border-white/[0.06] rounded-lg p-6 w-full max-w-md shadow-2xl shadow-black/50 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">New Monitor</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white transition-colors">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {formError && (
              <div className="mb-5 p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-[13px] font-medium">
                {formError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-[12px] text-slate-400 font-medium block mb-1.5">Site Name</label>
                <input type="text" placeholder="e.g. Production API" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-[#0f1115] border border-white/[0.06] rounded-md px-4 py-2.5 text-white text-[13px] focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition-all placeholder:text-slate-600"
                />
              </div>
              <div>
                <label className="text-[12px] text-slate-400 font-medium block mb-1.5">Target URL</label>
                <input type="url" placeholder="https://api.myapp.com/health" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })}
                  className="w-full bg-[#0f1115] border border-white/[0.06] rounded-md px-4 py-2.5 text-white text-[13px] font-mono focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition-all placeholder:text-slate-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px] text-slate-400 font-medium block mb-1.5">Frequency</label>
                  <div className="relative">
                    <input type="text" inputMode="numeric" pattern="[0-9]*" value={form.check_interval || ''} onChange={(e) => setForm({ ...form, check_interval: parseInt(e.target.value) || 0 })}
                      className={`w-full bg-[#0f1115] border rounded-md px-4 py-2.5 text-white text-[13px] focus:outline-none transition-all ${
                        (form.check_interval < 3 || form.check_interval > 60) ? 'border-red-500/40 focus:border-red-500' : 'border-white/[0.06] focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20'
                      }`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-600">min</span>
                  </div>
                  {(form.check_interval < 3 || form.check_interval > 60) && (
                    <span className="text-red-400 text-[11px] mt-1 block">3-60 minutes</span>
                  )}
                </div>
                <div>
                  <label className="text-[12px] text-slate-400 font-medium block mb-1.5">Alert Threshold</label>
                  <div className="relative">
                    <input type="text" inputMode="numeric" pattern="[0-9]*" value={form.alert_threshold || ''} onChange={(e) => setForm({ ...form, alert_threshold: parseInt(e.target.value) || 0 })}
                      className={`w-full bg-[#0f1115] border rounded-md px-4 py-2.5 text-white text-[13px] focus:outline-none transition-all ${
                        (form.alert_threshold < 1 || form.alert_threshold > 60) ? 'border-red-500/40 focus:border-red-500' : 'border-white/[0.06] focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20'
                      }`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-600">fails</span>
                  </div>
                  {(form.alert_threshold < 1 || form.alert_threshold > 60) && (
                    <span className="text-red-400 text-[11px] mt-1 block">1-60 failures</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.03] py-2.5 rounded-md text-[13px] font-medium transition-all">Cancel</button>
              <button
                onClick={handleCreate}
                className={`flex-1 font-semibold py-2.5 rounded-md text-[13px] transition-all ${
                  (form.check_interval >= 3 && form.check_interval <= 60 && form.alert_threshold >= 1 && form.alert_threshold <= 60)
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-[#0a0a0a] shadow-[0_2px_12px_rgba(16,185,129,0.25)] cursor-pointer active:scale-[0.97]'
                  : 'bg-white/[0.04] text-slate-600 cursor-not-allowed'
                }`}
                disabled={!(form.check_interval >= 3 && form.check_interval <= 60 && form.alert_threshold >= 1 && form.alert_threshold <= 60)}
              >
                Create Monitor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
