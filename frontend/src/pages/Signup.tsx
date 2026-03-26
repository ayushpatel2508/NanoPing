import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    const success = await register({ name, email, password });
    if (success) {
      navigate('/signin');
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1115] font-sans text-slate-300 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-1/3 -right-20 w-80 h-80 bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-1/3 -left-20 w-80 h-80 bg-blue-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10 animate-[fade-in_0.8s_ease-out]">
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-3 group mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)] group-hover:scale-110 transition-transform duration-300">
              <span className="material-symbols-outlined text-white text-xl font-bold">cell_tower</span>
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">NanoPing</span>
          </Link>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">Create Account</h1>
          <p className="text-slate-400">Join the elite network of developers monitoring with NanoPing</p>
        </div>

        <div className="bg-[#13161b] rounded-2xl border border-slate-800/60 p-8 shadow-2xl backdrop-blur-sm relative group overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          
          {error && (
            <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2 ml-1" htmlFor="name">Full Name</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg">person</span>
                <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#0f1115] border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all appearance-none"
                  placeholder="John Doe" required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2 ml-1" htmlFor="email">Email Address</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg">alternate_email</span>
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0f1115] border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all appearance-none"
                  placeholder="name@company.com" required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2 ml-1" htmlFor="password">Password</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg">lock</span>
                <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0f1115] border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all appearance-none"
                  placeholder="At least 8 characters" required
                />
              </div>
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:-translate-y-0.5 mt-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating Account...' : 'Start Free Trial'}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-800/60 text-center">
            <p className="text-sm text-slate-500 font-medium">
              Already have an account? <Link to="/signin" className="text-emerald-500 hover:text-emerald-400 transition-colors font-bold ml-1">Sign In</Link>
            </p>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium bg-[#13161b] py-2 px-4 rounded-lg border border-slate-800/40">
            <span className="material-symbols-outlined text-emerald-500 text-[16px]">check_circle</span>
            No credit card required
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium bg-[#13161b] py-2 px-4 rounded-lg border border-slate-800/40">
            <span className="material-symbols-outlined text-emerald-500 text-[16px]">check_circle</span>
            Instant setup
          </div>
        </div>
      </div>
    </div>
  );
}
