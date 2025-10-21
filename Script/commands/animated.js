const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");

module.exports.config = {
  name: "animated",
  version: "1.0.1",
  hasPermssion: 0,
  credits: "MD HAMIM",
  description: "Reply an image + text to generate a short animated video",
  commandCategory: "media",
  usages: "animated <text> (reply to an image)",
  cooldowns: 5,
};

module.exports.run = async ({ api, event, args }) => {
  try {
    const text = args.join(" ");
    if (!text) {
      return api.sendMessage(
        "❗ অনুগ্রহ করে `animated <text>` লিখুন এবং কোনো ছবিতে reply করুন।",
        event.threadID,
        event.messageID
      );
    }

    // Find image URL from reply
    let imageUrl;
    if (event.messageReply && event.messageReply.attachments?.length) {
      const att = event.messageReply.attachments.find(a => a.type?.includes("image"));
      if (att) imageUrl = att.url;
    }

    if (!imageUrl) {
      return api.sendMessage(
        "❗ অনুগ্রহ করে কোনো ছবিতে reply করুন।",
        event.threadID,
        event.messageID
      );
    }

    // Prepare temp folder
    const tmpDir = path.join(__dirname, "temp_animated");
    await fs.ensureDir(tmpDir);
    const imgPath = path.join(tmpDir, "input.jpg");
    const outPath = path.join(tmpDir, "output_video.mp4");

    // Download image
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    await fs.writeFile(imgPath, Buffer.from(response.data));

    // Font path (system default or provide ttf)
    let fontPath = path.join(__dirname, "arial.ttf"); // place arial.ttf in same folder or change path
    // If font file not exist, ffmpeg will use default system font

    // FFmpeg command: create short animated video
    await new Promise((resolve, reject) => {
      ffmpeg(imgPath)
        .inputOptions(["-loop 1"])
        .videoFilters([
          `scale=720:-1`,
          `zoompan=z='if(lte(on,50),1+0.003*on,1.15-0.003*(on-50))':d=100:s=720x720`,
          `drawtext=text='${text.replace(/:/g,"\\:").replace(/'/g,"\\'")}':fontfile='${fontPath}':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2:alpha='if(lt(t,2),t/2,if(lt(t,6),(6-t)/4,1))'`
        ])
        .outputOptions([
          "-t 8",
          "-r 25",
          "-pix_fmt yuv420p"
        ])
        .on("end", resolve)
        .on("error", reject)
        .save(outPath);
    });

    // Send video
    await api.sendMessage(
      {
        body: `🎬 তোমার অ্যানিমেটেড ভিডিও তৈরি হয়েছে!\n✨ ক্রেডিট: MD HAMIM`,
        attachment: fs.createReadStream(outPath),
      },
      event.threadID,
      () => fs.remove(tmpDir).catch(() => {}),
      event.messageID
    );

  } catch (err) {
    console.error(err);
    api.sendMessage(
      `⚠️ ভিডিও বানাতে সমস্যা হয়েছে!\nসম্ভবত ffmpeg ইনস্টল নেই বা text-এ special character সমস্যা।\nError: ${err.message}`,
      event.threadID,
      event.messageID
    );
  }
};
