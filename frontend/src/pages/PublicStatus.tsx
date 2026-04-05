import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

interface PublicMonitor {
  id: string;
  name: string;
  target: string;
  status: 'up' | 'down' | null;
  last_checked: string | null;
}

interface PublicStatusData {
  companyName: string;
  monitors: PublicMonitor[];
}

export default function PublicStatus() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<PublicStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/public/status/${id}`);
        const parsed = await res.json();
        
        if (parsed.status === 'success') {
          setData(parsed.data);
        } else {
          setError(parsed.message || 'Failed to load status page');
        }
      } catch (err) {
        setError('Network error loading status');
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    
    // Auto refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1115] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0f1115] flex items-center justify-center text-white">
        <div className="text-center">
          <span className="material-symbols-outlined text-4xl text-red-500 mb-4 block">error</span>
          <h1 className="text-2xl font-bold mb-2">Status Page Unavailable</h1>
          <p className="text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  const allOperational = data.monitors.every(m => m.status === 'up' || m.status === null);

  return (
    <div className="min-h-screen bg-[#0f1115] font-sans text-slate-300 selection:bg-emerald-500/30 selection:text-emerald-200 p-6 md:p-12">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-white text-xl">dns</span>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">{data.companyName}</h1>
              <p className="text-sm text-slate-400 font-medium tracking-wide border-b border-dashed border-slate-700 pb-1 w-fit">System Status</p>
            </div>
          </div>
          <a href="/" className="text-xs font-bold text-slate-500 hover:text-emerald-400 transition-colors uppercase tracking-widest self-start md:self-auto mt-2 md:mt-0">
            Powered by NanoPing
          </a>
        </div>

        {/* Global Status Banner */}
        <div className={`p-8 rounded-2xl border backdrop-blur-sm flex items-center gap-4 ${
          allOperational 
          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.1)]' 
          : 'bg-red-500/10 border-red-500/20 text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.1)]'
        }`}>
          <span className="material-symbols-outlined text-4xl">
            {allOperational ? 'check_circle' : 'warning'}
          </span>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-white mb-1">
              {allOperational ? 'All Systems Operational' : 'Partial Outage Detected'}
            </h2>
            <p className="text-sm opacity-80 font-medium">As of {new Date().toLocaleTimeString()}</p>
          </div>
        </div>

        {/* Services List */}
        <div className="bg-[#13161b] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
          <div className="px-6 py-4 border-b border-slate-800 bg-[#16191f]">
            <h3 className="font-bold text-white tracking-wide">Monitored Services</h3>
          </div>
          <div className="divide-y divide-slate-800/80">
            {data.monitors.map((monitor) => (
              <div key={monitor.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                <div>
                  <h4 className="text-lg font-bold text-white mb-1">{monitor.name}</h4>
                  <p className="text-sm font-mono text-slate-500">{monitor.target}</p>
                </div>
                
                <div className="flex items-center gap-3">
                  {monitor.status === 'up' && (
                    <span className="inline-flex items-center gap-1.5 text-emerald-400 text-sm font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Operational
                    </span>
                  )}
                  {monitor.status === 'down' && (
                    <span className="inline-flex items-center gap-1.5 text-red-400 text-sm font-bold bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> Offline
                    </span>
                  )}
                  {monitor.status === null && (
                    <span className="inline-flex items-center gap-1.5 text-amber-400 text-sm font-bold bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span> Pending
                    </span>
                  )}
                </div>
              </div>
            ))}
            
            {data.monitors.length === 0 && (
              <div className="p-12 text-center text-slate-500 font-medium">
                No active monitors configured for this public page.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
