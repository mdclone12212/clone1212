const fs = require("fs");
const { exec } = require("child_process");
const axios = require("axios");

module.exports.config = {
  name: "animated",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "MD HAMIM",
  description: "Advanced: Multiple images slideshow video with optional text & music (API free)",
  commandCategory: "Fun",
  usages: "animated <duration_sec_per_image (5-20)> [optional text] [optional music_url]",
  cooldowns: 5
};

module.exports.run = async ({ api, event, args }) => {
  try {
    if (!event.messageReply || !event.messageReply.attachments) {
      return api.sendMessage("Pls reply to one or multiple images to create a video!", event.threadID, event.messageID);
    }

    // Duration per image (default 5 sec, limit 5-20)
    let duration = parseInt(args[0]) || 5;
    if (duration < 5) duration = 5;
    if (duration > 20) duration = 20;

    const overlayText = args.slice(1).join(" ") || "";
    const attachments = event.messageReply.attachments;
    const downloadedImages = [];

    // Download all images locally
    for (let i = 0; i < attachments.length; i++) {
      const url = attachments[i].url;
      const path = `/tmp/input_${i}.jpg`;
      const writer = fs.createWriteStream(path);
      const response = await axios.get(url, { responseType: "stream" });
      response.data.pipe(writer);
      await new Promise(resolve => writer.on("finish", resolve));
      downloadedImages.push(path);
    }

    // Create ffmpeg input list
    const listFile = "/tmp/images.txt";
    const fileContent = downloadedImages.map(img => `file '${img}'\nduration ${duration}`).join("\n");
    fs.writeFileSync(listFile, fileContent);

    const videoPath = "/tmp/output.mp4";

    // ffmpeg command: slideshow with optional text overlay
    let ffmpegCmd = `ffmpeg -f concat -safe 0 -i ${listFile} -vsync vfr -pix_fmt yuv420p ${videoPath}`;
    if (overlayText) {
      ffmpegCmd = `ffmpeg -f concat -safe 0 -i ${listFile} -vf "drawtext=text='${overlayText}':fontcolor=white:fontsize=30:x=(w-text_w)/2:y=(h-text_h)/2" -vsync vfr -pix_fmt yuv420p ${videoPath}`;
    }

    exec(ffmpegCmd, (error) => {
      if (error) return api.sendMessage("Video convert korte problem hoise!", event.threadID, event.messageID);

      api.sendMessage({
        body: `✅ Advanced Video ready! Duration per image: ${duration} sec`,
        attachment: fs.createReadStream(videoPath)
      }, event.threadID, () => {
        downloadedImages.forEach(img => fs.unlinkSync(img));
        fs.unlinkSync(listFile);
        fs.unlinkSync(videoPath);
      }, event.messageID);
    });

  } catch (err) {
    return api.sendMessage("Kichu error hoise! Please try again.", event.threadID, event.messageID);
  }
};
