const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Allow requests from any frontend
app.use(cors());
app.use(express.json());

// Serve frontend HTML (optional)
app.use(express.static('public'));

// ─── Health check ───────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'PinSave backend is running ✅' });
});

// ─── Main API: Get video info + download links ───────────────
app.get('/api/info', (req, res) => {
  const url = req.query.url;

  // Validate URL
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  const isPinterest = /pinterest\.|pin\.it/i.test(url);
  if (!isPinterest) {
    return res.status(400).json({ error: 'Please provide a valid Pinterest URL' });
  }

  console.log(`Fetching info for: ${url}`);

  // Use yt-dlp to get video info (JSON format, no download)
  const command = `yt-dlp --dump-json --no-playlist "${url}"`;

  exec(command, { timeout: 30000 }, (error, stdout, stderr) => {
    if (error) {
      console.error('yt-dlp error:', stderr);
      return res.status(500).json({
        error: 'Could not fetch video. Make sure the pin is public and contains a video.',
        details: stderr
      });
    }

    try {
      const info = JSON.parse(stdout);

      // Extract available formats/qualities
      const formats = (info.formats || [])
        .filter(f => f.ext === 'mp4' && f.url)
        .map(f => ({
          quality: f.format_note || f.height ? `${f.height}p` : 'Standard',
          height: f.height || 0,
          url: f.url,
          filesize: f.filesize ? formatBytes(f.filesize) : 'Unknown'
        }))
        .sort((a, b) => b.height - a.height); // highest quality first

      // If no separate formats, use the main URL
      if (formats.length === 0 && info.url) {
        formats.push({
          quality: 'HD',
          height: info.height || 720,
          url: info.url,
          filesize: 'Unknown'
        });
      }

      res.json({
        title: info.title || 'Pinterest Video',
        thumbnail: info.thumbnail || '',
        duration: info.duration || null,
        uploader: info.uploader || 'Pinterest',
        formats: formats
      });

    } catch (parseError) {
      console.error('Parse error:', parseError);
      res.status(500).json({ error: 'Failed to parse video info' });
    }
  });
});

// ─── Helper: format bytes ────────────────────────────────────
function formatBytes(bytes) {
  if (!bytes) return 'Unknown';
  const mb = bytes / (1024 * 1024);
  return mb > 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}

// ─── Start server ────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ PinSave backend running on port ${PORT}`);
});
