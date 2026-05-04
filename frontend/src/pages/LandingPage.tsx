import React from 'react';
import { Music, Zap, Shield, Youtube, Disc, ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onLoginClick: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick }) => {
  return (
    <div className="min-h-screen bg-[#080a0c] text-white selection:bg-cyan-500/30 relative">
      {/* Global Background Grid (Dot Pattern) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dotGrid" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="2" fill="rgba(255, 255, 255, 0.5)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dotGrid)" />
        </svg>
      </div>

      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto border-b border-white/5 sticky top-0 bg-[#080a0c]/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-cyan-500 to-blue-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Music size={22} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Disperser Studio
          </span>
        </div>
        <button
          className="px-4 py-2 rounded-md border border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-300 flex items-center gap-2 text-sm font-medium transition-all hover:border-cyan-500/50"
          onClick={onLoginClick}
        >
          <Disc size={18} className="text-cyan-400" />
          Login with Discord
        </button>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-32 px-8 overflow-hidden">
        {/* Glows */}
        <div className="absolute top-0 left-1/4 -translate-x-1/2 w-full h-full max-w-4xl bg-cyan-600/10 blur-[120px] rounded-full -z-10" />
        <div className="absolute top-20 right-1/4 translate-x-1/2 w-full h-full max-w-4xl bg-blue-600/10 blur-[120px] rounded-full -z-10" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-8">
            <Zap size={14} />
            <span>Fast, Simple and Cheap</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
            The Ultimate <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent text-glow">Roblox Asset</span> <br /> Preparation Tool
          </h1>
          <p className="text-lg md:text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Import from YouTube, edit in-browser, and bulk-upload assets to Roblox effortlessly.
            Disperser Studio handles the friction so you can focus on creating.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-10 h-14 rounded-xl font-bold text-lg flex items-center gap-2 shadow-xl shadow-cyan-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              onClick={onLoginClick}
            >
              Get Started
              <ArrowRight size={20} />
            </button>
            <button
              className="border border-slate-800 bg-slate-900/50 hover:bg-slate-800 h-14 px-10 rounded-xl text-slate-300 font-bold transition-all hover:border-slate-700"
            >
              Join with Discord
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="px-8 py-32 border-t border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/[0.02] via-cyan-900/10 to-slate-900/[0.02] -z-10" />
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full -z-10" />
            <h2 className="text-4xl font-bold mb-4">Everything you need to ship assets</h2>
            <p className="text-slate-500 max-w-lg mx-auto">Built for Roblox creators, by developers who know the pain of asset management.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Youtube className="text-red-400" />,
                title: "Convert from Youtube",
                desc: "Import high-quality audio directly via URL. No more sketchy converters or quality loss."
              },
              {
                icon: <Zap className="text-cyan-400" />,
                title: "In-Browser Studio",
                desc: "Trim, adjust pitch, speed, and volume instantly with real-time waveform visualization."
              },
              {
                icon: <Shield className="text-blue-400" />,
                title: "Smart Queue",
                desc: "Monitor moderation status accurately. Never guess if your asset passed or got rejected."
              }
            ].map((f, i) => (
              <div key={i} className="p-10 rounded-[2rem] bg-slate-900/40 border border-white/5 hover:border-cyan-500/20 transition-all hover:translate-y-[-4px] group backdrop-blur-sm">
                <div className="w-14 h-14 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-8 group-hover:bg-cyan-500/10 transition-colors">
                  {f.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4">{f.title}</h3>
                <p className="text-slate-500 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-8 py-32 relative">
        <div className="max-w-5xl mx-auto rounded-[3rem] bg-gradient-to-br from-cyan-600/20 to-blue-700/20 border border-cyan-500/20 p-12 md:p-20 text-center relative overflow-hidden backdrop-blur-sm">
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full" />
          <h2 className="text-4xl md:text-5xl font-bold mb-8">Ready to speed up your workflow?</h2>
          <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">Join hundreds of Roblox developers using Disperser Studio to manage their assets.</p>
          <button
            className="bg-white text-black px-12 h-14 rounded-xl font-bold text-lg hover:bg-slate-200 transition-all active:scale-95"
            onClick={onLoginClick}
          >
            Start Creating Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 py-16 border-t border-white/5 text-center relative z-10">
        <div className="flex items-center justify-center gap-3 mb-8 opacity-50 grayscale">
          <div className="bg-slate-700 w-8 h-8 rounded-lg flex items-center justify-center">
            <Music size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">Disperser Studio</span>
        </div>
        <p className="text-slate-600 text-sm">© 2026 Disperser Studio. All rights reserved. Not affiliated with Roblox Corporation.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
