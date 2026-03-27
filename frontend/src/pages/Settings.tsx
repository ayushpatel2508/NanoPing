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
      await checkAuth(); // Refresh user in store
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

  return (
    <div className="flex h-screen bg-[#13151b] font-sans text-slate-200 overflow-hidden">
      {/* SIDEBAR */}
      <aside className="hidden md:flex w-64 bg-[#1a1c23] border-r border-white/[0.06] flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-white/[0.06]">
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)]">
              <span className="material-symbols-outlined text-white text-lg font-bold">cell_tower</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">NanoPing</span>
          </Link>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-3">Settings</div>
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'profile'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/10 shadow-sm'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">person</span>
            Profile Management
          </button>
          <button
            onClick={() => setActiveTab('monitors')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'monitors'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/10 shadow-sm'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">monitor_heart</span>
            Monitor Configuration
          </button>
        </div>

        <div className="p-4 border-t border-white/[0.06]">
          <button
            onClick={() => { logout(); navigate('/'); }}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all font-bold"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Sign Out
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full flex items-center gap-2 px-3 py-2.5 mt-2 rounded-lg text-sm text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/5 transition-all font-bold"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Dashboard
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* HEADER */}
        <header className="h-16 bg-[#13151b] border-b border-white/[0.06] flex items-center justify-between px-5 lg:px-8 shrink-0">
          <button
            onClick={() => navigate('/dashboard')}
            className="md:hidden flex items-center gap-1.5 text-[12px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-4 py-2 rounded-lg border border-emerald-500/20 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Dashboard
          </button>
          <div className="hidden md:flex items-center gap-2 text-[12px] text-slate-500 uppercase font-bold tracking-widest">
            <span>Account</span>
            <span className="text-slate-700">/</span>
            <span className="text-white">{activeTab === 'profile' ? 'Profile Management' : 'Monitor Configuration'}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-3 bg-white/5 rounded-full pl-1 pr-4 py-1 border border-white/10">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm border border-emerald-500/30">
                {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="text-sm text-slate-300 font-medium hidden sm:block">
                {user?.name || user?.email}
              </span>
            </span>
          </div>
        </header>

        {/* SCROLLABLE VIEW */}
        <div className="flex-1 overflow-y-auto p-5 lg:p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            
            <div className="bg-[#1a1c23] border border-white/[0.06] rounded-3xl p-8 lg:p-10 shadow-xl">
              {activeTab === 'profile' && (
                <div className="animate-in fade-in duration-300 space-y-12">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">Public Profile</h3>
                    <p className="text-sm text-slate-400 mb-6">Manage your account details and how your name is displayed.</p>
                    <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
                      <div>
                        <label className="block text-sm font-bold text-slate-400 mb-1.5">Email Address</label>
                        <input type="email" value={user?.email || ''} disabled className="w-full bg-[#13151b] border border-white/10 rounded-xl px-4 py-3 text-slate-500 cursor-not-allowed focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-400 mb-1.5">Full Name</label>
                        <input 
                          type="text" 
                          value={name} 
                          onChange={e => setName(e.target.value)} 
                          required minLength={2}
                          className="w-full bg-[#13151b] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all shadow-sm" 
                        />
                      </div>
                      {profileMsg.text && (
                        <div className={`p-3 rounded-lg text-sm border ${profileMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                          {profileMsg.text}
                        </div>
                      )}
                      <button disabled={profileLoading} className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-900 font-bold py-2.5 px-6 rounded-xl transition-all shadow-sm">
                        {profileLoading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </form>
                  </div>

                  <div className="h-px w-full bg-white/[0.06]"></div>

                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Change Password</h3>
                    <p className="text-sm text-slate-400 mb-6">Update your password to keep your account secure.</p>
                    <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                      <div>
                        <label className="block text-sm font-bold text-slate-400 mb-1.5">Current Password</label>
                        <input 
                          type="password" 
                          value={currentPassword} 
                          onChange={e => setCurrentPassword(e.target.value)}
                          required 
                          className="w-full bg-[#13151b] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all shadow-sm" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-400 mb-1.5">New Password</label>
                        <input 
                          type="password" 
                          value={newPassword} 
                          onChange={e => setNewPassword(e.target.value)}
                          required minLength={8}
                          className="w-full bg-[#13151b] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all shadow-sm" 
                        />
                      </div>
                      {passwordMsg.text && (
                        <div className={`p-3 rounded-lg text-sm border ${passwordMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                          {passwordMsg.text}
                        </div>
                      )}
                      <button disabled={passwordLoading} className="bg-[#13151b] hover:bg-white/5 border border-white/10 disabled:opacity-50 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-sm">
                        {passwordLoading ? 'Updating...' : 'Update Password'}
                      </button>
                    </form>
                  </div>

                  <div className="h-px w-full bg-white/[0.06]"></div>

                  <div>
                    <h3 className="text-xl font-bold text-red-500 mb-2">Danger Zone</h3>
                    <p className="text-sm text-slate-400 mb-6">Permanently delete your account and all associated monitor data. This cannot be undone.</p>
                    <form onSubmit={handleDeleteAccount} className="space-y-4 max-w-md bg-red-500/5 border border-red-500/20 p-6 rounded-2xl">
                      <div>
                        <label className="block text-sm font-bold text-red-400 mb-1.5">Confirm Password to Delete</label>
                        <input 
                          type="password" 
                          value={deletePassword} 
                          onChange={e => setDeletePassword(e.target.value)}
                          required 
                          placeholder="Enter your password..."
                          className="w-full bg-[#13151b] border border-red-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all shadow-sm" 
                        />
                      </div>
                      {deleteMsg.text && (
                        <div className="p-3 rounded-lg text-sm bg-red-500/10 text-red-400 border border-red-500/20">
                          {deleteMsg.text}
                        </div>
                      )}
                      <button disabled={deleteLoading} className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-sm">
                        {deleteLoading ? 'Deleting...' : 'Delete Account Forever'}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {activeTab === 'monitors' && (
                <div className="animate-in fade-in duration-300">
                  <h3 className="text-2xl font-bold text-white mb-2">Monitor Configuration</h3>
                  <p className="text-sm text-slate-400 mb-8">Edit the endpoints, check intervals, and alert thresholds for your monitors.</p>
                  
                  {monitorsLoading ? (
                    <div className="text-center py-10 text-slate-500">Loading monitors...</div>
                  ) : monitors.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 bg-[#13151b] rounded-2xl border border-white/5">
                      No monitors found.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {monitors.map(m => (
                        <div key={m.id} className="bg-[#13151b] border border-white/[0.06] rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-white/10 transition-colors shadow-sm cursor-default">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-white text-lg truncate mb-1">{m.name}</h4>
                            <p className="text-sm text-slate-400 truncate font-mono bg-white/5 inline-block px-2 py-0.5 rounded-md mb-3 border border-white/5">{m.url}</p>
                            <div className="flex items-center gap-4">
                              <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                <span className="material-symbols-outlined text-[14px]">schedule</span> 
                                Interval: {m.check_interval}m
                              </span>
                              <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                <span className="material-symbols-outlined text-[14px]">warning</span> 
                                Threshold: {m.alert_threshold} fails
                              </span>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleEditMonitorClick(m)}
                            className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 font-bold px-5 py-2.5 rounded-xl transition-all shrink-0 flex items-center gap-2"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                            Edit Configuration
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      </main>

      {/* Edit Monitor Modal */}
      {editingMonitor && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1c23] border border-slate-700 w-full max-w-lg rounded-2xl p-6 lg:p-8 shadow-2xl relative">
            <button onClick={() => setEditingMonitor(null)} className="absolute top-6 right-6 text-slate-400 hover:text-white">
              <span className="material-symbols-outlined">close</span>
            </button>
            <h2 className="text-2xl font-bold text-white mb-6">Edit Monitor</h2>
            <form onSubmit={handleUpdateMonitor} className="space-y-5">
              <div>
                 <label className="block text-sm font-medium text-slate-300 mb-2">Friendly Name</label>
                 <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} required className="w-full bg-[#0f1115] border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all" />
              </div>
              <div>
                 <label className="block text-sm font-medium text-slate-300 mb-2">Target URL</label>
                 <input type="url" value={editForm.url} onChange={e => setEditForm({...editForm, url: e.target.value})} required className="w-full bg-[#0f1115] border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all font-mono text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-5">
                 <div>
                   <label className="block text-sm font-medium text-slate-300 mb-2">Check Interval (min)</label>
                 <input type="number" min="1" max="60" value={editForm.check_interval} onChange={e => setEditForm({...editForm, check_interval: parseInt(e.target.value)})} required className="w-full bg-[#0f1115] border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all" />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-slate-300 mb-2">Alert Threshold</label>
                 <input type="number" min="1" max="10" value={editForm.alert_threshold} onChange={e => setEditForm({...editForm, alert_threshold: parseInt(e.target.value)})} required className="w-full bg-[#0f1115] border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all" />
                 </div>
              </div>
              {editMsg.text && (
                 <div className={`p-3 rounded-lg text-sm border ${editMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                   {editMsg.text}
                 </div>
               )}
              <div className="pt-2">
                 <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-3.5 px-6 rounded-xl transition-all">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
