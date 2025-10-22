const { spawn } = require("child_process");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports.config = {
  name: "aivideo",
  version: "2.0.0",
  hasPermssion: 2,
  credits: "MD HAMIM",
  description: "Convert replied photo to AI-style video with your own caption (Admin only)",
  commandCategory: "admin",
  usages: "[reply photo] .aivideo <your caption>",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID, type, messageReply } = event;

  // ✅ Auto admin detection from config.json
  const adminList = global.config?.ADMINBOT || global.config?.ADMIN || [];
  if (!adminList.includes(senderID)) {
    return api.sendMessage("❌ এই কমান্ডটি শুধুমাত্র অ্যাডমিনদের জন্য!", threadID, messageID);
  }

  // ✅ Check for replied image
  if (type !== "message_reply" || !messageReply.attachments || messageReply.attachments[0].type !== "photo") {
    return api.sendMessage("📸 অনুগ্রহ করে কোনো ছবির রিপ্লাই দিয়ে কমান্ড দিন!", threadID, messageID);
  }

  const caption = args.join(" ") || "AI Generated Video";
  const imgURL = messageReply.attachments[0].url;
  const cachePath = path.join(__dirname, `/cache/${Date.now()}.jpg`);
  const outputPath = path.join(__dirname, `/cache/${Date.now()}_aivideo.mp4`);

  try {
    const res = await axios.get(imgURL, { responseType: "arraybuffer" });
    fs.writeFileSync(cachePath, Buffer.from(res.data, "binary"));

    api.sendMessage("🎬 ভিডিও তৈরি হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...", threadID, messageID);

    // ✅ Generate AI-style zoom video with caption
    const ffmpeg = spawn("ffmpeg", [
      "-loop", "1",
      "-i", cachePath,
      "-vf",
      `zoompan=z='zoom+0.001':d=125, drawtext=text='${caption}':x=(w-text_w)/2:y=h-(text_h*2):fontcolor=white:fontsize=36:shadowcolor=black:shadowx=2:shadowy=2`,
      "-t", "5",
      "-pix_fmt", "yuv420p",
      "-y", outputPath
    ]);

    ffmpeg.on("close", async () => {
      await api.sendMessage({
        body: `✨ ভিডিও তৈরি সম্পন্ন!\n💬 Caption: ${caption}\n© MD HAMIM`,
        attachment: fs.createReadStream(outputPath)
      }, threadID, () => {
        fs.unlinkSync(cachePath);
        fs.unlinkSync(outputPath);
      });
    });

  } catch (err) {
    console.error(err);
    return api.sendMessage("⚠️ ভিডিও তৈরি করতে সমস্যা হয়েছে!", threadID, messageID);
  }
};
