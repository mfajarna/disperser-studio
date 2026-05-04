import React, { useState, useRef, useEffect } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
import * as Tone from 'tone';
import audioBufferToWav from 'audiobuffer-to-wav';
import { api } from '../api/api';
import { processAudio } from '../utils/processor';
import {
  Upload,
  Youtube,
  Check,
  X,
  Scissors,
  Music,
  Play,
  Pause,
  Volume2,
  Zap,
  Activity,
  Headphones,
  AudioWaveform,
  Loader2,
  Sparkles,
  FileAudio,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { z } from 'zod';

const assetSchema = z.object({
  name: z.string().min(1, 'Asset name is required').min(3, 'Name must be at least 3 characters').max(50, 'Name must be under 50 characters'),
});

export default function AudioStudio() {
  const [file, setFile] = useState<File | null>(null);
  const [ytUrl, setYtUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const [assetName, setAssetName] = useState('');
  const [nameError, setNameError] = useState('');
  const [volume, setVolume] = useState(1);
  const [speed, setSpeed] = useState(1);
  const [pitch, setPitch] = useState(0);
  const [trim, setTrim] = useState({ start: 0, end: 0 });

  const [ytError, setYtError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const loadHistory = async () => {
      setHistory(await api.getHistory());
    };
    loadHistory();
  }, []);

  const waveRef = useRef<HTMLDivElement>(null);
  const ws = useRef<WaveSurfer | null>(null);
  const regions = useRef<any>(null);
  const trimRef = useRef(trim);

  // Keep trimRef in sync
  useEffect(() => { trimRef.current = trim; }, [trim]);

  // Format seconds to mm:ss
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!file || !waveRef.current) return;

    ws.current = WaveSurfer.create({
      container: waveRef.current,
      waveColor: '#1e293b',
      progressColor: '#06b6d4',
      cursorColor: '#22d3ee',
      cursorWidth: 2,
      barWidth: 3,
      barGap: 2,
      barRadius: 3,
      height: 140,
      normalize: true,
      plugins: [regions.current = RegionsPlugin.create()]
    });

    ws.current.loadBlob(file);

    ws.current.on('ready', () => {
      const d = ws.current!.getDuration();
      setDuration(d);
      setTrim({ start: 0, end: d });
      regions.current.addRegion({
        id: 'trim',
        start: 0,
        end: d,
        color: 'rgba(6, 182, 212, 0.12)',
        drag: true,
        resize: true
      });
    });

    ws.current.on('play', () => setIsPlaying(true));
    ws.current.on('pause', () => setIsPlaying(false));
    ws.current.on('timeupdate', (time: number) => {
      setCurrentTime(time);
      // Auto-stop at trim end (use ref to avoid stale closure)
      if (time >= trimRef.current.end && ws.current?.isPlaying()) {
        ws.current.pause();
      }
    });

    regions.current.on('region-updated', (region: any) => {
      setTrim({ start: region.start, end: region.end });
    });

    return () => ws.current?.destroy();
  }, [file]);

  // Apply volume changes in real-time
  useEffect(() => {
    if (ws.current) {
      // HTMLMediaElement.volume only accepts [0, 1]; values >1 are applied at export via Tone.js
      ws.current.setVolume(Math.min(volume, 1));
    }
  }, [volume]);

  // Apply speed + pitch in real-time
  // We disable preservesPitch on the media element so playbackRate also shifts pitch.
  // Combined rate = speed * pitchMultiplier
  useEffect(() => {
    if (!ws.current) return;
    const pitchMultiplier = Math.pow(2, pitch / 100);
    const combinedRate = speed * pitchMultiplier;
    ws.current.setPlaybackRate(combinedRate);

    // Disable preservesPitch so rate changes also affect pitch
    try {
      const media = ws.current.getMediaElement();
      if (media) {
        (media as any).preservesPitch = false;
        (media as any).mozPreservesPitch = false;
        (media as any).webkitPreservesPitch = false;
      }
    } catch { }
  }, [speed, pitch]);

  // Play from trim start, stop at trim end
  const togglePlay = () => {
    if (!ws.current) return;
    if (ws.current.isPlaying()) {
      ws.current.pause();
    } else {
      // Always start from trim region start
      ws.current.setTime(trimRef.current.start);
      ws.current.play();
    }
  };

  const handleImport = async () => {
    if (!ytUrl) return;
    setLoading(true);
    setYtError('');
    setLoadingMsg('Downloading from YouTube...');
    try {
      const { title, buffer } = await api.ytDownload(ytUrl);
      const blob = new Blob([buffer], { type: 'audio/mpeg' });
      setFile(new File([blob], `${title}.mp3`));
      setAssetName(title);
      await api.addToHistory(title, ytUrl, buffer);
      setHistory(await api.getHistory());
    } catch (e: any) {
      setYtError(e.message);
    }
    setLoading(false);
    setLoadingMsg('');
  };

  const handleSave = async () => {
    if (!file || !ws.current) return;

    // Validate asset name
    const result = assetSchema.safeParse({ name: assetName });
    if (!result.success) {
      setNameError(result.error.errors[0].message);
      return;
    }
    setNameError('');
    setSaveError('');

    // Check final duration
    const fullDuration = ws.current.getDuration();
    const actualTrimStart = trim.start || 0;
    const actualTrimEnd = trim.end || fullDuration;
    const trimDuration = actualTrimEnd - actualTrimStart;
    const finalDuration = trimDuration / speed;

    if (finalDuration > 420) {
      setSaveError(`Final audio is too long (${Math.floor(finalDuration / 60)}m ${Math.round(finalDuration % 60)}s). Maximum allowed is 7 minutes. Please trim the audio or increase speed.`);
      return;
    }

    setLoading(true);
    setLoadingMsg('Applying effects & preparing asset...');
    try {
      // Start Tone.js audio context
      await Tone.start();

      const arrayBuffer = await file.arrayBuffer();
      const audioCtx = new AudioContext();
      const original = await audioCtx.decodeAudioData(arrayBuffer);
      audioCtx.close();

      const processed = await processAudio(original, {
        volume,
        speed,
        pitch,
        trimStart: trim.start,
        trimEnd: trim.end
      });
      const wav = new Uint8Array(audioBufferToWav(processed));
      await api.addToQueue(assetName || file.name, 'Uploaded via Studio', wav);
      setFile(null); 
      setAssetName('');
      setYtUrl('');
      // Show success but keep history
    } catch (e: any) {
      console.error('Processing error:', e);
      setSaveError('Processing failed: ' + e.message);
    }
    setLoading(false);
    setLoadingMsg('');
  };

  const handleLoadHistory = (item: any) => {
    const blob = new Blob([item.buffer], { type: 'audio/mpeg' });
    setFile(new File([blob], `${item.title}.mp3`));
    setAssetName(item.title);
    setYtUrl(item.ytUrl || '');
    setSaveError('');
    setYtError('');
  };

  // Reset a single control
  const resetControl = (ctrl: 'volume' | 'speed' | 'pitch') => {
    if (ctrl === 'volume') setVolume(1);
    if (ctrl === 'speed') setSpeed(1);
    if (ctrl === 'pitch') setPitch(0);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl">
            <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
            <p className="text-white font-medium">{loadingMsg}</p>
            <p className="text-xs text-slate-500">This may take a moment...</p>
          </div>
        </div>
      )}

      {!file ? (
        /* ==================== IMPORT SCREEN ==================== */
        <div className="space-y-6">
          {/* Header Card */}
          <Card className="bg-gradient-to-br from-cyan-500/5 to-blue-600/5 border-slate-800 p-8">
            <div className="flex items-start gap-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
                <Headphones size={28} className="text-white" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">Audio Preparation Studio</h2>
                <p className="text-slate-400 leading-relaxed max-w-xl">
                  Import audio from <span className="text-red-400 font-semibold">YouTube</span> or upload a local file.
                  Then use the built-in editor to <span className="text-cyan-400 font-semibold">trim</span>,
                  adjust <span className="text-cyan-400 font-semibold">speed</span>,
                  <span className="text-cyan-400 font-semibold">pitch</span>, and
                  <span className="text-cyan-400 font-semibold">volume</span> before uploading to Roblox.
                </p>
                <div className="flex gap-2 pt-2">
                  <Badge variant="secondary" className="bg-slate-800 text-slate-400 text-xs gap-1">
                    <FileAudio size={12} /> MP3 Output
                  </Badge>
                  <Badge variant="secondary" className="bg-slate-800 text-slate-400 text-xs gap-1">
                    <Sparkles size={12} /> Powered by Tone.js
                  </Badge>
                  <Badge variant="secondary" className="bg-slate-800 text-slate-400 text-xs gap-1">
                    <AudioWaveform size={12} /> Waveform Editor
                  </Badge>
                </div>
              </div>
            </div>
          </Card>

          {/* Import Options */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* YouTube Import */}
            <Card className="bg-slate-900/40 border-slate-800 p-8 space-y-4 hover:border-red-500/20 transition-colors group">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <Youtube size={22} className="text-red-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Import from YouTube</h3>
                  <p className="text-xs text-slate-500">Paste a video URL to extract audio as MP3</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="https://youtube.com/watch?v=..."
                  value={ytUrl}
                  onChange={(e) => { setYtUrl(e.target.value); if (ytError) setYtError(''); }}
                  className={`bg-slate-950 border-slate-800 focus-visible:ring-cyan-500/50 ${ytError ? 'border-red-500/50' : ''}`}
                />
                <Button onClick={handleImport} disabled={loading || !ytUrl} className="bg-red-600 hover:bg-red-500 shrink-0 gap-2">
                  <Youtube size={16} /> Import
                </Button>
              </div>
              {ytError && (
                <div className="flex items-center gap-2 text-xs text-red-400 bg-red-400/5 p-3 rounded-lg border border-red-500/20 animate-in fade-in slide-in-from-top-1">
                  <AlertCircle size={14} />
                  {ytError}
                </div>
              )}

              {/* History Section */}
              {history.length > 0 && (
                <div className="pt-4 mt-4 border-t border-slate-800/50">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Clock size={14} /> Recent Imports
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {history.map((item) => (
                      <button 
                        key={item.id}
                        onClick={() => handleLoadHistory(item)}
                        className="w-full text-left bg-slate-950/50 hover:bg-cyan-500/10 border border-slate-800 hover:border-cyan-500/30 p-3 rounded-xl transition-all group flex items-center justify-between"
                      >
                        <div className="truncate pr-4">
                          <div className="text-sm font-medium text-slate-300 group-hover:text-cyan-400 truncate">{item.title}</div>
                          <div className="text-[10px] text-slate-500 mt-1">{new Date(item.createdAt).toLocaleString()}</div>
                        </div>
                        <Play size={14} className="text-slate-600 group-hover:text-cyan-400 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Local File Upload */}
            <label className="cursor-pointer">
              <Card className="bg-slate-900/40 border-slate-800 border-dashed p-8 hover:border-cyan-500/30 hover:bg-slate-900/60 transition-all h-full flex flex-col items-center justify-center text-center gap-4 group">
                <div className="w-14 h-14 rounded-2xl bg-slate-800/50 flex items-center justify-center group-hover:bg-cyan-500/10 transition-colors">
                  <Upload size={24} className="text-slate-500 group-hover:text-cyan-400 transition-colors" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Upload Local File</h3>
                  <p className="text-xs text-slate-500 mt-1">Supports MP3, WAV, OGG, M4A</p>
                </div>
                <input type="file" accept="audio/*" hidden onChange={e => e.target.files && setFile(e.target.files[0])} />
              </Card>
            </label>
          </div>

          {/* Tips */}
          <div className="bg-slate-900/20 border border-slate-800/50 rounded-xl p-4 flex items-start gap-3">
            <Sparkles size={16} className="text-cyan-400 mt-1.5 shrink-0" />
            <p className="text-ml text-slate-500 leading-relaxed">
              <span className="text-slate-400 font-medium">Pro tip:</span> For best results on Roblox,
              keep your audio under 7 minutes and ensure the final volume isn't too loud (stay under 150%).
              Roblox supports audio up to 7 minutes for free accounts.
            </p>
          </div>
        </div>
      ) : (
        /* ==================== EDITOR SCREEN ==================== */
        <Card className="bg-slate-900/40 border-slate-800 overflow-hidden">
          <CardContent className="p-0">
            {/* Waveform Section */}
            <div className="bg-slate-950/80 p-6 pb-4 border-b border-slate-800 relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={togglePlay}
                    className="w-11 h-11 rounded-full border-slate-700 bg-slate-900/50 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/50 transition-all"
                  >
                    {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                  </Button>
                  <div>
                    <h3 className="font-bold text-white text-sm truncate max-w-[300px]">{assetName || file.name}</h3>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      <span className="font-mono text-cyan-400">{formatTime(currentTime)}</span>
                      <span>/</span>
                      <span className="font-mono">{formatTime(duration)}</span>
                      <span className="text-slate-700">•</span>
                      <span>Trim: {formatTime(trim.start)} → {formatTime(trim.end)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 gap-1 text-[10px]">
                    <Scissors size={10} /> Drag edges to trim
                  </Badge>
                </div>
              </div>

              <div ref={waveRef} className="rounded-lg overflow-hidden" />
            </div>

            {/* Controls Section */}
            <div className="p-6 space-y-6">
              {/* Audio Controls Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Volume */}
                <div className="space-y-3 bg-slate-900/30 rounded-xl p-4 border border-slate-800/50">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                      <Volume2 size={14} className="text-cyan-400" /> Volume
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md">{Math.round(volume * 100)}%</span>
                      <button onClick={() => resetControl('volume')} className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors">Reset</button>
                    </div>
                  </div>
                  <Slider value={[volume * 100]} max={200} step={1} onValueChange={(v) => setVolume(v[0] / 100)} />
                  <p className="text-[10px] text-slate-600">Adjust output loudness (0% – 200%)</p>
                </div>

                {/* Speed */}
                <div className="space-y-3 bg-slate-900/30 rounded-xl p-4 border border-slate-800/50">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                      <Zap size={14} className="text-cyan-400" /> Speed
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md">{speed.toFixed(1)}x</span>
                      <button onClick={() => resetControl('speed')} className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors">Reset</button>
                    </div>
                  </div>
                  <Slider value={[speed * 10]} min={5} max={30} step={1} onValueChange={(v) => setSpeed(v[0] / 10)} />
                  <p className="text-[10px] text-slate-600">Playback rate (0.5x – 3.0x)</p>
                </div>

                {/* Pitch */}
                <div className="space-y-3 bg-slate-900/30 rounded-xl p-4 border border-slate-800/50">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                      <Activity size={14} className="text-cyan-400" /> Pitch Shift
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md">{pitch > 0 ? '+' : ''}{pitch}%</span>
                      <button onClick={() => resetControl('pitch')} className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors">Reset</button>
                    </div>
                  </div>
                  <Slider value={[pitch + 100]} min={0} max={200} step={1} onValueChange={(v) => setPitch(v[0] - 100)} />
                  <p className="text-[10px] text-slate-600">Pitch adjustment (-100% to +100%)</p>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex flex-col gap-4 pt-4 border-t border-slate-800/50">
                <div className={`bg-slate-900/50 border rounded-xl p-5 space-y-3 ${nameError ? 'border-red-500/50' : 'border-slate-800'}`}>
                  <Label htmlFor="assetName" className="text-sm font-bold text-slate-300 flex items-center gap-2">
                    Asset Name <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="assetName"
                    value={assetName}
                    onChange={(e) => { setAssetName(e.target.value); setNameError(''); }}
                    placeholder="e.g. Epic Background Music, SFX Jump, Ambient Rain..."
                    className={`bg-slate-950 border-slate-800 text-white text-base py-3 px-4 focus-visible:ring-cyan-500/50 ${nameError ? 'border-red-500' : ''}`}
                    maxLength={50}
                  />
                  {nameError && <p className="text-xs text-red-400 font-medium">{nameError}</p>}
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    This will be the display name for your audio asset on Roblox. Use a short,
                    descriptive name (3–50 characters). Avoid special characters — only letters, numbers, and spaces are recommended.
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-600">{assetName.length}/50 characters</span>
                  </div>
                </div>

                {saveError && (
                  <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 p-4 rounded-xl animate-in fade-in slide-in-from-top-2">
                    <AlertCircle size={18} className="text-red-400 mt-0.5 shrink-0" />
                    <div className="text-sm text-red-300 leading-relaxed">{saveError}</div>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => { setFile(null); setAssetName(''); setYtUrl(''); }} className="text-slate-500 hover:text-white gap-2">
                    <X size={16} /> Discard
                  </Button>
                  <Button onClick={handleSave} disabled={loading} className="bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20 gap-2 px-6">
                    <Check size={16} /> Prepare Asset
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
