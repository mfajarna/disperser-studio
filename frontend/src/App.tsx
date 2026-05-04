import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import Studio from './pages/Studio';
import Library from './pages/Library';
import { Music, Layers, LogOut, Key } from 'lucide-react';

const Sidebar = () => {
  const loc = useLocation();
  const logout = () => { localStorage.removeItem('disperser_key'); window.location.reload(); };

  return (
    <aside className="sidebar">
      <div className="logo">
        <div className="logo-icon">🎙️</div>
        <span>Disperser</span>
      </div>
      <nav style={{ flex: 1 }}>
        <Link to="/" className={`nav-link ${loc.pathname === '/' ? 'active' : ''}`}>
          <Music size={20}/> Studio
        </Link>
        <Link to="/library" className={`nav-link ${loc.pathname === '/library' ? 'active' : ''}`}>
          <Layers size={20}/> Library
        </Link>
      </nav>
      <button className="nav-link" onClick={logout} style={{ border: 'none', background: 'none', width: '100%', cursor: 'pointer' }}>
        <LogOut size={20}/> Logout
      </button>
    </aside>
  );
};

export default function App() {
  const [key, setKey] = useState(localStorage.getItem('disperser_key'));
  const [inputKey, setInputKey] = useState('');

  if (!key) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)' }}>
        <div style={{ background: 'var(--bg-card)', padding: '40px', borderRadius: '24px', border: '1px solid var(--border)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <div className="logo" style={{ justifyContent: 'center', marginBottom: '32px' }}>
            <div className="logo-icon">🎙️</div>
            <span>Disperser Studio</span>
          </div>
          <h2 style={{ marginBottom: '8px' }}>Welcome back</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '14px' }}>Connect your Roblox API Key to start</p>
          <div className="input-group" style={{ textAlign: 'left' }}>
            <label className="input-label">Open Cloud API Key</label>
            <input className="input-field" type="password" placeholder="Paste key here..." value={inputKey} onChange={e => setInputKey(e.target.value)} />
          </div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { localStorage.setItem('disperser_key', inputKey); setKey(inputKey); }}>
            <Key size={18}/> Initialize Studio
          </button>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="layout">
        <Sidebar />
        <main className="content">
          <Routes>
            <Route path="/" element={<Studio />} />
            <Route path="/library" element={<Library />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
