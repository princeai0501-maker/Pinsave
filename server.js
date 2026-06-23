const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  next();
});
app.use(express.json());
app.use(express.static('public'));

app.get('/health', (req, res) => {
  res.json({ status: 'PinSave backend is running ✅' });
});

app.get('/api/info', (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'URL is required' });
  const isPinterest = /pinterest\.|pin\.it/i.test(url);
  if (!isPinterest) return res.status(400).json({ error: 'Invalid Pinterest URL' });

  const command = `yt-dlp --dump-json --no-playlist "${url}"`;
  exec(command, { timeout: 30000 }, (error, stdout, stderr) => {
    if (error) return res.status(500).json({ error: 'Could not fetch video. Pin must be public with a video.' });
    try {
      const info = JSON.parse(stdout);
      const formats = (info.formats || [])
        .filter(f => f.ext === 'mp4' && f.url)
        .map(f => ({ quality: f.height ? `${f.height}p` : 'Standard', height: f.height || 0, url: f.url, filesize: f.filesize ? `${(f.filesize/1048576).toFixed(1)} MB` : 'Unknown' }))
        .sort((a, b) => b.height - a.height);
      if (formats.length === 0 && info.url) formats.push({ quality: 'HD', height: 720, url: info.url, filesize: 'Unknown' });
      res.json({ title: info.title || 'Pinterest Video', thumbnail: info.thumbnail || '', duration: info.duration || null, uploader: info.uploader || 'Pinterest', formats });
    } catch (e) {
      res.status(500).json({ error: 'Failed to parse video info' });
    }
  });
});

app.listen(PORT, () => console.log(`✅ PinSave running on port ${PORT}`));
