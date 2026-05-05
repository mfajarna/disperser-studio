import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import UploadAudio from './pages/UploadAudio';
import UploadImage from './pages/UploadImage';
import Overview from './pages/Overview';
import Settings from './pages/Settings';
import LandingPage from './pages/LandingPage';
import AudioStudio from './pages/AudioStudio';
import AudioLibrary from './pages/AudioLibrary';
import { PollProvider } from './context/PollContext';
import { BulkUploadProvider, useBulkUpload } from './context/BulkUploadContext';
import {
  LayoutDashboard,
  Music,
  Image as ImageIcon,
  Settings as SettingsIcon,
  LogOut,
  Key,
  ArrowLeft,
  ChevronRight,
  Sparkles,
  ListMusic,
  Loader2,
  AlertCircle
} from 'lucide-react';

// --- Components ---

const Sidebar = () => {
  const loc = useLocation();
  const navigate = useNavigate();
  const { bulkQueue, isBulkProcessing } = useBulkUpload();
  const logout = () => {
    localStorage.removeItem('disperser_key');
    navigate('/');
  };

  const menuItems = [
    { name: 'Overview', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Audio Studio', path: '/dashboard/studio', icon: <Sparkles size={20} /> },
    { name: 'Audio Library', path: '/dashboard/library', icon: <ListMusic size={20} /> },
    { name: 'Upload Image', path: '/dashboard/image', icon: <ImageIcon size={20} /> },
    { name: 'Settings', path: '/dashboard/settings', icon: <SettingsIcon size={20} /> },
  ];

  return (
    <aside className="sidebar">
      <div className="logo flex items-center gap-3 px-2">
        <div className="bg-gradient-to-br from-cyan-500 to-blue-600 w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Music size={20} className="text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          Disperser
        </span>
      </div>

      <nav className="flex-1 space-y-1 mt-0">
        {menuItems.map((item) => {
          const isActive = loc.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link relative flex items-center justify-between group ${isActive ? 'active' : ''}`}
            >
              <div className="flex items-center gap-3">
                <span className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-cyan-400'} transition-colors`}>
                  {item.icon}
                </span>
                <span className="font-medium text-sm">{item.name}</span>
              </div>
              {isActive && <ChevronRight size={14} className="text-white opacity-50" />}
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 border-t border-slate-800 space-y-4">
        {bulkQueue.length > 0 && (
          <div className="px-2 py-3 bg-slate-900/50 border border-slate-800 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Bulk Status</span>
              {isBulkProcessing && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />}
            </div>
            <div className="flex items-center gap-2">
              {isBulkProcessing ? <Loader2 size={14} className="text-cyan-400 animate-spin" /> : <Sparkles size={14} className="text-slate-500" />}
              <span className="text-xs text-slate-300 font-medium">
                {bulkQueue.filter(i => i.status === 'success').length} / {bulkQueue.length} Ready
              </span>
            </div>
            <Link to="/dashboard/studio" className="text-[10px] text-cyan-500 hover:text-cyan-400 mt-2 block font-bold transition-colors">
              VIEW QUEUE →
            </Link>
          </div>
        )}

        <button
          className="nav-link w-full flex items-center gap-3 text-slate-400 hover:text-red-400 hover:bg-red-500/5 transition-all"
          onClick={logout}
          style={{ border: 'none', background: 'none', cursor: 'pointer' }}
        >
          <LogOut size={20} />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
};

const Login = ({ setKey }: { setKey: (k: string) => void }) => {
  const [inputKey, setInputKey] = useState('');
  const navigate = useNavigate();

  const handleLogin = () => {
    if (inputKey.trim()) {
      localStorage.setItem('disperser_key', inputKey.trim());
      setKey(inputKey.trim());
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080a0c] text-white p-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
      <div className="w-full max-w-md bg-[#111820] p-8 rounded-3xl border border-slate-800 shadow-2xl relative z-10">
        <Link to="/" className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm mb-8 transition-colors">
          <ArrowLeft size={16} /> Back to Landing
        </Link>
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-gradient-to-br from-cyan-500 to-blue-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Music size={22} className="text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Disperser Studio</span>
        </div>
        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold">Welcome back</h2>
            <p className="text-slate-400 text-sm">Enter your Roblox Open Cloud API Key to access the studio.</p>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Open Cloud API Key</label>
            <input
              className="w-full bg-[#080a0c] border border-slate-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all"
              type="password"
              placeholder="Paste key here..."
              value={inputKey}
              onChange={e => setInputKey(e.target.value)}
            />
          </div>
          <button className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-bold shadow-lg shadow-cyan-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2" onClick={handleLogin}>
            <Key size={18} /> Initialize Studio
          </button>
        </div>
      </div>
    </div>
  );
};

const Home = () => {
  const navigate = useNavigate();
  return <LandingPage onLoginClick={() => navigate('/login')} />;
};

const DashboardLayout = ({ keyExists }: { keyExists: boolean }) => {
  if (!keyExists) return <Navigate to="/login" />;

  return (
    <PollProvider>
      <BulkUploadProvider>
        <div className="layout">
          <Sidebar />
          <main className="content">
            <Routes>
              <Route path="/" element={<Overview />} />
              <Route path="/studio" element={<AudioStudio />} />
              <Route path="/library" element={<AudioLibrary />} />
              <Route path="/image" element={<UploadImage />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </BulkUploadProvider>
    </PollProvider>
  );
};

// --- Main App ---

export default function App() {
  const [key, setKey] = useState(localStorage.getItem('disperser_key'));

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login setKey={setKey} />} />
        <Route path="/dashboard/*" element={<DashboardLayout keyExists={!!key} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
