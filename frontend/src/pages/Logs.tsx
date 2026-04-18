import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../api/dashboard';
import { useMonitorStore } from '../store/useMonitorStore';

const PAGE_SIZE = 25;

function formatDate(d: string | Date): string {
  const date = new Date(d);
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function Logs() {
  const navigate = useNavigate();
  const { monitors, fetchMonitors } = useMonitorStore();

  const [checks, setChecks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [monitorFilter, setMonitorFilter] = useState<string>('all');

  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [cursorStack, setCursorStack] = useState<(string | null)[]>([]);
  const [currentCursor, setCurrentCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);

  const load = useCallback(async (cursor: string | null) => {
    try {
      setIsLoading(true);
      setError('');
      const res = await dashboardApi.getGlobalChecks(PAGE_SIZE, cursor);
      setChecks(res?.data || []);
      setNextCursor(res?.nextCursor || null);
      setHasMore(res?.hasMore || false);
    } catch {
      setError('Failed to load ping history.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMonitors();
  }, [fetchMonitors]);

  useEffect(() => {
    load(null);
  }, [load]);

  const goToNext = () => {
    if (!nextCursor || !hasMore) return;
    setCursorStack(prev => [...prev, currentCursor]);
    setCurrentCursor(nextCursor);
    setPageNumber(prev => prev + 1);
    load(nextCursor);
  };

  const goToPrev = () => {
    if (cursorStack.length === 0) return;
    const newStack = [...cursorStack];
    const prevCursor = newStack.pop()!;
    setCursorStack(newStack);
    setCurrentCursor(prevCursor);
    setPageNumber(prev => prev - 1);
    load(prevCursor);
  };

  const goToFirst = () => {
    setCursorStack([]);
    setCurrentCursor(null);
    setPageNumber(1);
    load(null);
  };

  const filteredChecks = monitorFilter === 'all'
    ? checks
    : checks.filter((c: any) => c.monitor_name?.toLowerCase() === monitorFilter.toLowerCase());

  const upCount = filteredChecks.filter((c: any) => c.status === 'up').length;
  const downCount = filteredChecks.filter((c: any) => c.status === 'down').length;
  const avgLatency = (() => {
    const withTime = filteredChecks.filter((c: any) => c.response_time);
    if (withTime.length === 0) return 0;
    return Math.round(withTime.reduce((a: number, c: any) => a + c.response_time, 0) / withTime.length);
  })();

  return (
    <div className="p-6 lg:p-8 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Ping Logs</h1>
          <p className="text-slate-500 text-[13px] mt-0.5">Response times and status logs across all monitors</p>
        </div>
        <select
          value={monitorFilter}
          onChange={(e) => { setMonitorFilter(e.target.value); }}
          className="bg-[#16181e] border border-white/[0.06] text-slate-300 text-[13px] rounded-md px-3 py-2 focus:outline-none focus:border-emerald-500/40 transition-all cursor-pointer"
        >
          <option value="all">All Monitors</option>
          {monitors.map((m: any) => (
            <option key={m.id} value={m.name}>{m.name}</option>
          ))}
        </select>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-[#16181e] border border-white/[0.04] rounded-lg p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-emerald-500/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[16px] text-emerald-400">check_circle</span>
          </div>
          <div>
            <div className="text-lg font-bold text-emerald-400 leading-none tabular-nums">{upCount}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Successful</div>
          </div>
        </div>
        <div className="bg-[#16181e] border border-white/[0.04] rounded-lg p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-red-500/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[16px] text-red-400">cancel</span>
          </div>
          <div>
            <div className="text-lg font-bold text-red-400 leading-none tabular-nums">{downCount}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Failed</div>
          </div>
        </div>
        <div className="bg-[#16181e] border border-white/[0.04] rounded-lg p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-sky-500/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[16px] text-sky-400">speed</span>
          </div>
          <div>
            <div className="text-lg font-bold text-sky-400 leading-none tabular-nums">{avgLatency}<span className="text-[11px] text-slate-600 ml-0.5 font-normal">ms</span></div>
            <div className="text-[11px] text-slate-500 mt-0.5">Avg Latency</div>
          </div>
        </div>
      </div>

      {/* Quick Navigate */}
      {monitors.length > 0 && (
        <div className="mb-6">
          <div className="text-[11px] text-slate-600 font-medium mb-2">Quick Navigate</div>
          <div className="flex flex-wrap gap-1.5">
            {monitors.map((m: any) => (
              <button
                key={m.id}
                onClick={() => navigate(`/dashboard/${m.id}`)}
                className="px-2.5 py-1 bg-[#16181e] border border-white/[0.04] hover:border-emerald-500/20 hover:text-emerald-400 text-slate-500 rounded-md text-[11px] font-medium transition-all duration-150"
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Table Card */}
      <div className="bg-[#16181e] border border-white/[0.04] rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="px-5 py-3 border-b border-white/[0.04] bg-white/[0.01] flex items-center justify-between">
          <span className="text-[13px] font-semibold text-white">
            Ping History
          </span>
          <div className="flex items-center gap-2 text-[11px] text-slate-600">
            <span className="tabular-nums">Page {pageNumber}</span>
            {hasMore && <span className="w-1 h-1 rounded-full bg-emerald-500" />}
          </div>
        </div>

        {/* Table Body */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <div className="w-5 h-5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-3" />
            <p className="text-[13px]">Loading logs...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16 text-red-400 text-[13px] font-medium">{error}</div>
        ) : filteredChecks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            {monitors.length === 0 ? (
              <>
                <div className="w-12 h-12 rounded-lg bg-white/[0.03] flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-2xl text-slate-700">sensors_off</span>
                </div>
                <p className="text-[13px] text-slate-400 font-medium">No Monitors Active</p>
                <p className="text-[12px] text-slate-600 mt-0.5">Add a monitor to start seeing logs.</p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-lg bg-white/[0.03] flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-2xl text-slate-700">receipt_long</span>
                </div>
                <p className="text-[13px] text-slate-400 font-medium">No logs yet</p>
                <p className="text-[12px] text-slate-600 mt-0.5">Ping records will appear once monitoring begins.</p>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  <th className="px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Time</th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Monitor</th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider w-24">Status</th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell w-20">HTTP</th>
                  <th className="px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell w-32 text-right">Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {filteredChecks.map((c: any) => (
                  <tr key={c.id} className="hover:bg-white/[0.015] transition-colors duration-100 group">
                    <td className="px-5 py-3">
                      <span className="text-[12px] text-slate-400 tabular-nums font-mono">{formatDate(c.checked_at)}</span>
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => navigate(`/dashboard/${c.monitor_id}`)}
                        className="text-[13px] font-semibold text-white hover:text-emerald-400 transition-colors duration-150"
                      >
                        {c.monitor_name}
                      </button>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${c.status === 'up' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                        <span className={`text-[11px] font-semibold uppercase ${c.status === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {c.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      <span className={`text-[12px] font-semibold tabular-nums ${
                        c.status_code >= 200 && c.status_code < 300 ? 'text-emerald-400' :
                        c.status_code >= 400 ? 'text-red-400' : 'text-slate-500'
                      }`}>{c.status_code || '-'}</span>
                    </td>
                    <td className="px-5 py-3 hidden lg:table-cell text-right">
                      {c.response_time ? (
                        <span className={`text-[12px] font-semibold tabular-nums ${
                          c.response_time < 300 ? 'text-emerald-400' :
                          c.response_time < 800 ? 'text-amber-400' : 'text-red-400'
                        }`}>{c.response_time}ms</span>
                      ) : (
                        <span className="text-slate-600 text-[12px]">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && !error && (checks.length > 0 || pageNumber > 1) && (
          <div className="px-5 py-3 border-t border-white/[0.04] flex items-center justify-between bg-white/[0.01]">
            <div className="flex items-center gap-1.5">
              <button
                onClick={goToFirst}
                disabled={pageNumber === 1}
                className="p-1.5 rounded-md text-slate-500 hover:text-white hover:bg-white/[0.04] disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                title="First page"
              >
                <span className="material-symbols-outlined text-[18px]">first_page</span>
              </button>
              <button
                onClick={goToPrev}
                disabled={pageNumber === 1}
                className="p-1.5 rounded-md text-slate-500 hover:text-white hover:bg-white/[0.04] disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                title="Previous page"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
            </div>

            <span className="text-[12px] text-slate-500 tabular-nums">
              Page {pageNumber}
            </span>

            <button
              onClick={goToNext}
              disabled={!hasMore}
              className="p-1.5 rounded-md text-slate-500 hover:text-white hover:bg-white/[0.04] disabled:opacity-20 disabled:cursor-not-allowed transition-all"
              title="Next page"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
