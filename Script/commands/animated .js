const fs = require("fs");
const { exec } = require("child_process");

module.exports.config = {
  name: "animated",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "MD HAMIM",
  description: "Image to video conversion (API free) with optional text",
  commandCategory: "Fun",
  usages: "animated <duration_per_image_in_sec> [text]",
  cooldowns: 5
};

module.exports.run = async ({ api, event, args }) => {
  const durationPerImage = parseInt(args[0]) || 3;
  const overlayText = args.slice(1).join(" ") || "";

  // Check for replied images
  if (!event.messageReply || !event.messageReply.attachments) {
    return api.sendMessage("Reply koro ekta image or multiple images ke video te convert korar jonno!", event.threadID, event.messageID);
  }

  const attachments = event.messageReply.attachments;
  const downloadedImages = [];

  // Download all images locally
  const axios = require("axios");
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
  const fileContent = downloadedImages.map(img => `file '${img}'\nduration ${durationPerImage}`).join("\n");
  fs.writeFileSync(listFile, fileContent);

  const videoPath = "/tmp/output.mp4";

  // ffmpeg command
  let ffmpegCmd = `ffmpeg -f concat -safe 0 -i ${listFile} -vsync vfr -pix_fmt yuv420p ${videoPath}`;
  if (overlayText) {
    ffmpegCmd = `ffmpeg -f concat -safe 0 -i ${listFile} -vf "drawtext=text='${overlayText}':fontcolor=white:fontsize=30:x=(w-text_w)/2:y=(h-text_h)/2" -vsync vfr -pix_fmt yuv420p ${videoPath}`;
  }

  exec(ffmpegCmd, (error) => {
    if (error) return api.sendMessage("Video convert korte problem hoise!", event.threadID, event.messageID);

    api.sendMessage({ body: "✅ Video ready!", attachment: fs.createReadStream(videoPath) }, event.threadID, () => {
      downloadedImages.forEach(img => fs.unlinkSync(img));
      fs.unlinkSync(listFile);
      fs.unlinkSync(videoPath);
    }, event.messageID);
  });
};
