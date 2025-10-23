const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { execSync, exec } = require('child_process');
const gtts = require('google-tts-api');

module.exports.config = {
  name: 'animated',
  version: '1.0.0',
  hasPermssion: 0,
  credits: 'MD HAMIM',
  description: 'Reply to an image and run: animated <text> — converts the image+text into a short AI-style video',
  commandCategory: 'media',
  usages: 'animated <text>',
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  try {
    // Ensure ffmpeg + ffprobe are installed
    try {
      execSync('ffmpeg -version');
      execSync('ffprobe -version');
    } catch (e) {
      return api.sendMessage('Error: server-e ffmpeg/ffprobe install kora nai. Please install ffmpeg.', event.threadID);
    }

    // get the text to speak
    const text = args.join(' ').trim();
    if (!text) return api.sendMessage('Use: animated <text> (reply to an image with this command).', event.threadID);

    // check reply-to message with attachment
    if (!event.messageReply || !event.messageReply.attachments || event.messageReply.attachments.length === 0) {
      return api.sendMessage('Apni image-er reply korte hobe. Reply kore `animated <text>` bolben.', event.threadID);
    }

    // find first image attachment
    const attachment = event.messageReply.attachments.find(a => (a.type && a.type.includes('image')) || (a.mimeType && a.mimeType.startsWith('image')) || (a.url && (a.url.match(/\.(jpg|jpeg|png|webp|jfif|bmp|gif)$/i))));
    if (!attachment) return api.sendMessage('Reply kora attachment-ta image noy. Please reply to an image.', event.threadID);

    const imageUrl = attachment.url || attachment.src || attachment.previewUrl;
    if (!imageUrl) return api.sendMessage('Image-er URL pawa jacche na.', event.threadID);

    // prepare temp filenames
    const tmpDir = path.join(__dirname, 'temp_animated');
    await fs.ensureDir(tmpDir);
    const imagePath = path.join(tmpDir, `image_${Date.now()}.jpg`);
    const audioPath = path.join(tmpDir, `speech_${Date.now()}.mp3`);
    const outVideo = path.join(tmpDir, `out_${Date.now()}.mp4`);

    // download image
    const writer = fs.createWriteStream(imagePath);
    const response = await axios({ url: imageUrl, method: 'GET', responseType: 'stream' });
    await new Promise((resolve, reject) => {
      response.data.pipe(writer);
      let error = null;
      writer.on('error', err => { error = err; writer.close(); reject(err); });
      writer.on('close', () => { if (!error) resolve(); });
    });

    // create tts via google-tts-api (no api key required)
    const lang = 'en'; // change if you want Bangla: 'bn'
    const ttsUrl = gtts.getAudioUrl(text, {
      lang,
      slow: false,
      host: 'https://translate.google.com',
    });

    // download tts audio
    const audioResp = await axios({ url: ttsUrl, method: 'GET', responseType: 'stream' });
    const aw = fs.createWriteStream(audioPath);
    await new Promise((resolve, reject) => {
      audioResp.data.pipe(aw);
      let err = null;
      aw.on('error', e => { err = e; aw.close(); reject(e); });
      aw.on('close', () => { if (!err) resolve(); });
    });

    // get audio duration using ffprobe (seconds)
    let duration = 5; // fallback
    try {
      const probe = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`).toString().trim();
      duration = Math.max( Math.ceil(parseFloat(probe) || 5), 3 );
    } catch (e) {
      // fallback to 5s
    }

    // create video from image + audio using ffmpeg
    // simple pan/zoom effect using zoompan can be expensive; here we do a subtle scale + fade in/out
    const fps = 25;
    const frames = duration * fps;

    // Build ffmpeg command
    // - loop image, apply subtle zoom using zoompan, combine with audio, set duration to audio length
    // Note: zoompan requires libx264 and enough frames; if zoompan causes issues, the fallback will be static image video.
    const ffCmd = `ffmpeg -y -loop 1 -i "${imagePath}" -i "${audioPath}" -filter_complex "[0:v]scale=1280:720,zoompan=z='if(eq(on,1),1.0,zoom+0.0008)':d=${frames}:s=1280x720:fps=${fps},format=yuv420p[v]" -map "[v]" -map 1:a -c:v libx264 -preset veryfast -c:a aac -shortest -t ${duration} "${outVideo}"`;

    try {
      execSync(ffCmd, { stdio: 'ignore', maxBuffer: 1024 * 1024 * 10 });
    } catch (e) {
      // fallback: plain static image to video
      const ffFallback = `ffmpeg -y -loop 1 -i "${imagePath}" -i "${audioPath}" -c:v libx264 -t ${duration} -pix_fmt yuv420p -c:a aac -shortest "${outVideo}"`;
      execSync(ffFallback, { stdio: 'ignore' });
    }

    // send video back
    await api.sendMessage({ body: 'Here is your animated video', attachment: fs.createReadStream(outVideo) }, event.threadID, () => {
      // cleanup files after send
      setTimeout(() => {
        try { fs.removeSync(tmpDir); } catch (e) {}
      }, 5000);
    });

  } catch (err) {
    console.error(err);
    return api.sendMessage('Kichu vul hoyeche: ' + (err.message || err), event.threadID);
  }
};
