import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import fetch from 'node-fetch';
import ytdl from '@distube/ytdl-core';
import play from 'play-dl';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

// Initialize play-dl
play.setToken({
  useragent: ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36']
});

// --- Roblox API Endpoints ---

app.post('/api/roblox/upload', upload.single('file'), async (req, res) => {
  const { apiKey, name, description } = req.body;
  const file = req.file;

  if (!apiKey || !file) return res.status(400).json({ success: false, error: 'Missing API Key or File' });

  try {
    const formData = new FormData();
    const fileBlob = new Blob([file.buffer], { type: file.mimetype });
    
    const metadata = {
      assetType: 'Audio',
      displayName: name || 'Uploaded Audio',
      description: description || 'Uploaded via Disperser Studio',
      creationContext: { creator: { userId: "0" } } // Dummy ID, API Key determines target
    };

    formData.append('request', JSON.stringify(metadata));
    formData.append('fileContent', fileBlob, file.originalname);

    const response = await fetch('https://apis.roblox.com/assets/v1/assets', {
      method: 'POST',
      headers: { 'x-api-key': apiKey },
      body: formData as any
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Roblox API Error');
    
    res.json({ success: true, operation: data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/roblox/operation/:id', async (req, res) => {
  const { apiKey } = req.query;
  const { id } = req.params;
  try {
    const response = await fetch(`https://apis.roblox.com/assets/v1/operations/${id}`, {
      headers: { 'x-api-key': apiKey as string }
    });
    const data = await response.json();
    res.json({ success: true, operation: data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/roblox/asset/:id', async (req, res) => {
  const { apiKey } = req.query;
  const { id } = req.params;
  try {
    const response = await fetch(`https://apis.roblox.com/assets/v1/assets/${id}`, {
      headers: { 'x-api-key': apiKey as string }
    });
    const data = await response.json();
    res.json({ success: true, metadata: data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- YouTube Downloader ---

app.post('/api/youtube/download', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ success: false, error: 'URL required' });

  try {
    let title = 'audio';
    let stream: any;

    try {
      const info = await play.video_info(url);
      title = info.video_details.title || title;
      const audioStream = await play.stream(url, { quality: 2 });
      stream = audioStream.stream;
    } catch {
      const ytdlStream = ytdl(url, { filter: 'audioonly', quality: 'highestaudio' });
      stream = ytdlStream;
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('X-Audio-Title', encodeURIComponent(title));
    stream.pipe(res);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Disperser Backend running on port ${port}`);
});
