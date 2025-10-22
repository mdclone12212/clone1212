const fs = require("fs-extra");
const path = require("path");
const fetch = require("node-fetch");
const ffmpeg = require("fluent-ffmpeg");
const { v4: uuidv4 } = require("uuid");

const TMP_DIR = path.resolve(__dirname, 'aivideo_temp');
fs.ensureDirSync(TMP_DIR);

// Store recent image message info per thread
const lastImageMap = new Map();

module.exports.config = {
  name: "aivideo",
  version: "1.1.0",
  hasPermssion: 0,
  credits: "MD HAMIM",
  description: "Convert replied image + text into short AI video (ffmpeg required). Includes watermark.",
  commandCategory: "media",
  usages: "aivideo <text>",
  cooldowns: 5
};

// Helper: Download file
async function downloadFile(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download image: ${res.status}`);
  const buffer = await res.buffer();
  await fs.writeFile(dest, buffer);
  return dest;
}

// Helper: Create video with text overlay and watermark
function createVideo({ image, out, text }) {
  return new Promise((resolve, reject) => {
    const srtPath = path.join(TMP_DIR, `${uuidv4()}.srt`);
    const duration = 7;
    const srtText = `1\n00:00:00,000 --> 00:00:${String(duration).padStart(2, '0')},000\n${text}\n`;
    fs.writeFileSync(srtPath, srtText);

    ffmpeg()
      .input(image)
      .loop(duration)
      .videoFilters([
        // scale + zoompan + subtitles + watermark
        `scale=1280:720,zoompan=z='min(zoom+0.0015,1.1)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)',fps=25,subtitles=${srtPath}:force_style='FontName=Arial,Fontsize=36,PrimaryColour=&H00FFFFFF,Alignment=2',drawtext=text='MD HAMIM':x=w-tw-10:y=h-th-10:fontsize=24:fontcolor=white:shadowcolor=black:shadowx=2:shadowy=2`
      ])
      .outputOptions(['-pix_fmt yuv420p', `-t ${duration}`])
      .on('end', () => {
        try { fs.unlinkSync(srtPath); } catch {}
        resolve(out);
      })
      .on('error', err => reject(err))
      .save(out);
  });
}

module.exports.run = async function({ api, event, args }) {
  try {
    const { threadID, messageID, attachments, messageReply } = event;

    // STEP 1: Detect if it's an image message
    if (attachments && attachments[0] && attachments[0].type === 'photo') {
      const imageURL = attachments[0].url;
      const localPath = path.join(TMP_DIR, `${uuidv4()}.jpg`);
      await downloadFile(imageURL, localPath);
      lastImageMap.set(threadID, { messageID, path: localPath });
      return api.sendMessage("✅ Image saved! Now reply with → aivideo <your text>", threadID, messageID);
    }

    // STEP 2: If command triggered
    if (!args[0]) return api.sendMessage("❌ Please use: aivideo <text>", threadID, messageID);
    const text = args.join(" ");

    // STEP 3: Check replied message or last saved image
    let targetImage = null;
    if (messageReply && messageReply.messageID) {
      const found = Array.from(lastImageMap.values()).find(info => info.messageID === messageReply.messageID);
      if (found) targetImage = found.path;
    }
    if (!targetImage && lastImageMap.has(threadID)) targetImage = lastImageMap.get(threadID).path;

    if (!targetImage) return api.sendMessage("⚠️ No image found! Please send an image first.", threadID, messageID);

    // STEP 4: Generate video
    const outVideo = path.join(TMP_DIR, `${uuidv4()}.mp4`);
    api.sendMessage("🎬 Generating your AI video with watermark, please wait...", threadID, messageID);

    await createVideo({ image: targetImage, out: outVideo, text });

    // STEP 5: Send video
    api.sendMessage({
      body: `✨ Here's your AI video!\nCredit: MD HAMIM`,
      attachment: fs.createReadStream(outVideo)
    }, threadID, () => {
      fs.unlinkSync(outVideo);
    });

  } catch (err) {
    console.error(err);
    api.sendMessage(`❌ Error: ${err.message}`, event.threadID, event.messageID);
  }
};
