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
    { name: 'Monitors', path: '/dashboard', icon: 'monitor_heart' },
    { name: 'Incidents', path: '/dashboard/incidents', icon: 'warning' },
    { name: 'History', path: '/dashboard/history', icon: 'insights' },
    { name: 'Status', path: '/dashboard/status-pages', icon: 'sensors' },
    { name: 'Logs', path: '/dashboard/logs', icon: 'receipt_long' },
  ];

  return (
    <div className="flex h-screen bg-[#13151b] font-sans text-slate-200">
      
      {/* Sidebar */}
      <aside className="w-56 bg-[#16181e] border-r border-white/[0.04] flex flex-col justify-between shrink-0">
        
        <div>
          {/* Brand */}
          <div className="h-14 flex items-center px-5 border-b border-white/[0.04]">
            <Link to="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-7 h-7 rounded-md bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-[15px]">cell_tower</span>
              </div>
              <span className="text-[15px] font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors duration-150">NanoPing</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 py-4 space-y-0.5">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path || (link.path !== '/dashboard' && location.pathname.startsWith(link.path));
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/15'
                      : 'text-slate-500 hover:bg-white/[0.03] hover:text-slate-300'
                  }`}
                >
                  <span className="material-symbols-outlined text-[17px]">{link.icon}</span>
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Profile Area */}
        <div className="p-3 border-t border-white/[0.04]">
          <Link
            to="/settings"
            className="flex items-center gap-2.5 p-2 rounded-md hover:bg-white/[0.03] transition-all duration-150 group"
          >
            <div className="w-7 h-7 rounded-md bg-slate-800 text-white flex items-center justify-center font-semibold text-[11px] group-hover:bg-slate-700 transition-colors">
              {getInitials(user?.name || '')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-600 truncate">{user?.email}</p>
            </div>
            <span className="material-symbols-outlined text-[16px] text-slate-700 group-hover:text-slate-400 transition-colors">settings</span>
          </Link>
        </div>

      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <Outlet />
      </main>

    </div>
  );
}
