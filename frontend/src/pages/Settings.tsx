import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { userApi } from '../api/user';
import { monitorApi } from '../api/monitors';

export default function Settings() {
  const { user, logout, checkAuth } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'profile' | 'monitors'>('profile');

  // Profile Form
  const [name, setName] = useState(user?.name || '');
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [profileLoading, setProfileLoading] = useState(false);

  // Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Delete Account Form
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteMsg, setDeleteMsg] = useState({ type: '', text: '' });
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Monitors
  const [monitors, setMonitors] = useState<any[]>([]);
  const [monitorsLoading, setMonitorsLoading] = useState(true);
  const [editingMonitor, setEditingMonitor] = useState<any>(null);
  const [editForm, setEditForm] = useState({ name: '', url: '', check_interval: 5, alert_threshold: 3 });
  const [editMsg, setEditMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    if (activeTab === 'monitors') {
      fetchMonitors();
    }
  }, [activeTab]);

  const fetchMonitors = async () => {
    setMonitorsLoading(true);
    try {
      const res = await monitorApi.getMonitors();
      if (res.status === 'success') {
        setMonitors(res.data.monitors);
      }
    } catch (err) {}
    setMonitorsLoading(false);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg({ type: '', text: '' });
    try {
      await userApi.updateProfile({ name });
      await checkAuth();
      setProfileMsg({ type: 'success', text: 'Profile updated successfully' });
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update profile' });
    }
    setProfileLoading(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordMsg({ type: '', text: '' });
    try {
      await userApi.changePassword({ currentPassword, newPassword });
      setPasswordMsg({ type: 'success', text: 'Password changed successfully' });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.response?.data?.message || 'Failed to change password' });
    }
    setPasswordLoading(false);
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm('Are you absolutely sure you want to delete your account? This action is irreversible.')) return;
    setDeleteLoading(true);
    setDeleteMsg({ type: '', text: '' });
    try {
      await userApi.deleteAccount({ password: deletePassword });
      await logout();
      navigate('/');
    } catch (err: any) {
      setDeleteMsg({ type: 'error', text: err.response?.data?.message || 'Failed to delete account' });
      setDeleteLoading(false);
    }
  };

  const handleEditMonitorClick = (m: any) => {
    setEditingMonitor(m);
    setEditForm({ name: m.name, url: m.url, check_interval: m.check_interval, alert_threshold: m.alert_threshold });
    setEditMsg({ type: '', text: '' });
  };

  const handleUpdateMonitor = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditMsg({ type: '', text: '' });
    try {
      await monitorApi.updateMonitor(editingMonitor.id, editForm);
      setEditMsg({ type: 'success', text: 'Monitor updated successfully' });
      fetchMonitors();
      setTimeout(() => setEditingMonitor(null), 1500);
    } catch (err: any) {
      setEditMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update monitor' });
    }
  };

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: 'person' },
    { id: 'monitors' as const, label: 'Monitors', icon: 'monitor_heart' },
  ];

  return (
    <div className="flex h-screen bg-[#13151b] font-sans text-slate-200 overflow-hidden">
      {/* SIDEBAR */}
      <aside className="hidden md:flex w-56 bg-[#16181e] border-r border-white/[0.04] flex-col shrink-0">
        <div className="h-14 flex items-center px-5 border-b border-white/[0.04]">
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[15px]">cell_tower</span>
            </div>
            <span className="text-[15px] font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">NanoPing</span>
          </Link>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          <div className="text-[10px] text-slate-600 font-medium mb-2 px-2">Settings</div>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-150 ${
                activeTab === tab.id
                  ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/15'
                  : 'text-slate-500 hover:bg-white/[0.03] hover:text-slate-300'
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-3 border-t border-white/[0.04] space-y-0.5">
          <button
            onClick={() => { logout(); navigate('/'); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] text-slate-500 hover:text-white hover:bg-white/[0.03] transition-all font-medium"
          >
            <span className="material-symbols-outlined text-[17px]">logout</span>
            Sign Out
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/5 transition-all font-medium"
          >
            <span className="material-symbols-outlined text-[17px]">arrow_back</span>
            Dashboard
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* HEADER */}
        <header className="h-14 bg-[#13151b] border-b border-white/[0.04] flex items-center justify-between px-5 lg:px-8 shrink-0">
          <button
            onClick={() => navigate('/dashboard')}
            className="md:hidden flex items-center gap-1.5 text-[12px] font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-3 py-1.5 rounded-md border border-emerald-500/15 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Dashboard
          </button>
          <div className="hidden md:flex items-center gap-1.5 text-[12px] text-slate-500">
            <span>Account</span>
            <span className="text-slate-700">/</span>
            <span className="text-white font-medium">{activeTab === 'profile' ? 'Profile' : 'Monitor Configuration'}</span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 bg-white/[0.03] rounded-md px-3 py-1.5 border border-white/[0.04]">
              <div className="w-6 h-6 rounded-md bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-semibold text-[11px]">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="text-[13px] text-slate-300 hidden sm:block">{user?.name || user?.email}</span>
            </div>
          </div>
        </header>

        {/* SCROLLABLE VIEW */}
        <div className="flex-1 overflow-y-auto p-5 lg:p-8">
          <div className="w-full">
            
            {activeTab === 'profile' && (
              <div className="space-y-6">
                {/* Profile Section */}
                <div className="bg-[#16181e] border border-white/[0.04] rounded-lg p-6">
                  <h3 className="text-[15px] font-bold text-white mb-1">Profile Information</h3>
                  <p className="text-[12px] text-slate-500 mb-5">Update your display name and account details.</p>
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div>
                      <label className="text-[12px] text-slate-400 font-medium block mb-1.5">Email</label>
                      <input type="email" value={user?.email || ''} disabled className="w-full bg-[#0f1115] border border-white/[0.04] rounded-md px-4 py-2.5 text-slate-600 text-[13px] cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="text-[12px] text-slate-400 font-medium block mb-1.5">Display Name</label>
                      <input 
                        type="text" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        required minLength={2}
                        className="w-full bg-[#0f1115] border border-white/[0.06] rounded-md px-4 py-2.5 text-white text-[13px] focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition-all" 
                      />
                    </div>
                    {profileMsg.text && (
                      <div className={`p-2.5 rounded-md text-[12px] ${profileMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20' : 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20'}`}>
                        {profileMsg.text}
                      </div>
                    )}
                    <button disabled={profileLoading} className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-[#0a0a0a] font-semibold py-2 px-5 rounded-md text-[13px] transition-all active:scale-[0.97]">
                      {profileLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </form>
                </div>

                {/* Password Section */}
                <div className="bg-[#16181e] border border-white/[0.04] rounded-lg p-6">
                  <h3 className="text-[15px] font-bold text-white mb-1">Change Password</h3>
                  <p className="text-[12px] text-slate-500 mb-5">Update your password to keep your account secure.</p>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                      <label className="text-[12px] text-slate-400 font-medium block mb-1.5">Current Password</label>
                      <input 
                        type="password" 
                        value={currentPassword} 
                        onChange={e => setCurrentPassword(e.target.value)}
                        required 
                        className="w-full bg-[#0f1115] border border-white/[0.06] rounded-md px-4 py-2.5 text-white text-[13px] focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition-all" 
                      />
                    </div>
                    <div>
                      <label className="text-[12px] text-slate-400 font-medium block mb-1.5">New Password</label>
                      <input 
                        type="password" 
                        value={newPassword} 
                        onChange={e => setNewPassword(e.target.value)}
                        required minLength={8}
                        className="w-full bg-[#0f1115] border border-white/[0.06] rounded-md px-4 py-2.5 text-white text-[13px] focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition-all" 
                      />
                    </div>
                    {passwordMsg.text && (
                      <div className={`p-2.5 rounded-md text-[12px] ${passwordMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20' : 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20'}`}>
                        {passwordMsg.text}
                      </div>
                    )}
                    <button disabled={passwordLoading} className="bg-white/[0.04] hover:bg-white/[0.06] border border-white/[0.06] disabled:opacity-50 text-white font-medium py-2 px-5 rounded-md text-[13px] transition-all">
                      {passwordLoading ? 'Updating...' : 'Update Password'}
                    </button>
                  </form>
                </div>

                {/* Danger Zone */}
                <div className="bg-[#16181e] border border-red-500/10 rounded-lg p-6">
                  <h3 className="text-[15px] font-bold text-red-400 mb-1">Danger Zone</h3>
                  <p className="text-[12px] text-slate-500 mb-5">Permanently delete your account and all associated data. This cannot be undone.</p>
                  <form onSubmit={handleDeleteAccount} className="space-y-4">
                    <div>
                      <label className="text-[12px] text-red-400/70 font-medium block mb-1.5">Confirm Password</label>
                      <input 
                        type="password" 
                        value={deletePassword} 
                        onChange={e => setDeletePassword(e.target.value)}
                        required 
                        placeholder="Enter your password..."
                        className="w-full bg-[#0f1115] border border-red-500/15 rounded-md px-4 py-2.5 text-white text-[13px] focus:outline-none focus:border-red-500/40 transition-all placeholder:text-slate-700" 
                      />
                    </div>
                    {deleteMsg.text && (
                      <div className="p-2.5 rounded-md text-[12px] bg-red-500/10 text-red-400 ring-1 ring-red-500/20">
                        {deleteMsg.text}
                      </div>
                    )}
                    <button disabled={deleteLoading} className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-semibold py-2 px-5 rounded-md text-[13px] transition-all">
                      {deleteLoading ? 'Deleting...' : 'Delete Account'}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {activeTab === 'monitors' && (
              <div>
                <div className="mb-6">
                  <h3 className="text-[15px] font-bold text-white mb-1">Monitor Configuration</h3>
                  <p className="text-[12px] text-slate-500">Edit endpoints, check intervals, and alert thresholds.</p>
                </div>
                
                {monitorsLoading ? (
                  <div className="flex flex-col items-center py-16">
                    <div className="w-5 h-5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-3" />
                    <p className="text-[13px] text-slate-500">Loading monitors...</p>
                  </div>
                ) : monitors.length === 0 ? (
                  <div className="bg-[#16181e] border border-dashed border-white/[0.06] rounded-lg p-12 text-center">
                    <p className="text-[13px] text-slate-500">No monitors found.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {monitors.map(m => (
                      <div key={m.id} className="bg-[#16181e] border border-white/[0.04] rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-white/[0.06] transition-all duration-150">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[14px] font-semibold text-white mb-1">{m.name}</h4>
                          <p className="text-[11px] text-slate-600 font-mono truncate mb-2">{m.url}</p>
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] text-slate-500 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px]">schedule</span>
                              {m.check_interval}m interval
                            </span>
                            <span className="text-[11px] text-slate-500 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px]">warning</span>
                              {m.alert_threshold} fail threshold
                            </span>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleEditMonitorClick(m)}
                          className="px-4 py-2 text-[12px] font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/15 rounded-md transition-all duration-150 shrink-0 flex items-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-[15px]">edit</span>
                          Edit
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </main>

      {/* Edit Monitor Modal */}
      {editingMonitor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#16181e] border border-white/[0.06] w-full max-w-md rounded-lg p-6 shadow-2xl shadow-black/50 relative">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">Edit Monitor</h2>
              <button onClick={() => setEditingMonitor(null)} className="text-slate-500 hover:text-white transition-colors">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
            <form onSubmit={handleUpdateMonitor} className="space-y-4">
              <div>
                 <label className="text-[12px] text-slate-400 font-medium block mb-1.5">Site Name</label>
                 <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} required className="w-full bg-[#0f1115] border border-white/[0.06] rounded-md px-4 py-2.5 text-white text-[13px] focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition-all" />
              </div>
              <div>
                 <label className="text-[12px] text-slate-400 font-medium block mb-1.5">Target URL</label>
                 <input type="url" value={editForm.url} onChange={e => setEditForm({...editForm, url: e.target.value})} required className="w-full bg-[#0f1115] border border-white/[0.06] rounded-md px-4 py-2.5 text-white text-[13px] font-mono focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                 <div>
                   <label className="text-[12px] text-slate-400 font-medium block mb-1.5">Check Interval</label>
                   <div className="relative">
                     <input type="number" min="3" max="60" value={editForm.check_interval} onChange={e => setEditForm({...editForm, check_interval: parseInt(e.target.value)})} required className="w-full bg-[#0f1115] border border-white/[0.06] rounded-md px-4 py-2.5 text-white text-[13px] focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition-all" />
                     <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-600">min</span>
                   </div>
                 </div>
                 <div>
                   <label className="text-[12px] text-slate-400 font-medium block mb-1.5">Alert Threshold</label>
                   <div className="relative">
                     <input type="number" min="1" max="10" value={editForm.alert_threshold} onChange={e => setEditForm({...editForm, alert_threshold: parseInt(e.target.value)})} required className="w-full bg-[#0f1115] border border-white/[0.06] rounded-md px-4 py-2.5 text-white text-[13px] focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition-all" />
                     <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-600">fails</span>
                   </div>
                 </div>
              </div>
              {editMsg.text && (
                 <div className={`p-2.5 rounded-md text-[12px] ${editMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20' : 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20'}`}>
                   {editMsg.text}
                 </div>
               )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditingMonitor(null)} className="flex-1 border border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.03] py-2.5 rounded-md text-[13px] font-medium transition-all">Cancel</button>
                <button type="submit" className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-[#0a0a0a] font-semibold py-2.5 rounded-md text-[13px] transition-all active:scale-[0.97]">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
