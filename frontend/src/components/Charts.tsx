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

export function formatDuration(seconds: number): string {
  if (!seconds) return '—';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

export function formatDate(d: string | Date, short = false): string {
  const date = new Date(d);
  if (short) return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ─── Custom Tooltip for Recharts ────────────────────────────────
export const CustomTooltip = ({ active, payload, label, unit = '' }: any) => {
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
export function ResponseTimeChart({ data }: { data: any[] }) {
  if (!data?.length) {
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
export function UptimeBarChart({ data }: { data: any[] }) {
  if (!data?.length) {
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
export function StatusPieChart({ checks }: { checks: any[] }) {
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
export function HeartbeatTimeline({ checks }: { checks: any[] }) {
  const last60 = checks.slice(0, 60);
  return (
    <div className="flex items-end gap-[2.5px] h-9">
      {Array.from({ length: 60 }).map((_, i) => {
        const check = last60[i];
        let colorClass = 'bg-slate-800/40';
        if (check) colorClass = check.status === 'up' ? 'bg-emerald-400' : 'bg-red-500';
        return (
          <div
            key={i}
            className={`flex-1 h-full rounded-[2px] ${colorClass} hover:opacity-70 transition-opacity relative group cursor-default`}
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
