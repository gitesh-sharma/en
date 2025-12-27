import express from "express";
import { join } from "path";
import youtubedl from "youtube-dl-exec"; // runs yt-dlp behind the scenes

const app = express();
app.use(express.static("public"));
app.use(express.json());

// API: fetch download links and metadata
app.post("/api/getLinks", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "No URL provided" });

    // Extract video metadata + formats (JSON only, no auto download)
    const info = await youtubedl(url, {
      dumpSingleJson: true,
      noWarnings: true,
      noCheckCertificates: true,
      preferFreeFormats: true
    });

    // Filter for MP4 formats
    const mp4Formats = (info?.formats || []).filter(f => f.format.includes("mp4"));

    res.json({
      title: info.title,
      thumbnail: info.thumbnail,
      formats: mp4Formats.map(f => ({
        quality: f.format_note,
        url: f.url
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch links" });
  }
});

// Start server
app.listen(3000, () => console.log("Server running on http://localhost:3000"));
