import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { monitorApi } from '../api/monitors';
import { dashboardApi } from '../api/dashboard';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  ReferenceLine,
} from 'recharts';


function formatDuration(seconds: number): string {
  if (!seconds) return '—';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

function formatDate(d: string | Date, short = false): string {
  const date = new Date(d);
  if (short) return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ─── Custom Tooltip for Recharts ────────────────────────────────
const CustomTooltip = ({ active, payload, label, unit = '' }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1c23] border border-white/10 rounded-xl px-4 py-3 shadow-2xl text-[13px]">
      <p className="text-slate-400 mb-1.5 font-medium">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-300">{p.name}:</span>
          <span className="font-bold text-white">{p.value}{unit}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Response Time Chart ─────────────────────────────────────────
function ResponseTimeChart({ data }: { data: any[] }) {
  if (!data.length) {
    return (
      <div className="h-56 flex flex-col items-center justify-center text-slate-600 gap-3">
        <span className="material-symbols-outlined text-4xl">show_chart</span>
        <p className="text-sm">No response time data yet</p>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    date: formatDate(d.day, true),
    'Avg Response': Math.round(d.avg_response_time || 0),
  }));

  const maxVal = Math.max(...chartData.map((d) => d['Avg Response']));
  const avgVal = Math.round(chartData.reduce((a, d) => a + d['Avg Response'], 0) / chartData.length);

  return (
    <div>
      <div className="flex items-center gap-6 mb-6 text-[13px]">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span className="text-slate-400">Avg Response Time</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <span className="material-symbols-outlined text-[16px] text-amber-400">info</span>
          Peak: <span className="font-bold text-amber-400">{maxVal}ms</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <span className="material-symbols-outlined text-[16px] text-sky-400">analytics</span>
          Avg: <span className="font-bold text-sky-400">{avgVal}ms</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="rtGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}ms`} width={55} />
          <Tooltip content={<CustomTooltip unit="ms" />} />
          <ReferenceLine y={avgVal} stroke="#38bdf8" strokeDasharray="4 4" strokeOpacity={0.5} />
          <Area
            type="monotone"
            dataKey="Avg Response"
            stroke="#10b981"
            strokeWidth={2.5}
            fill="url(#rtGrad)"
            dot={false}
            activeDot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Uptime Bar Chart ─────────────────────────────────────────────
function UptimeBarChart({ data }: { data: any[] }) {
  if (!data.length) {
    return (
      <div className="h-56 flex flex-col items-center justify-center text-slate-600 gap-3">
        <span className="material-symbols-outlined text-4xl">bar_chart</span>
        <p className="text-sm">No uptime data yet</p>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    date: formatDate(d.day, true),
    Uptime: parseFloat(d.uptime_percentage || 0),
    raw: d,
  }));

  const getBarColor = (val: number) => {
    if (val >= 99) return '#10b981';
    if (val >= 95) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div>
      <div className="flex items-center gap-6 mb-6 text-[13px]">
        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /><span className="text-slate-400">≥ 99%</span></div>
        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /><span className="text-slate-400">95–99%</span></div>
        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-red-400" /><span className="text-slate-400">&lt; 95%</span></div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis domain={[90, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} width={45} />
          <Tooltip content={<CustomTooltip unit="%" />} />
          <ReferenceLine y={99} stroke="#10b981" strokeDasharray="4 4" strokeOpacity={0.4} />
          <Bar dataKey="Uptime" radius={[3, 3, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={index} fill={getBarColor(entry.Uptime)} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Status Distribution Pie Chart ────────────────────────────────
function StatusPieChart({ checks }: { checks: any[] }) {
  const upCount = checks.filter((c) => c.status === 'up').length;
  const downCount = checks.filter((c) => c.status === 'down').length;
  const total = checks.length;

  if (!total) {
    return (
      <div className="h-48 flex flex-col items-center justify-center text-slate-600 gap-3">
        <span className="material-symbols-outlined text-4xl">donut_large</span>
        <p className="text-sm">No check data yet</p>
      </div>
    );
  }

  const pieData = [
    { name: 'Up', value: upCount, color: '#10b981' },
    { name: 'Down', value: downCount, color: '#ef4444' },
  ].filter((d) => d.value > 0);

  return (
    <div className="flex items-center gap-6">
      <ResponsiveContainer width="50%" height={160}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={70}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
          >
            {pieData.map((entry, index) => (
              <Cell key={index} fill={entry.color} fillOpacity={0.9} />
            ))}
          </Pie>
          <Tooltip formatter={(value: any) => [`${value} checks`, '']} contentStyle={{ background: '#1a1c23', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex-1 space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-[12px] text-slate-400">Successful checks</span>
          </div>
          <div className="text-2xl font-bold text-emerald-400">{upCount}</div>
          <div className="text-[11px] text-slate-600">{total > 0 ? ((upCount / total) * 100).toFixed(1) : 0}% success rate</div>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span className="text-[12px] text-slate-400">Failed checks</span>
          </div>
          <div className="text-2xl font-bold text-red-400">{downCount}</div>
          <div className="text-[11px] text-slate-600">{total > 0 ? ((downCount / total) * 100).toFixed(1) : 0}% failure rate</div>
        </div>
      </div>
    </div>
  );
}

// ─── Uptime Timeline (Heartbeat bars) ────────────────────────────
function HeartbeatTimeline({ checks }: { checks: any[] }) {
  const last90 = checks.slice(0, 90);
  return (
    <div className="flex items-end gap-[2.5px] h-9">
      {Array.from({ length: 90 }).map((_, i) => {
        const check = last90[i];
        let colorClass = 'bg-slate-800/40';
        if (check) colorClass = check.status === 'up' ? 'bg-emerald-500' : 'bg-red-500';
        return (
          <div
            key={i}
            className={`flex-1 rounded-[2px] ${colorClass} hover:opacity-70 transition-opacity relative group cursor-default`}
            style={{ minWidth: 3 }}
          >
            {check && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#1a1c23] text-[11px] text-white px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/10 shadow-xl z-20">
                <div className={`font-bold ${check.status === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>{check.status.toUpperCase()}</div>
                <div className="text-slate-300">{check.response_time ? `${check.response_time}ms` : '—'} · {check.status_code || '—'}</div>
                <div className="text-slate-500">{formatDate(check.checked_at)}</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── TIME RANGE LOG FILTER ────────────────────────────────────────
type TimeRange = '24h' | '3d' | '7d';

const TIME_RANGE_OPTIONS: { label: string; value: TimeRange; hours: number }[] = [
  { label: '24 Hours', value: '24h', hours: 24 },
  { label: '3 Days', value: '3d', hours: 72 },
];

function filterChecksByRange(checks: any[], range: TimeRange): any[] {
  const hours = TIME_RANGE_OPTIONS.find((o) => o.value === range)?.hours ?? 24;
  const cutoff = Date.now() - hours * 60 * 60 * 1000;
  return checks.filter((c) => new Date(c.checked_at).getTime() >= cutoff);
}

// ─── LOGS TAB ────────────────────────────────────────────────────
function LogsTab({ checks }: { checks: any[] }) {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [statusFilter, setStatusFilter] = useState<'all' | 'up' | 'down'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

  const rangeFiltered = useMemo(() => filterChecksByRange(checks, timeRange), [checks, timeRange]);
  const statusFiltered = useMemo(
    () => (statusFilter === 'all' ? rangeFiltered : rangeFiltered.filter((c) => c.status === statusFilter)),
    [rangeFiltered, statusFilter]
  );
  const totalPages = Math.ceil(statusFiltered.length / PAGE_SIZE);
  const paginated = useMemo(() => statusFiltered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE), [statusFiltered, currentPage]);

  const upCount = rangeFiltered.filter((c) => c.status === 'up').length;
  const downCount = rangeFiltered.filter((c) => c.status === 'down').length;
  const avgRT = rangeFiltered.length > 0
    ? Math.round(rangeFiltered.reduce((a, c) => a + (c.response_time || 0), 0) / rangeFiltered.length)
    : 0;

  // Reset page when filter changes
  const handleRangeChange = (r: TimeRange) => { setTimeRange(r); setCurrentPage(1); };
  const handleStatusChange = (s: 'all' | 'up' | 'down') => { setStatusFilter(s); setCurrentPage(1); };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">

      {/* Top Controls Row */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* Time Range Selector */}
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-slate-500 mr-1">Period:</span>
          <div className="flex bg-[#0f1115] border border-white/[0.06] rounded-lg p-1 gap-1">
            {TIME_RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleRangeChange(opt.value)}
                className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-all ${
                  timeRange === opt.value
                    ? 'bg-emerald-500/15 text-emerald-400 shadow-sm ring-1 ring-emerald-500/20'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-slate-500 mr-1">Filter:</span>
          <div className="flex bg-[#0f1115] border border-white/[0.06] rounded-lg p-1 gap-1">
            {(['all', 'up', 'down'] as const).map((s) => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                className={`px-3 py-1.5 rounded-md text-[12px] font-medium capitalize transition-all ${
                  statusFilter === s
                    ? s === 'up'
                      ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20'
                      : s === 'down'
                      ? 'bg-red-500/15 text-red-400 ring-1 ring-red-500/20'
                      : 'bg-white/10 text-white ring-1 ring-white/10'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                }`}
              >
                {s === 'all' ? 'All' : s === 'up' ? '✓ Up' : '✗ Down'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Stats Bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#1a1c23] border border-white/[0.04] rounded-xl p-4 flex items-center gap-3 shadow-sm">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>
          </div>
          <div>
            <div className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">Successful</div>
            <div className="text-xl font-bold text-white">{upCount}</div>
          </div>
        </div>
        <div className="bg-[#1a1c23] border border-white/[0.04] rounded-xl p-4 flex items-center gap-3 shadow-sm">
          <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[18px] text-red-400">cancel</span>
          </div>
          <div>
            <div className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">Failed</div>
            <div className="text-xl font-bold text-white">{downCount}</div>
          </div>
        </div>
        <div className="bg-[#1a1c23] border border-white/[0.04] rounded-xl p-4 flex items-center gap-3 shadow-sm">
          <div className="w-9 h-9 rounded-lg bg-sky-500/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[18px] text-sky-400">speed</span>
          </div>
          <div>
            <div className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">Avg Response</div>
            <div className="text-xl font-bold text-white">{avgRT}<span className="text-sm font-normal text-slate-500 ml-1">ms</span></div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#1a1c23] border border-white/[0.04] rounded-xl overflow-hidden shadow-md">
        <div className="px-5 py-3.5 border-b border-white/[0.04] flex items-center justify-between">
          <span className="text-[13px] font-medium text-slate-200">
            Ping Logs
            <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full bg-white/5 text-slate-500 font-bold">
              {statusFiltered.length} entries
            </span>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-white/[0.015]">
                <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Timestamp</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">HTTP Code</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Response Time</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden lg:table-cell">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.025]">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-slate-500">
                    <span className="material-symbols-outlined text-3xl mb-2 block">search_off</span>
                    No logs found for the selected period
                  </td>
                </tr>
              ) : (
                paginated.map((c: any, i: number) => (
                  <tr key={c.id || i} className="hover:bg-white/[0.015] transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col">
                        <span className="text-[13px] text-slate-300 font-medium tabular-nums">
                          {new Date(c.checked_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        <span className="text-[11px] text-slate-500 tabular-nums">
                          {new Date(c.checked_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${c.status === 'up' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                        <span className={`text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border ${
                          c.status === 'up'
                            ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                            : 'text-red-400 bg-red-500/10 border-red-500/20'
                        }`}>
                          {c.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[13px] font-bold tabular-nums ${
                        c.status_code >= 200 && c.status_code < 300
                          ? 'text-emerald-400'
                          : c.status_code >= 400
                          ? 'text-red-400'
                          : 'text-slate-400'
                      }`}>
                        {c.status_code || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {c.response_time ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                c.response_time < 300 ? 'bg-emerald-500' : c.response_time < 800 ? 'bg-amber-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min((c.response_time / 2000) * 100, 100)}%` }}
                            />
                          </div>
                          <span className={`text-[13px] font-semibold tabular-nums ${
                            c.response_time < 300 ? 'text-emerald-400' : c.response_time < 800 ? 'text-amber-400' : 'text-red-400'
                          }`}>
                            {c.response_time}ms
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <span className="text-[12px] text-slate-500 line-clamp-1">{c.message || '—'}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-white/[0.04] flex items-center justify-between">
            <span className="text-[12px] text-slate-500">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="text-[12px] px-3 py-1 rounded bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                ← Prev
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="text-[12px] px-3 py-1 rounded bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ANALYTICS TAB ────────────────────────────────────────────────
function AnalyticsTab({ stats, checks, incidents }: { stats: any[]; checks: any[]; incidents: any[] }) {
  const [statsDays, setStatsDays] = useState<7 | 14 | 30>(30);
  const filteredStats = useMemo(() => stats.slice(-statsDays), [stats, statsDays]);

  const avgUptime = filteredStats.length > 0
    ? (filteredStats.reduce((a, s) => a + parseFloat(s.uptime_percentage || 0), 0) / filteredStats.length).toFixed(2)
    : '—';

  const avgRT = filteredStats.length > 0
    ? Math.round(filteredStats.reduce((a, s) => a + (s.avg_response_time || 0), 0) / filteredStats.length)
    : 0;

  return (
    <div className="space-y-5 animate-in fade-in duration-300">

      {/* Summary KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Avg Uptime', val: `${avgUptime}%`, icon: 'monitoring', color: 'emerald' },
          { label: 'Avg Response', val: `${avgRT}ms`, icon: 'speed', color: 'sky' },
          { label: 'Total Checks', val: filteredStats.reduce((a, s) => a + (s.total_checks || 0), 0).toLocaleString(), icon: 'checklist', color: 'violet' },
          { label: 'Incidents', val: incidents.length, icon: 'emergency', color: 'red' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-[#1a1c23] border border-white/[0.04] rounded-xl p-5 shadow-sm">
            <div className={`w-8 h-8 rounded-lg bg-${kpi.color}-500/10 flex items-center justify-center mb-3`}>
              <span className={`material-symbols-outlined text-[18px] text-${kpi.color}-400`}>{kpi.icon}</span>
            </div>
            <div className="text-[11px] text-slate-500 uppercase font-bold tracking-wider mb-1">{kpi.label}</div>
            <div className={`text-2xl font-bold text-white`}>{kpi.val}</div>
          </div>
        ))}
      </div>

      {/* Response Time Chart Card */}
      <div className="bg-[#1a1c23] border border-white/[0.04] rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-[14px] font-semibold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-lg text-emerald-400">show_chart</span>
              Response Time
            </h3>
            <p className="text-[12px] text-slate-500 mt-0.5">Average response time per day</p>
          </div>
          <div className="flex bg-[#0f1115] border border-white/[0.06] rounded-lg p-1 gap-1">
            {([7, 14, 30] as const).map((d) => (
              <button
                key={d}
                onClick={() => setStatsDays(d)}
                className={`px-3 py-1 rounded text-[11px] font-medium transition-all ${
                  statsDays === d ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
        <ResponseTimeChart data={filteredStats} />
      </div>

      {/* Uptime Bar Chart Card */}
      <div className="bg-[#1a1c23] border border-white/[0.04] rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-[14px] font-semibold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-lg text-blue-400">bar_chart</span>
              Daily Uptime
            </h3>
            <p className="text-[12px] text-slate-500 mt-0.5">Uptime percentage per day</p>
          </div>
        </div>
        <UptimeBarChart data={filteredStats} />
      </div>

      {/* Two-column row: Pie chart + Recent Check Heartbeat */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Pie chart */}
        <div className="bg-[#1a1c23] border border-white/[0.04] rounded-xl p-6 shadow-sm">
          <h3 className="text-[14px] font-semibold text-white flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-lg text-violet-400">donut_large</span>
            Check Distribution
          </h3>
          <p className="text-[12px] text-slate-500 mb-4">Based on last {checks.length} checks</p>
          <StatusPieChart checks={checks} />
        </div>

        {/* Heartbeat */}
        <div className="bg-[#1a1c23] border border-white/[0.04] rounded-xl p-6 shadow-sm">
          <h3 className="text-[14px] font-semibold text-white flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-lg text-pink-400">favorite</span>
            Heartbeat
          </h3>
          <p className="text-[12px] text-slate-500 mb-5">Last 90 pings</p>
          <HeartbeatTimeline checks={checks} />
          <div className="flex gap-3 mt-3 text-[11px] text-slate-600">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500 inline-block" /> Up</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500 inline-block" /> Down</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-slate-700 inline-block" /> No data</span>
          </div>
        </div>
      </div>

      {/* Incident History */}
      <div className="bg-[#1a1c23] border border-white/[0.04] rounded-xl p-6 shadow-sm">
        <h3 className="text-[14px] font-semibold text-white flex items-center gap-2 mb-5">
          <span className="material-symbols-outlined text-lg text-red-400">report</span>
          Incident History
        </h3>
        {incidents.length === 0 ? (
          <div className="text-center py-10 rounded-xl border border-dashed border-white/[0.05] text-slate-600">
            <span className="material-symbols-outlined text-4xl mb-2 block text-emerald-700/50">verified</span>
            <p className="text-sm">No incidents on record. Solid uptime!</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {incidents.map((inc: any) => (
              <div key={inc.id} className="flex items-center gap-4 py-4 px-5 rounded-xl bg-[#13151b] border border-white/[0.04] hover:border-white/[0.07] transition-colors">
                <div className={`w-2 h-2 rounded-full shrink-0 ${inc.is_resolved ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm mb-0.5">
                    <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded border ${
                      inc.is_resolved ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20'
                    }`}>
                      {inc.is_resolved ? 'Resolved' : 'Ongoing'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Started {formatDate(inc.started_at)}
                    {inc.resolved_at && ` · Resolved ${formatDate(inc.resolved_at)}`}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[13px] font-bold text-white">{formatDuration(inc.duration_seconds)}</div>
                  <div className="text-[10px] text-slate-600 font-bold uppercase tracking-tight">duration</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────
export default function MonitorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [monitor, setMonitor] = useState<any>(null);
  const [checks, setChecks] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'analytics'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [monRes, chkRes, stRes, incRes] = await Promise.all([
          monitorApi.getMonitorDetails(id),
           dashboardApi.getRecentChecks(id, 1500),
          dashboardApi.getMonitorStats(id, 30),
          dashboardApi.getIncidents(id, 50),
        ]);
        if (monRes.status === 'success') setMonitor(monRes.data);
        if (chkRes.success) setChecks(chkRes.data);
        if (stRes.success) setStats(stRes.data);
        if (incRes.success) setIncidents(incRes.data);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchAll();
  }, [id]);

  const handleToggle = async () => {
    if (!monitor || !id) return;
    try {
      const res = await monitorApi.toggleStatus(id, !monitor.is_active);
      if (res.status === 'success') setMonitor(res.data);
    } catch {}
  };

  const handleDelete = async () => {
    if (!id || !confirm('Delete this monitor permanently?')) return;
    try {
      await monitorApi.deleteMonitor(id);
      navigate('/dashboard');
    } catch {}
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#13151b] flex flex-col items-center justify-center gap-3">
        <span className="material-symbols-outlined text-4xl text-emerald-500 animate-spin">progress_activity</span>
        <p className="text-[13px] text-slate-300">Loading monitor data…</p>
      </div>
    );
  }

  if (!monitor) {
    return (
      <div className="min-h-screen bg-[#13151b] flex flex-col items-center justify-center gap-4">
        <span className="material-symbols-outlined text-5xl text-slate-700">error</span>
        <p className="text-white font-bold">Monitor not found</p>
        <Link to="/dashboard" className="text-sm text-emerald-400 hover:underline">← Back to Dashboard</Link>
      </div>
    );
  }

  const statusLabel = !monitor.is_active ? 'Paused' : monitor.last_status === 'up' ? 'Up' : monitor.last_status === 'down' ? 'Down' : 'Pending';

  const avg7Uptime = stats.slice(-7).length > 0
    ? (stats.slice(-7).reduce((a: number, s: any) => a + parseFloat(s.uptime_percentage), 0) / stats.slice(-7).length).toFixed(2)
    : '—';
  const avg30Uptime = stats.length > 0
    ? (stats.reduce((a: number, s: any) => a + parseFloat(s.uptime_percentage), 0) / stats.length).toFixed(2)
    : '—';
  const avg30RT = stats.length > 0
    ? Math.round(stats.reduce((a: number, s: any) => a + parseFloat(s.avg_response_time || 0), 0) / stats.length)
    : '—';

  // For Stats Row in hero
  const uptimePercent = checks.length > 0 
    ? ((checks.filter(c => c.status === 'up').length / checks.length) * 100).toFixed(1)
    : '—';

  const TABS = [
    { id: 'overview', label: 'Overview', icon: 'dashboard' },
    { id: 'logs', label: 'Logs', icon: 'list_alt' },
    { id: 'analytics', label: 'Analytics', icon: 'insights' },
  ] as const;

  return (
    <div className="flex h-screen bg-[#13151b] font-sans text-slate-200 overflow-hidden">

      {/* SIDEBAR */}
      <aside className="hidden md:flex w-64 bg-[#1a1c23] border-r border-white/[0.06] flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-lg">cell_tower</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">NanoPing</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-3">Monitor Views</div>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-emerald-500/15 text-emerald-400 shadow-sm border border-emerald-500/10'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
              {tab.label}
              {tab.id === 'logs' && checks.length > 0 && (
                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-slate-400">{checks.length}</span>
              )}
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-white/[0.06]">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/5 transition-all font-bold"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Back to Dashboard
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col min-w-0">

        {/* HEADER */}
        <header className="h-16 bg-[#13151b] border-b border-white/[0.06] flex items-center justify-between px-5 lg:px-8 shrink-0">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 text-[12px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-4 py-2 rounded-lg border border-emerald-500/20 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Dashboard
          </button>
          <div className="hidden md:flex items-center gap-2 text-[12px] text-slate-500 uppercase font-bold tracking-widest">
            <span>Monitor</span>
            <span className="text-slate-700">/</span>
            <span className="text-white truncate max-w-xs">{monitor.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggle}
              className="flex items-center gap-1.5 text-[12px] font-bold text-slate-300 bg-white/5 hover:bg-white/8 px-3 py-1.5 rounded-md border border-white/5 transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">{monitor.is_active ? 'pause' : 'play_arrow'}</span>
              <span className="hidden sm:inline">{monitor.is_active ? 'Pause' : 'Resume'}</span>
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 text-[12px] font-bold text-red-400 bg-red-500/10 hover:bg-red-500/15 px-3 py-1.5 rounded-md border border-red-500/10 transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
              <span className="hidden sm:inline">Delete</span>
            </button>
          </div>
        </header>

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto p-5 lg:p-8">
          <div className="max-w-5xl mx-auto space-y-8">

            {/* Monitor Hero */}
            <div className="flex items-center gap-6">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ring-1 shadow-lg ${
                monitor.is_active
                  ? monitor.last_status === 'up'
                    ? 'bg-emerald-500/15 ring-emerald-500/30 text-emerald-400'
                    : 'bg-red-500/15 ring-red-500/30 text-red-400'
                  : 'bg-yellow-500/15 ring-yellow-500/30 text-yellow-400'
              }`}>
                <span className="material-symbols-outlined text-3xl">
                  {monitor.is_active ? (monitor.last_status === 'up' ? 'language' : 'language_off') : 'pause_circle'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap mb-1">
                  <h1 className="text-2xl font-bold text-white tracking-tight truncate">{monitor.name}</h1>
                  <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-md border ${
                    !monitor.is_active
                      ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20'
                      : monitor.last_status === 'up'
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                        : 'bg-red-500/15 text-red-400 border-red-500/20'
                  }`}>
                    {statusLabel}
                  </span>
                </div>
                <div className="flex items-center gap-2 px-0.5">
                  <span className="text-slate-400 text-[13px] truncate">{monitor.url}</span>
                  <a href={monitor.url} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-emerald-400 transition-colors">
                    <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Hero Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Uptime (All)', val: `${uptimePercent}%`, icon: 'bolt', color: 'emerald' },
                { label: 'Avg Uptime (30d)', val: `${avg30Uptime}%`, icon: 'history', color: 'sky' },
                { label: 'Avg Latency (30d)', val: `${avg30RT}ms`, icon: 'speed', color: 'violet' },
                { label: 'Check Interval', val: `${monitor.check_interval}m`, icon: 'timer', color: 'amber' },
              ].map((stat, i) => (
                <div key={i} className="bg-[#1a1c23] border border-white/[0.06] rounded-2xl p-5 hover:border-white/[0.1] transition-colors shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                     <div className={`w-8 h-8 rounded-lg bg-${stat.color}-500/15 flex items-center justify-center`}>
                        <span className={`material-symbols-outlined text-[18px] text-${stat.color}-400`}>{stat.icon}</span>
                     </div>
                     <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">{stat.label}</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{stat.val}</div>
                </div>
              ))}
            </div>

            {/* Mobile Tab Bar */}
            <div className="flex gap-1 bg-[#0f1115] border border-white/[0.05] rounded-xl p-1 md:hidden">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-2 rounded-lg text-[12px] font-medium capitalize transition-all ${
                    activeTab === tab.id ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-500 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── OVERVIEW TAB ── */}
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-in fade-in duration-300">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Heartbeat */}
                  <div className="bg-[#1a1c23] border border-white/[0.04] rounded-xl p-6 shadow-sm">
                    <h3 className="text-[14px] font-bold text-white flex items-center gap-2 mb-1 uppercase tracking-widest">
                      <span className="material-symbols-outlined text-lg text-pink-400">favorite</span>
                      Heartbeat
                    </h3>
                    <p className="text-[11px] text-slate-500 mb-5">Current health over last 90 pings</p>
                    <HeartbeatTimeline checks={checks} />
                    <div className="flex justify-between text-[10px] text-slate-700 font-bold uppercase tracking-tight mt-3">
                      <span>Older</span>
                      <span>Recent</span>
                    </div>
                  </div>

                  {/* Check Distribution */}
                  <div className="bg-[#1a1c23] border border-white/[0.04] rounded-xl p-6 shadow-sm">
                    <h3 className="text-[14px] font-bold text-white flex items-center gap-2 mb-4 uppercase tracking-widest">
                      <span className="material-symbols-outlined text-lg text-violet-400">donut_large</span>
                      Distribution
                    </h3>
                    <StatusPieChart checks={checks} />
                  </div>
                </div>

                {/* Main Stats Summary */}
                <div className="bg-[#1a1c23] border border-white/[0.04] rounded-xl p-6 shadow-sm">
                  <h3 className="text-[14px] font-bold text-white mb-8 uppercase tracking-widest">Performance Summary</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                    <div>
                      <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-2">Last 7 days</div>
                      <div className="text-3xl font-bold text-emerald-400">{avg7Uptime}%</div>
                      <div className="text-[11px] text-slate-600 font-medium mt-1">uptime</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-2">Last 30 days</div>
                      <div className="text-3xl font-bold text-white">{avg30Uptime}%</div>
                      <div className="text-[11px] text-slate-600 font-medium mt-1">uptime</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-2">Avg Response</div>
                      <div className="text-3xl font-bold text-sky-400">{avg30RT}ms</div>
                      <div className="text-[11px] text-slate-600 font-medium mt-1">past 30 days</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-2">Active Alerts</div>
                      <div className="text-3xl font-bold text-red-500">{incidents.filter(i => !i.is_resolved).length}</div>
                      <div className="text-[11px] text-slate-600 font-medium mt-1">{incidents.length} total incidents</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── LOGS TAB ── */}
            {activeTab === 'logs' && (
              <LogsTab checks={checks} />
            )}

            {/* ── ANALYTICS TAB ── */}
            {activeTab === 'analytics' && (
              <AnalyticsTab stats={stats} checks={checks} incidents={incidents} />
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
