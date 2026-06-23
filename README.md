# PinSave Backend

Pinterest video downloader backend using yt-dlp.

## Deploy on Railway (Free)

1. Go to https://railway.app and sign up (free)
2. Click "New Project" → "Deploy from GitHub repo"
3. Upload these files to a GitHub repo first, OR use Railway CLI
4. Railway will auto-detect and deploy!

## API Usage

### Get video info:
GET /api/info?url=https://pin.it/xxxxx

### Response:
```json
{
  "title": "Video title",
  "thumbnail": "https://...",
  "formats": [
    { "quality": "720p", "url": "https://...", "filesize": "5.2 MB" }
  ]
}
```
