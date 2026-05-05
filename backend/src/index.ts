// @ts-nocheck
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import http from 'http';

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

app.use(cors({
  exposedHeaders: ['X-Audio-Title']
}));
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

// --- Roblox API Endpoints ---

app.post('/api/roblox/upload', upload.single('file'), async (req, res) => {
  const file = req.file;
  const { apiKey, userId, name, description } = req.body;

  if (!apiKey || !file) {
    console.error('❌ Upload failed: Missing API Key or File');
    return res.status(400).json({ success: false, error: 'Missing API Key or File' });
  }

  try {
    const formData = new FormData();
    const fileBlob = new Blob([new Uint8Array(file.buffer)], { type: file.mimetype });

    const metadata = {
      assetType: 'Audio',
      displayName: name || 'Uploaded Audio',
      description: description || 'Uploaded via Disperser Studio',
      creationContext: {
        creator: {
          userId: userId || "0"
        }
      }
    };

    formData.append('request', JSON.stringify(metadata));
    formData.append('fileContent', fileBlob, file.originalname || 'audio.wav');

    console.log(`🚀 Uploading to Roblox: ${metadata.displayName} (Creator: ${userId || 'unknown'})`);

    // Using global fetch (native in Node 24+)
    const response = await fetch('https://apis.roblox.com/assets/v1/assets', {
      method: 'POST',
      headers: { 'x-api-key': apiKey },
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Roblox API Error Response:', JSON.stringify(data, null, 2));
      throw new Error(data.message || `Roblox API Error: ${response.status} ${response.statusText}`);
    }

    console.log('✅ Roblox Upload Successful:', data.path || data.id || 'Operation Created');
    res.json({ success: true, operation: data });
  } catch (error) {
    console.error('❌ Internal Server Error during upload:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/roblox/operation/:id', async (req, res) => {
  const { apiKey } = req.query;
  const { id } = req.params;
  try {
    const response = await fetch(`https://apis.roblox.com/assets/v1/operations/${id}`, {
      headers: { 'x-api-key': apiKey }
    });
    const data = await response.json();
    res.json({ success: true, operation: data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/roblox/asset/:id', async (req, res) => {
  const { apiKey } = req.query;
  const { id } = req.params;
  try {
    const response = await fetch(`https://apis.roblox.com/assets/v1/assets/${id}`, {
      headers: { 'x-api-key': apiKey }
    });
    const data = await response.json();
    res.json({ success: true, metadata: data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- YouTube Downloader (using yt-dlp + ffmpeg) ---

app.get('/api/youtube/info', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ success: false, error: 'URL required' });

  try {
    const result = await new Promise((resolve, reject) => {
      execFile('yt-dlp', [
        '--print', '%(title)s',
        '--no-download',
        '--no-warnings',
        url
      ], { timeout: 15000 }, (err, stdout, stderr) => {
        if (err) reject(new Error(stderr || err.message));
        else resolve(stdout.trim());
      });
    });

    res.json({ success: true, title: result });
  } catch (error) {
    console.error('yt-dlp info error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/youtube/download', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ success: false, error: 'URL required' });

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'disperser-'));
  const outputFile = path.join(tmpDir, 'audio.mp3');

  try {
    // Step 1: Get title and duration
    const info: any = await new Promise((resolve) => {
      execFile('yt-dlp', [
        '--print', '%(title)s',
        '--print', '%(duration)s',
        '--no-download',
        '--no-warnings',
        url
      ], { timeout: 15000 }, (err, stdout) => {
        const urlObj = new URL(url);
        const videoId = urlObj.searchParams.get('v') || url.split('/').pop() || 'audio';
        
        if (err) {
          resolve({ title: `YouTube Audio (${videoId})`, duration: 0 });
        } else {
          const lines = stdout.trim().split('\n');
          resolve({
            title: lines[0] || `YouTube Audio (${videoId})`,
            duration: parseFloat(lines[1]) || 0
          });
        }
      });
    });

    const title = info.title;

    // Step 2: Download and convert to MP3
    await new Promise((resolve, reject) => {
      execFile('yt-dlp', [
        '-x',
        '--audio-format', 'mp3',
        '--audio-quality', '0',
        '-o', outputFile,
        '--no-playlist',
        '--no-warnings',
        '--force-overwrites',
        url
      ], { timeout: 120000 }, (err, stdout, stderr) => {
        if (err) {
          console.error('yt-dlp error:', stderr);
          reject(new Error(stderr || err.message));
        } else {
          resolve(undefined);
        }
      });
    });

    // Find the actual output file
    let actualFile = outputFile;
    if (!fs.existsSync(actualFile)) {
      const files = fs.readdirSync(tmpDir);
      const mp3File = files.find(f => f.endsWith('.mp3'));
      if (mp3File) {
        actualFile = path.join(tmpDir, mp3File);
      } else {
        throw new Error('MP3 conversion failed - no output file found');
      }
    }

    const stat = fs.statSync(actualFile);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', stat.size.toString());
    res.setHeader('X-Audio-Title', encodeURIComponent(title));
    res.setHeader('Access-Control-Expose-Headers', 'X-Audio-Title');

    const readStream = fs.createReadStream(actualFile);
    readStream.pipe(res);

    readStream.on('end', () => {
      try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch { }
    });

    readStream.on('error', () => {
      try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch { }
    });

  } catch (error) {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch { }
    console.error('YouTube download failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- Start Server using http.createServer (Express v5 compatible) ---
const server = http.createServer(app);
server.listen(port, () => {
  console.log(`✅ Disperser Backend running on http://localhost:${port}`);
});