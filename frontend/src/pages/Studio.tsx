import React, { useState, useRef, useEffect } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
import * as Tone from 'tone';
import audioBufferToWav from 'audiobuffer-to-wav';
import { api } from '../api/api';
import { processAudio } from '../utils/processor';
import { Upload, Youtube, Check, X, Scissors, Music } from 'lucide-react';

export default function Studio() {
  const [file, setFile] = useState<File | null>(null);
  const [ytUrl, setYtUrl] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [assetName, setAssetName] = useState('');
  const [volume, setVolume] = useState(1);
  const [speed, setSpeed] = useState(1);
  const [pitch, setPitch] = useState(0);
  const [trim, setTrim] = useState({ start: 0, end: 0 });

  const waveRef = useRef<HTMLDivElement>(null);
  const ws = useRef<WaveSurfer | null>(null);
  const regions = useRef<any>(null);

  useEffect(() => {
    if (!file || !waveRef.current) return;
    ws.current = WaveSurfer.create({
      container: waveRef.current,
      waveColor: '#3b82f6',
      progressColor: '#60a5fa',
      barWidth: 2,
      height: 160,
      plugins: [regions.current = RegionsPlugin.create()]
    });
    ws.current.loadBlob(file);
    ws.current.on('ready', () => {
      const d = ws.current!.getDuration();
      setTrim({ start: 0, end: d });
      regions.current.addRegion({ id: 'trim', start: 0, end: d, color: 'rgba(59, 130, 246, 0.15)', drag: true, resize: true });
    });
    ws.current.on('interaction', () => ws.current?.play());
    return () => ws.current?.destroy();
  }, [file]);

  const handleImport = async () => {
    if (!ytUrl) return;
    setLoading(true);
    try {
      const { title, buffer } = await api.ytDownload(ytUrl);
      const blob = new Blob([buffer], { type: 'audio/mp4' });
      setFile(new File([blob], `${title}.mp4`));
      setAssetName(title);
    } catch (e: any) { alert(e.message); }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!file || !ws.current) return;
    setLoading(true);
    try {
      const original = await Tone.getContext().decodeAudioData(await file.arrayBuffer());
      const processed = await processAudio(original, { volume, speed, pitch, trimStart: trim.start, trimEnd: trim.end });
      const wav = new Uint8Array(audioBufferToWav(processed));
      await api.addToQueue(assetName || file.name, 'Uploaded via Studio', wav);
      setFile(null); setAssetName('');
      alert('Saved to Library!');
    } catch (e: any) { alert(e.message); }
    setLoading(false);
  };

  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">Audio Studio</h1>
        <p className="page-desc">Import, edit, and prepare your assets for Roblox</p>
      </header>

      {!file ? (
        <div className="input-group" style={{ display: 'flex', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <input className="input-field" placeholder="Paste YouTube URL..." value={ytUrl} onChange={e => setYtUrl(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={handleImport} disabled={loading}>
            {loading ? 'Fetching...' : <><Youtube size={18}/> Import</>}
          </button>
          <label className="btn btn-outline">
            <Upload size={18}/> Upload File
            <input type="file" hidden onChange={e => e.target.files && setFile(e.target.files[0])} />
          </label>
        </div>
      ) : (
        <div style={{ background: 'var(--bg-card)', padding: '32px', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <div className="waveform-box" ref={waveRef}></div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px', marginBottom: '32px' }}>
            <div className="input-group">
              <label className="input-label">Volume: {Math.round(volume * 100)}%</label>
              <input type="range" min="0" max="2" step="0.01" value={volume} onChange={e => setVolume(parseFloat(e.target.value))} />
            </div>
            <div className="input-group">
              <label className="input-label">Speed: {speed}x</label>
              <input type="range" min="0.5" max="3" step="0.1" value={speed} onChange={e => setSpeed(parseFloat(e.target.value))} />
            </div>
            <div className="input-group">
              <label className="input-label">Pitch Shift: {pitch}%</label>
              <input type="range" min="-100" max="100" step="1" value={pitch} onChange={e => setPitch(parseInt(e.target.value))} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', borderTop: '1px solid var(--border)', paddingTop: '32px' }}>
            <input className="input-field" placeholder="Asset Name" value={assetName} onChange={e => setAssetName(e.target.value)} style={{ flex: 1 }} />
            <button className="btn btn-outline" onClick={() => setFile(null)}><X size={18}/> Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
              {loading ? 'Processing...' : <><Check size={18}/> Save to Library</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
