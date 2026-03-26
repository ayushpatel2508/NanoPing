import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useMonitorStore } from '../store/useMonitorStore';
import { dashboardApi } from '../api/dashboard';

function timeAgo(date: string | Date | null): string {
  if (!date) return 'Never';
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

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

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { monitors, summaryStats, globalChecks, globalIncidents, isLoading, fetchMonitors, fetchSummary, fetchGlobalData, createMonitor } = useMonitorStore();

  const [showModal, setShowModal] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({ name: '', url: '', check_interval: 5, alert_threshold: 3 });
  const [checksCache, setChecksCache] = useState<Record<string, any[]>>({});
  const [statusFilter, setStatusFilter] = useState<'all' | 'up' | 'down' | 'paused'>('all');
  const [activeTab, setActiveTab] = useState<'monitors' | 'logs' | 'incidents'>('monitors');

  useEffect(() => {
    fetchMonitors();
    fetchSummary();
    fetchGlobalData();
  }, []);

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

  const uptimePercent = summaryStats
    ? summaryStats.total_monitors > 0
      ? ((parseInt(summaryStats.monitors_up) / parseInt(summaryStats.total_monitors)) * 100).toFixed(1)
      : '0.0'
    : '—';

  const filteredMonitors = monitors.filter((m: any) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'up') return m.is_active && m.last_status === 'up';
    if (statusFilter === 'down') return m.is_active && m.last_status === 'down';
    if (statusFilter === 'paused') return !m.is_active;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#13151b] font-sans text-slate-200">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 bg-[#0f1115]/80 backdrop-blur-xl border-b border-white/[0.05]">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)]">
              <span className="material-symbols-outlined text-white text-lg font-bold">cell_tower</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">NanoPing</span>
          </Link>

          <div className="flex items-center gap-6">
            <span className="text-sm text-slate-500 hidden sm:block">{user?.email}</span>
            <button
              onClick={() => { logout(); navigate('/'); }}
              className="text-sm text-slate-400 hover:text-white border border-slate-700/50 hover:bg-slate-800/50 px-4 py-2 rounded-full transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-10 max-w-7xl">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">Global overview of all your monitored endpoints.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-2.5 px-6 rounded-xl text-sm transition-all hover:shadow-[0_0_25px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">add</span> Add Monitor
          </button>
        </div>

        {/* Global Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <div className="bg-[#1a1c23] border border-white/[0.06] rounded-2xl p-6 hover:border-emerald-500/20 transition-colors shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center border border-emerald-500/20">
                <span className="material-symbols-outlined text-emerald-400">trending_up</span>
              </div>
              <span className="text-xs text-slate-400 uppercase font-bold tracking-widest">Uptime</span>
            </div>
            <div className="text-3xl font-extrabold text-white">{uptimePercent}%</div>
            <p className="text-xs text-slate-400 mt-1">Across all monitors</p>
          </div>

          <div className="bg-[#1a1c23] border border-white/[0.06] rounded-2xl p-6 hover:border-blue-500/20 transition-colors shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center border border-blue-500/20">
                <span className="material-symbols-outlined text-blue-400">monitor_heart</span>
              </div>
              <span className="text-xs text-slate-400 uppercase font-bold tracking-widest">Monitors</span>
            </div>
            <div className="text-3xl font-extrabold text-white">{summaryStats?.total_monitors || 0}</div>
            <p className="text-xs text-slate-400 mt-1">{summaryStats?.monitors_up || 0} up · {summaryStats?.monitors_down || 0} down</p>
          </div>

          <div className="bg-[#1a1c23] border border-white/[0.06] rounded-2xl p-6 hover:border-red-500/20 transition-colors shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center border border-red-500/20">
                <span className="material-symbols-outlined text-red-400">warning</span>
              </div>
              <span className="text-xs text-slate-400 uppercase font-bold tracking-widest">Incidents</span>
            </div>
            <div className="text-3xl font-extrabold text-white">{summaryStats?.monitors_down || 0}</div>
            <p className="text-xs text-slate-400 mt-1">Active incidents</p>
          </div>

          <div className="bg-[#1a1c23] border border-white/[0.06] rounded-2xl p-6 hover:border-amber-500/20 transition-colors shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center border border-amber-500/20">
                <span className="material-symbols-outlined text-amber-400">notifications_active</span>
              </div>
              <span className="text-xs text-slate-400 uppercase font-bold tracking-widest">Alerts Sent</span>
            </div>
            <div className="text-3xl font-extrabold text-white">{summaryStats?.monitors_down || 0}</div>
            <p className="text-xs text-slate-400 mt-1">Total alerts dispatched</p>
          </div>
        </div>

        {/* Main View Tabs */}
        <div className="flex items-center gap-4 mb-8 border-b border-slate-800/60 pb-4">
          <button
            onClick={() => setActiveTab('monitors')}
            className={`text-sm font-bold transition-colors ${activeTab === 'monitors' ? 'text-emerald-400' : 'text-slate-500 hover:text-white'}`}
          >
            Monitor List
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`text-sm font-bold transition-colors ${activeTab === 'logs' ? 'text-emerald-400' : 'text-slate-500 hover:text-white'}`}
          >
            Recent Ping History
          </button>
          <button
            onClick={() => setActiveTab('incidents')}
            className={`text-sm font-bold transition-colors ${activeTab === 'incidents' ? 'text-emerald-400' : 'text-slate-500 hover:text-white'}`}
          >
            Alerts & Incidents
          </button>
        </div>

        {activeTab === 'monitors' && (
          <>
            {/* Filter Tabs */}
            <div className="flex items-center gap-2 mb-6">
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
              <span className="text-xs text-slate-500 ml-auto">{filteredMonitors.length} monitor{filteredMonitors.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Monitor List */}
            <div className="space-y-3">
              {isLoading && monitors.length === 0 && (
                <div className="text-center py-20 text-slate-500">
                  <span className="material-symbols-outlined text-4xl animate-spin">progress_activity</span>
                  <p className="mt-3">Loading monitors...</p>
                </div>
              )}

              {!isLoading && monitors.length === 0 && (
                <div className="text-center py-20 border border-dashed border-white/[0.06] rounded-2xl">
                  <span className="material-symbols-outlined text-5xl text-slate-600 mb-4 block">radar</span>
                  <h3 className="text-lg font-bold text-white mb-2">No monitors yet</h3>
                  <p className="text-slate-400 text-sm mb-6">Add your first URL to start monitoring.</p>
                  <button onClick={() => setShowModal(true)} className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-2 px-6 rounded-xl text-sm transition-all shadow-lg hover:shadow-emerald-500/20">
                    Add Monitor
                  </button>
                </div>
              )}

              {filteredMonitors.map((m: any) => {
                const checks = checksCache[m.id] || [];
                return (
                  <div
                    key={m.id}
                    onClick={() => navigate(`/dashboard/${m.id}`)}
                    className="bg-[#1a1c23] border border-white/[0.06] rounded-2xl p-5 flex items-center gap-4 hover:border-white/[0.12] hover:bg-[#1e2128] transition-all cursor-pointer group shadow-sm"
                  >
                    {/* Status Dot */}
                    <div className="relative">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(m)}`}></div>
                      {m.is_active && m.last_status === 'up' && (
                        <div className={`absolute inset-0 w-3 h-3 rounded-full ${getStatusColor(m)} animate-ping opacity-30`}></div>
                      )}
                    </div>

                    {/* Name & URL */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="text-white font-bold truncate">{m.name}</h3>
                        <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-md ${
                          !m.is_active ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20' :
                          m.last_status === 'up' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' :
                          m.last_status === 'down' ? 'bg-red-500/15 text-red-400 border border-red-500/20' :
                          'bg-slate-500/15 text-slate-300 border border-white/10'
                        }`}>{getStatusLabel(m)}</span>
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{m.url}</p>
                    </div>

                    {/* Check Interval */}
                    <div className="hidden md:block text-center px-4">
                      <div className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Interval</div>
                      <div className="text-sm font-bold text-white">{m.check_interval}m</div>
                    </div>

                    {/* Last Checked */}
                    <div className="hidden md:block text-center px-4">
                      <div className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Checked</div>
                      <div className="text-sm font-bold text-white">{timeAgo(m.last_checked)}</div>
                    </div>

                    {/* Mini Status Bar (20 partitions) */}
                    <div className="hidden lg:flex items-center gap-[2px]">
                      {Array.from({ length: 20 }).map((_, i) => {
                        const check = checks[19 - i]; // newest first, so reverse
                        let color = 'bg-slate-800';
                        if (check) {
                          color = check.status === 'up' ? 'bg-emerald-500' : 'bg-red-500';
                        }
                        return <div key={i} className={`w-[6px] h-5 rounded-sm ${color} transition-colors`} title={check ? `${check.status} — ${check.response_time}ms` : 'No data'}></div>;
                      })}
                    </div>

                    {/* Arrow */}
                    <span className="material-symbols-outlined text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all">chevron_right</span>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {activeTab === 'logs' && (
          <div className="bg-[#1a1c23] border border-white/[0.06] rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.02]">
              <span className="text-sm font-bold text-white">
                Global Ping History
                <span className="ml-3 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest">
                  Recent 50 checks
                </span>
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-white/[0.03]">
                    <th className="text-left px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Time</th>
                    <th className="text-left px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Monitor</th>
                    <th className="text-left px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="text-left px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">HTTP Code</th>
                    <th className="text-left px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Latency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {globalChecks.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-20 text-slate-500 font-medium">No logs found yet. Waiting for first pings...</td></tr>
                  ) : globalChecks.map((c: any) => (
                    <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 text-[12px] text-slate-400 font-medium">{formatDate(c.checked_at)}</td>
                      <td className="px-6 py-4 text-sm text-white font-bold">{c.monitor_name}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2 py-1 rounded-md border ${
                          c.status === 'up' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20'
                        }`}>{c.status}</span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-300">{c.status_code || '—'}</td>
                      <td className="px-6 py-4 text-sm font-bold text-sky-400">{c.response_time ? `${c.response_time}ms` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'incidents' && (
          <div className="bg-[#1a1c23] border border-white/[0.06] rounded-2xl overflow-hidden p-8 shadow-sm">
            <h3 className="text-lg font-bold text-white flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center border border-red-500/20">
                <span className="material-symbols-outlined text-red-400">report</span>
              </div>
              Global Incident History
            </h3>
            {globalIncidents.length === 0 ? (
              <div className="text-center py-20 rounded-2xl border border-dashed border-white/[0.06] text-slate-500">
                <span className="material-symbols-outlined text-5xl mb-4 block text-emerald-500/20">verified</span>
                <p className="text-sm font-medium">No incidents on record. All systems operational!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {globalIncidents.map((inc: any) => (
                  <div key={inc.id} className="flex flex-col sm:flex-row sm:items-center gap-6 p-5 rounded-2xl bg-[#1e2128] border border-white/[0.06] hover:border-white/[0.12] transition-colors shadow-sm">
                    <div className={`hidden sm:block w-2.5 h-2.5 rounded-full shrink-0 ${inc.is_resolved ? 'bg-emerald-500' : 'bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-base text-white font-bold">{inc.monitor_name}</span>
                        <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-md border ${
                          inc.is_resolved ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20'
                        }`}>
                          {inc.is_resolved ? 'Resolved' : 'Ongoing'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Started {formatDate(inc.started_at)}
                        {inc.resolved_at && ` · Resolved ${formatDate(inc.resolved_at)}`}
                      </p>
                    </div>
                    <div className="text-left sm:text-right shrink-0 border-t sm:border-t-0 sm:border-l border-white/[0.06] pt-3 sm:pt-0 sm:pl-6">
                      <div className="text-lg font-bold text-white">{formatDuration(inc.duration_seconds)}</div>
                      <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">downtime</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
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
