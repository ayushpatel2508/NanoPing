import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';

export default function Landing() {
  const navigate = useNavigate();
  const [visibleLines, setVisibleLines] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          let currentLine = 0;
          setVisibleLines(0);
          interval = setInterval(() => {
            currentLine++;
            setVisibleLines(currentLine);
            if (currentLine >= 8) clearInterval(interval);
          }, 600);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    const element = document.getElementById('terminal-mock');
    if (element) observer.observe(element);

    return () => {
      observer.disconnect();
      if (interval) clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0f1115] font-sans text-slate-300 selection:bg-emerald-500/30 selection:text-emerald-200 overflow-hidden">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-white/[0.03] backdrop-blur-xl border-b border-white/[0.05] py-4 shadow-2xl' : 'bg-transparent py-6'}`}>
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.5)] group-hover:shadow-[0_0_25px_rgba(16,185,129,0.8)] group-hover:scale-110 transition-all duration-300">
              <span className="material-symbols-outlined text-white text-lg font-bold">cell_tower</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">NanoPing</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-white transition-colors hover:-translate-y-0.5 duration-300 transform inline-block">How it Works</a>
            <a href="#solutions" className="hover:text-white transition-colors hover:-translate-y-0.5 duration-300 transform inline-block">Architecture</a>
            <a href="#pricing" className="hover:text-white transition-colors hover:-translate-y-0.5 duration-300 transform inline-block">Pricing</a>
          </div>

          <div className="flex items-center gap-6">
            {isAuthenticated ? (
              <Link to="/dashboard" className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 text-sm font-bold py-2 px-6 rounded-full transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:-translate-y-1">
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/signin" className="text-sm font-medium text-slate-300 hover:text-white transition-colors border border-slate-700/50 hover:bg-slate-800/50 px-5 py-2 rounded-full hover:shadow-lg">Sign In</Link>
                <Link to="/signup" className="hidden sm:inline-block bg-emerald-500 hover:bg-emerald-400 text-slate-900 text-sm font-bold py-2 px-6 rounded-full transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:-translate-y-1">
                  Deploy Node
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="container mx-auto px-6 pt-32 pb-16 text-center max-w-5xl relative z-10 animate-[fade-in_1.5s_ease-out]">
        <div className="inline-flex items-center gap-2 bg-[#1a1c23] border border-slate-800 rounded-full px-4 py-1.5 mb-10 shadow-lg hover:border-slate-600 transition-colors cursor-default">
          <div className="flex -space-x-2">
            <div className="w-5 h-5 rounded-full bg-orange-500 border border-[#1a1c23] animate-pulse"></div>
            <div className="w-5 h-5 rounded-full bg-blue-500 border border-[#1a1c23] animate-pulse" style={{ animationDelay: '200ms' }}></div>
            <div className="w-5 h-5 rounded-full bg-purple-500 border border-[#1a1c23] animate-pulse" style={{ animationDelay: '400ms' }}></div>
          </div>
          <span className="text-xs font-medium text-slate-400">Trusted by Indie Hackers & Operations Teams.</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight drop-shadow-2xl">
          Absolute Visibility. <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">Zero Downtime Surprises.</span>
        </h1>

        <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm text-slate-400 font-medium mb-12 opacity-90">
          <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Track nodes for <strong className="text-white">free</strong></span>
          <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Millisecond LATENCY accuracy</span>
          <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Automated Email alerts</span>
          <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Historical Analytics</span>
        </div>

        <Link to="/signup" className="inline-block bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-4 px-10 rounded-full text-lg transition-all shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:shadow-[0_0_50px_rgba(16,185,129,0.7)] hover:scale-105 group relative overflow-hidden">
          <span className="relative z-10">Launch your first tracker</span>
          <div className="absolute inset-0 h-full w-full opacity-0 group-hover:opacity-20 bg-white transition-opacity"></div>
        </Link>
      </header>

      {/* Dashboard Mockup Section */}
      <section className="container mx-auto px-6 pb-24 relative z-10">
        <div className="max-w-5xl mx-auto bg-[#13161b] rounded-2xl border border-slate-800/60 shadow-2xl overflow-hidden ring-1 ring-white/5 relative transform hover:scale-[1.01] transition-transform duration-700 ease-out group">
          {/* Mock Header */}
          <div className="flex items-center px-4 py-3 border-b border-slate-800/60 bg-[#16191f]">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-700 hover:bg-red-500 transition-colors"></div>
              <div className="w-3 h-3 rounded-full bg-slate-700 hover:bg-yellow-500 transition-colors"></div>
              <div className="w-3 h-3 rounded-full bg-slate-700 hover:bg-green-500 transition-colors"></div>
            </div>
            <div className="mx-auto text-xs font-mono text-slate-500 bg-[#0f1115] px-12 py-1 rounded-md border border-slate-800 group-hover:text-emerald-400/70 transition-colors">app.nanoping.com/dashboard</div>
          </div>
          {/* Mock Content */}
          <div className="p-8 flex flex-col md:flex-row gap-8 bg-gradient-to-b from-[#13161b] to-[#0a0c0f]">
            {/* Sidebar Mock */}
            <div className="hidden md:flex flex-col gap-4 w-48 shrink-0">
              <div className="flex items-center gap-3 text-emerald-400 text-sm font-medium bg-emerald-500/10 px-3 py-2 rounded-lg cursor-pointer hover:bg-emerald-500/20 transition-colors"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Live Network</div>
              <div className="flex items-center gap-3 text-slate-500 text-sm px-3 py-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"><span className="w-2 h-2 rounded-full bg-slate-700"></span> Incident Logs</div>
              <div className="flex items-center gap-3 text-slate-500 text-sm px-3 py-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"><span className="w-2 h-2 rounded-full bg-slate-700"></span> Uptime History</div>
              <div className="flex items-center gap-3 text-slate-500 text-sm px-3 py-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"><span className="w-2 h-2 rounded-full bg-slate-700"></span> Configuration</div>
            </div>
            {/* Main Mock area */}
            <div className="flex-1 space-y-6">
              <div className="flex items-center gap-4 border-b border-slate-800 pb-6 group/item cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 group-hover/item:scale-110 group-hover/item:bg-emerald-500/30 transition-all duration-300">
                  <span className="material-symbols-outlined text-emerald-400">api</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight group-hover/item:text-emerald-400 transition-colors">Backend Payment API</h3>
                  <p className="text-xs text-slate-500">Cron executing via Redis Queue • every 60s</p>
                </div>
                <div className="ml-auto text-right">
                  <div className="text-3xl font-black text-emerald-400 tracking-tighter">99.98%</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest">Global Uptime</div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#1a1c23] p-4 rounded-xl border border-slate-800/50 hover:bg-[#20222a] hover:-translate-y-1 transition-all duration-300 cursor-default shadow-lg">
                  <div className="text-xs text-slate-500 mb-1">Node Status</div>
                  <div className="text-emerald-400 font-medium flex items-center gap-2"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span> Healthy</div>
                </div>
                <div className="bg-[#1a1c23] p-4 rounded-xl border border-slate-800/50 hover:bg-[#20222a] hover:-translate-y-1 transition-all duration-300 cursor-default shadow-lg">
                  <div className="text-xs text-slate-500 mb-1">Time Since Check</div>
                  <div className="text-white font-medium">8 seconds ago</div>
                </div>
                <div className="bg-[#1a1c23] p-4 rounded-xl border border-slate-800/50 hover:bg-[#20222a] hover:-translate-y-1 transition-all duration-300 cursor-default shadow-lg">
                  <div className="text-xs text-slate-500 mb-1">Response Latency</div>
                  <div className="text-white font-medium">112ms</div>
                </div>
                <div className="bg-[#1a1c23] p-4 rounded-xl border border-slate-800/50 hover:bg-[#20222a] hover:-translate-y-1 transition-all duration-300 cursor-default shadow-lg group-hover:border-slate-700">
                  <div className="text-xs text-slate-500 mb-1">Tracked Outages</div>
                  <div className="text-white font-medium">0 this week</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Background glow effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-[50%] -translate-y-1/2 w-[800px] h-[400px] bg-emerald-500/10 blur-[150px] rounded-full pointer-events-none -z-10 animate-[pulse_6s_infinite]"></div>
      </section>

      {/* Extended Features Section (New) */}
      <section className="bg-[#0f1115] py-24 relative z-10 border-t border-slate-800/30">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-white mb-4">Architected for Speed and Reliability</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">We don't just rely on simple pings. Our infrastructure actively guarantees precision tracking through a decentralized worker army.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-[#13161b] border border-slate-800/60 hover:border-emerald-500/30 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] transition-all duration-500 group">
              <div className="w-12 h-12 rounded-xl bg-slate-800 group-hover:bg-emerald-500/20 flex items-center justify-center mb-6 transition-colors">
                <span className="material-symbols-outlined text-slate-400 group-hover:text-emerald-400">public</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">High-Precision Monitoring</h3>
              <p className="text-sm text-slate-400 leading-relaxed">NanoPing utilizes high-frequency background workers to track your endpoints with millisecond accuracy, ensuring you're the first to know when things slow down.</p>
            </div>

            <div className="p-8 rounded-2xl bg-[#13161b] border border-slate-800/60 hover:border-emerald-500/30 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] transition-all duration-500 group mt-0 md:mt-8">
              <div className="w-12 h-12 rounded-xl bg-slate-800 group-hover:bg-emerald-500/20 flex items-center justify-center mb-6 transition-colors">
                <span className="material-symbols-outlined text-slate-400 group-hover:text-emerald-400">lock</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Military-Grade Encryption</h3>
              <p className="text-sm text-slate-400 leading-relaxed">All telemetry data and webhook secrets are encrypted at rest using AES-256. Your credentials for integrated alerts never leave our fortified database.</p>
            </div>

            <div className="p-8 rounded-2xl bg-[#13161b] border border-slate-800/60 hover:border-emerald-500/30 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] transition-all duration-500 group mt-0 md:mt-16">
              <div className="w-12 h-12 rounded-xl bg-slate-800 group-hover:bg-emerald-500/20 flex items-center justify-center mb-6 transition-colors">
                <span className="material-symbols-outlined text-slate-400 group-hover:text-emerald-400">web</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Custom Status Pages</h3>
              <p className="text-sm text-slate-400 leading-relaxed">Convert our raw ping logs into a beautiful, customer-facing portal under your own domain. Keep your users in the loop automatically when APIs drop.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature & Terminal Section */}
      <section className="bg-[#0b0c10] border-y border-slate-800/50 py-32">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="flex flex-col lg:flex-row gap-16 items-center">

            {/* Left Content */}
            <div className="flex-1 space-y-8">
              <div className="inline-flex items-center gap-2 text-slate-400 text-sm font-semibold tracking-wider uppercase border border-slate-800 rounded-full px-4 py-1.5 bg-[#13161b] hover:bg-slate-800 transition-colors cursor-default">
                <span className="material-symbols-outlined text-sm">memory</span> Deep Telemetry
              </div>

              <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">Precision Metrics, <br />Native Escalation.</h2>
              <p className="text-lg text-slate-400 leading-relaxed max-w-lg">
                NanoPing isolates latency spikes and server crashes the moment they happen, piping rich outage context straight to your engineering chat rooms and email instantly.
              </p>

              <div className="space-y-6 pt-4">
                <div className="flex gap-4 group cursor-pointer hover:-translate-y-1 transition-transform">
                  <div className="w-6 h-6 rounded-full bg-slate-800 group-hover:bg-emerald-500/20 flex items-center justify-center shrink-0 mt-1 transition-colors">
                    <span className="material-symbols-outlined text-[14px] text-slate-400 group-hover:text-emerald-400 font-bold transition-colors">bolt</span>
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-1 group-hover:text-emerald-400 transition-colors">Automated Incident Logs</h4>
                    <p className="text-sm text-slate-400">Every failed ping creates irreversible incident history detailing exact HTTP status codes and millisecond response times.</p>
                  </div>
                </div>
                <div className="flex gap-4 group cursor-pointer hover:-translate-y-1 transition-transform">
                  <div className="w-6 h-6 rounded-full bg-slate-800 group-hover:bg-emerald-500/20 flex items-center justify-center shrink-0 mt-1 transition-colors">
                    <span className="material-symbols-outlined text-[14px] text-slate-400 group-hover:text-emerald-400 font-bold transition-colors">bolt</span>
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-1 group-hover:text-emerald-400 transition-colors">Instant Flash Notifications</h4>
                    <p className="text-sm text-slate-400">Direct escalation to your inbox. Our background system dispatches automated email alerts the very millisecond a downtime incident is confirmed.</p>
                  </div>
                </div>
                <div className="flex gap-4 group cursor-pointer hover:-translate-y-1 transition-transform">
                  <div className="w-6 h-6 rounded-full bg-slate-800 group-hover:bg-emerald-500/20 flex items-center justify-center shrink-0 mt-1 transition-colors">
                    <span className="material-symbols-outlined text-[14px] text-slate-400 group-hover:text-emerald-400 font-bold transition-colors">bolt</span>
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-1 group-hover:text-emerald-400 transition-colors">Historical Root Cause</h4>
                    <p className="text-sm text-slate-400">Maintain 30-day aggregated statistical analysis to quickly pinpoint chronic infrastructure bottlenecks.</p>
                  </div>
                </div>
              </div>

              {/* <div className="flex gap-4 pt-6">
                <button className="bg-white hover:bg-slate-200 text-slate-900 font-bold py-3 px-6 rounded-lg transition-transform hover:scale-105 text-sm">View Demo Logs</button>
                <button className="bg-[#1a1c23] hover:bg-[#252830] text-white border border-slate-800 font-bold py-3 px-6 rounded-lg transition-transform hover:scale-105 text-sm">Review Capabilities</button>
              </div> */}
            </div>

            {/* Right Content : Terminal Mock */}
            <div className="flex-1 w-full max-w-xl">
              <div className="bg-[#13161b] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden font-mono text-xs sm:text-sm hover:border-slate-600 transition-colors duration-500">
                <div className="border-b border-slate-800 bg-[#16191f] px-4 py-3 flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-slate-300 font-sans font-medium text-sm">BullMQ Worker Analytics</span>
                </div>
                <div id="terminal-mock" className="p-6 space-y-4 min-h-[340px]">
                  <style>{`
                    @keyframes typeLine {
                      0% { clip-path: inset(0 100% 0 0); opacity: 0; }
                      1% { clip-path: inset(0 100% 0 0); opacity: 1; }
                      100% { clip-path: inset(0 0 0 0); opacity: 1; }
                    }
                    .animate-type-line {
                      clip-path: inset(0 100% 0 0);
                      animation: typeLine 0.5s steps(40, end) forwards;
                    }
                  `}</style>
                  {visibleLines >= 1 && (
                    <div className="flex gap-4 hover:translate-x-1 transition-transform w-fit self-start animate-type-line"><span className="text-slate-500 shrink-0">23:59:00</span> <span className="text-emerald-400">[NODE_1] GET /api/health → 200 OK (45ms)</span></div>
                  )}
                  {visibleLines >= 2 && (
                    <div className="flex gap-4 hover:translate-x-1 transition-transform w-fit self-start animate-type-line"><span className="text-slate-500 shrink-0">00:00:00</span> <span className="text-red-500 font-bold">[NODE_1] GET /api/health → CONNECTION_REFUSED</span></div>
                  )}
                  {visibleLines >= 3 && (
                    <div className="flex gap-4 hover:translate-x-1 transition-transform w-fit self-start animate-type-line"><span className="text-slate-500 shrink-0">00:00:02</span> <span className="text-white">Escalating verification to secondary region...</span></div>
                  )}
                  {visibleLines >= 4 && (
                    <div className="flex gap-4 hover:translate-x-1 transition-transform w-fit self-start animate-type-line"><span className="text-slate-500 shrink-0">00:00:05</span> <span className="text-red-500">[NODE_2] GET /api/health → ERR_TIMEOUT (5000ms)</span></div>
                  )}
                  {visibleLines >= 5 && (
                    <div className="flex gap-4 hover:translate-x-1 transition-transform w-fit self-start animate-type-line"><span className="text-slate-500 shrink-0">00:00:05</span> <span className="text-red-500 font-bold block animate-[pulse_1s_infinite]">Critical Outage Confirmed</span></div>
                  )}
                  {visibleLines >= 6 && (
                    <div className="flex gap-4 hover:translate-x-1 transition-transform w-fit self-start animate-type-line"><span className="text-slate-500 shrink-0">00:00:06</span> <span className="text-white">Updating incident schema \`is_resolved: false\`</span></div>
                  )}
                  {visibleLines >= 7 && (
                    <div className="flex gap-4 hover:translate-x-1 transition-transform w-fit self-start animate-type-line"><span className="text-slate-500 shrink-0">00:00:06</span> <span className="text-slate-300">Dispatching SMTP broadcast to administration</span></div>
                  )}
                  {visibleLines >= 8 && (
                    <div className="flex gap-4 hover:translate-x-1 transition-transform w-fit self-start animate-type-line"><span className="text-slate-500 shrink-0">00:00:07</span> <span className="text-slate-300">Firing Webhook payload to <span className="text-yellow-400">#devops</span> Slack</span></div>
                  )}
                  {/* Blinking cursor effect */}
                  {visibleLines < 8 && (
                    <div className="flex gap-4 w-fit self-start"><span className="w-2.5 h-4 bg-emerald-500 block animate-[pulse_1s_infinite] translate-y-1"></span></div>
                  )}
                </div>
              </div>

              {/* Integrations Grid underneath Terminal */}
              <div className="mt-6 bg-[#13161b] border border-slate-800 rounded-2xl p-6 hover:shadow-[0_0_20px_rgba(16,185,129,0.05)] transition-shadow duration-500">
                <h4 className="text-white font-bold mb-4 font-sans">Supported Integrations</h4>
                <div className="flex flex-wrap gap-3">
                  {['Slack', 'Discord', 'Custom Webhooks', 'Email/SMTP', 'Redis', 'PostgreSQL', 'BullMQ Queue'].map((tool) => (
                    <span key={tool} className="text-xs text-slate-400 bg-[#1a1c23] border border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-400 px-3 py-1.5 rounded-md font-sans font-medium transition-colors cursor-default tracking-wide">{tool}</span>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Pre-Footer Call To Action Section */}
      <section className="bg-gradient-to-b from-[#0b0c10] to-[#0f1115] py-24 text-center">
        <div className="container mx-auto px-6 max-w-4xl">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">
            Start monitoring in <span className="text-emerald-500">30 seconds.</span>
          </h2>
          <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto">
            There’s nothing to install. No credit card required. 50 monitors for free. Get total peace of mind today.
          </p>
          <Link to="/signup" className="inline-block bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-4 px-12 rounded-full text-lg transition-transform hover:scale-110 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
            Get started free
          </Link>
        </div>
      </section>

      {/* Main Multi-Column Footer */}
      <footer className="bg-[#111318] text-slate-500 py-20 border-t border-slate-800/80">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-12 mb-16">

            {/* Brand Column */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4 group cursor-pointer inline-flex">
                <div className="w-7 h-7 rounded-sm bg-emerald-500 flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                  <span className="material-symbols-outlined text-slate-900 text-[14px] font-bold">cell_tower</span>
                </div>
                <span className="text-lg font-bold text-white tracking-tight">NanoPing</span>
              </div>
              <p className="text-sm text-slate-400 mb-6">Downtime happens.<br />Get notified practically instantly.</p>
              <div className="flex gap-4">
                {/* Mock Social Icons */}
                <a href="#" className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-emerald-500 hover:text-slate-900 transition-colors">f</a>
                <a href="#" className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-emerald-500 hover:text-slate-900 transition-colors">X</a>
                <a href="#" className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-emerald-500 hover:text-slate-900 transition-colors">in</a>
              </div>
            </div>

            {/* Links Column 1 */}
            <div>
              <h4 className="text-white font-bold mb-6 tracking-wide">Monitoring</h4>
              <ul className="space-y-4 text-sm font-medium">
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Website endpoint monitoring</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Keyword monitoring</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Ping monitoring</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Port monitoring</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Cron job monitoring</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Status pages</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Incident management</a></li>
              </ul>
            </div>

            {/* Links Column 2 */}
            <div>
              <h4 className="text-white font-bold mb-6 tracking-wide">Product</h4>
              <ul className="space-y-4 text-sm font-medium">
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">API Documentation</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Maintenance Windows</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Roadmap</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">System Status</a></li>
              </ul>
            </div>

            {/* Links Column 3 */}
            <div>
              <h4 className="text-white font-bold mb-6 tracking-wide">Company</h4>
              <ul className="space-y-4 text-sm font-medium">
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Contact us</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Affiliate program</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Our Clients</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Non profits discount</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Terms / Privacy</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Security & Compliance</a></li>
              </ul>
            </div>

            {/* Links Column 4 */}
            <div>
              <h4 className="text-white font-bold mb-6 tracking-wide">Comparison</h4>
              <ul className="space-y-4 text-sm font-medium">
                <li><a href="#" className="hover:text-emerald-400 transition-colors">vs. Statuspage</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">vs. BetterStack</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">vs. Datadog</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">vs. Pingdom</a></li>
              </ul>
            </div>

          </div>

          <div className="border-t border-slate-800/80 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium">
            <p>© 2026 NanoPing Inc. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
