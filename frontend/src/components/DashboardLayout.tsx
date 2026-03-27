import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export default function DashboardLayout() {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const split = name.split(' ');
    if (split.length > 1) return split[0][0] + split[1][0];
    return name[0].toUpperCase();
  };

  const navLinks = [
    { name: 'Monitoring', path: '/dashboard', icon: 'monitor_heart' },
    { name: 'Incidents', path: '/dashboard/incidents', icon: 'security' },
    { name: 'Uptime history', path: '/dashboard/history', icon: 'history' },
    { name: 'Status pages', path: '/dashboard/status-pages', icon: 'sensors' },
    { name: 'Logs', path: '/dashboard/logs', icon: 'receipt_long' },
  ];

  return (
    <div className="flex h-screen bg-[#13151b] font-sans text-slate-200">
      
      {/* Sidebar */}
      <aside className="w-64 bg-[#0f1115] border-r border-[#1e2028] flex flex-col justify-between shrink-0">
        
        <div>
          {/* Brand */}
          <div className="h-16 flex items-center px-6 border-b border-[#1e2028] mb-4">
            <Link to="/dashboard" className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                <span className="material-symbols-outlined text-white text-lg font-bold">cell_tower</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">NanoPing</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 space-y-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path || (link.path !== '/dashboard' && location.pathname.startsWith(link.path));
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#1a1c23] text-emerald-400 border border-emerald-500/10'
                      : 'text-slate-400 hover:bg-[#1a1c23] hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">{link.icon}</span>
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Profile Area */}
        <div className="p-4 border-t border-[#1e2028]">
          <Link
            to="/settings"
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#1a1c23] transition-colors border border-transparent hover:border-[#2a2d36] group"
          >
            <div className="w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-sm tracking-wider group-hover:bg-slate-700 transition-colors">
              {getInitials(user?.name || '')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
            <span className="material-symbols-outlined text-slate-500 group-hover:text-emerald-400 transition-colors">settings</span>
          </Link>
          
          <div className="mt-3">
            <Link to="/settings" className="block w-full text-center py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white rounded-lg text-sm font-bold tracking-wide transition-all shadow-[0_4px_12px_rgba(16,185,129,0.3)] hover:shadow-[0_4px_15px_rgba(16,185,129,0.4)] hover:-translate-y-0.5">
              Upgrade now
            </Link>
          </div>
        </div>

      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <Outlet />
      </main>

    </div>
  );
}
