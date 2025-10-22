const fs = require("fs");
const { exec } = require("child_process");
const path = require("path");

module.exports.config = {
  name: "animated",
  version: "3.0.0",
  hasPermssion: 0,
  credits: "MD HAMIM (Final Advanced Edition)",
  description: "Offline Image to Animated Video (zoom, fade, text, bg music, compatible)",
  commandCategory: "fun",
  usages: "reply image + animated [text]",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  try {
    if (!event.messageReply || !event.messageReply.attachments || event.messageReply.attachments.length === 0)
      return api.sendMessage("🖼️ প্রথমে একটা image এর reply দিতে হবে!", event.threadID, event.messageID);

    const imgUrl = event.messageReply.attachments[0].url;
    const msgText = args.join(" ") || "Animated Video";

    const cacheDir = path.join(__dirname, "/cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    const imgPath = path.join(cacheDir, `${Date.now()}.jpg`);
    const videoPath = imgPath.replace(".jpg", ".mp4");
    const bgMusic = path.join(cacheDir, "bg.mp3");

    // 🖼️ Download image
    const download = require("image-downloader");
    await download.image({ url: imgUrl, dest: imgPath });

    // 🎵 Background music optional (if not exists, create dummy)
    if (!fs.existsSync(bgMusic)) {
      fs.writeFileSync(bgMusic, Buffer.alloc(1)); // create silent audio file
    }

    // 🎬 Random duration (5–20 sec)
    const duration = Math.floor(Math.random() * 16) + 5;

    // 🌀 ffmpeg command (optimized for all players)
    const cmd = `ffmpeg -loop 1 -i "${imgPath}" -i "${bgMusic}" -filter_complex "[0:v]zoompan=z='min(zoom+0.002,1.3)':s=720x720,fade=t=in:st=0:d=1,fade=t=out:st=${duration - 1}:d=1,drawtext=text='${msgText}':fontcolor=white:fontsize=40:x=(w-text_w)/2:y=h-80:shadowcolor=black:shadowx=2:shadowy=2[v]" -map "[v]" -map 1:a -c:v libx264 -c:a aac -movflags +faststart -preset veryfast -shortest -t ${duration} -pix_fmt yuv420p -y "${videoPath}"`;

    exec(cmd, async (err, stdout, stderr) => {
      if (err) {
        console.log("❌ ffmpeg error:", err);
        console.log(stderr);
        return api.sendMessage("⚠️ ভিডিও তৈরি করতে সমস্যা হয়েছে!", event.threadID, event.messageID);
      }

      // ✅ Send final video
      api.sendMessage({
        body: `✨ তোমার Advanced Animated ভিডিও (${duration}s) তৈরি হয়েছে!`,
        attachment: fs.createReadStream(videoPath)
      }, event.threadID, () => {
        // clean up cache
        fs.unlinkSync(imgPath);
        fs.unlinkSync(videoPath);
      });
    });

  } catch (e) {
    console.log(e);
    api.sendMessage("⚠️ কিছু একটা সমস্যা হয়েছে!", event.threadID, event.messageID);
  }
};
