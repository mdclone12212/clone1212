const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const Canvas = require("canvas");

module.exports.config = {
  name: "joinnoti",
  version: "1.0.6",
  credits: "Maria (rX Modded) + Updated by rX Abdullah + Final Edit by Saiful Islam",
  description: "Welcome new member with profile pic, group info & Bangla rules",
  eventType: ["log:subscribe"],
  dependencies: {
    "canvas": "",
    "axios": "",
    "fs-extra": ""
  }
};

module.exports.run = async function({ api, event, Users }) {
  const { threadID, logMessageData } = event;
  const added = logMessageData.addedParticipants?.[0];
  if (!added) return;

  const userID = added.userFbId;
  const userName = added.fullName;

  const threadInfo = await api.getThreadInfo(threadID);
  const groupName = threadInfo.threadName;
  const memberCount = threadInfo.participantIDs.length;

  // Who added them
  const adderID = event.author;
  const adderName = (await Users.getNameUser(adderID)) || "Unknown";

  // Join time
  const timeString = new Date().toLocaleString("en-US", { 
    weekday: "long", 
    hour: "2-digit", 
    minute: "2-digit", 
    hour12: true 
  });

  // Background & avatar setup
  const bgURL = "https://i.postimg.cc/rmkVVbsM/r07qxo-R-Download.jpg";
  const avatarURL = `https://graph.facebook.com/${userID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

  const cacheDir = path.join(__dirname, "cache");
  fs.ensureDirSync(cacheDir);

  const bgPath = path.join(cacheDir, "bg.jpg");
  const avatarPath = path.join(cacheDir, `avt_${userID}.png`);
  const outPath = path.join(cacheDir, `welcome_${userID}.png`);

  try {
    // Download background and avatar
    const bgImg = (await axios.get(bgURL, { responseType: "arraybuffer" })).data;
    fs.writeFileSync(bgPath, Buffer.from(bgImg));
    const avatarImg = (await axios.get(avatarURL, { responseType: "arraybuffer" })).data;
    fs.writeFileSync(avatarPath, Buffer.from(avatarImg));

    // Canvas setup
    const canvas = Canvas.createCanvas(800, 500);
    const ctx = canvas.getContext("2d");
    const background = await Canvas.loadImage(bgPath);
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    const avatarSize = 180;
    const avatarX = (canvas.width - avatarSize) / 2;
    const avatarY = 100;

    // Avatar frame
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 8, 0, Math.PI * 2, false);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    const avatar = await Canvas.loadImage(avatarPath);
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
    ctx.restore();

    // Text designs
    ctx.textAlign = "center";

    // Name
    ctx.font = "bold 36px Arial";
    ctx.fillStyle = "#FFB6C1";
    ctx.fillText(userName, canvas.width / 2, avatarY + avatarSize + 50);

    // Group name
    ctx.font = "bold 30px Arial";
    ctx.fillStyle = "#00FFFF";
    ctx.fillText(groupName, canvas.width / 2, avatarY + avatarSize + 90);

    // Member number
    ctx.font = "bold 28px Arial";
    ctx.fillStyle = "#FFFF00";
    ctx.fillText(`You are the ${memberCount}th member 🎉`, canvas.width / 2, avatarY + avatarSize + 130);

    // Owner credit
    ctx.font = "bold 22px Arial";
    ctx.fillStyle = "#FF69B4";
    ctx.fillText(`Bot Owner: 𝐌𝐃 𝐇𝐀𝐌𝐈𝐌 💻`, canvas.width / 2, canvas.height - 30);

    // Save image
    const finalBuffer = canvas.toBuffer();
    fs.writeFileSync(outPath, finalBuffer);

    // ✅ Group Rules in Bangla only
    const groupRules = 
`📜 𝗚𝗥𝗢𝗨𝗣 𝗥𝗨𝗟𝗘𝗦 (গ্রুপের নিয়মাবলী) 📜
১️⃣ সকল সদস্যকে সম্মান করতে হবে 👥
২️⃣ স্প্যাম বা লিংক শেয়ার করা নিষেধ 🚫
৩️⃣ অশালীন বা আক্রমণাত্মক ভাষা ব্যবহার করা যাবে না ⚠️
৪️⃣ ভুয়া তথ্য বা গুজব ছড়ানো নিষেধ ❌
৫️⃣ অ্যাডমিনের সিদ্ধান্তই চূড়ান্ত 👑`;

    // Message send
    const message = {
      body: `━━━━━━━━━━━━━━━━━━\n` +
            `🎉 WELCOME TO THE GROUP 🎉\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `🚀 Name : @${userName}\n` +
            `🏷️ Group : ${groupName}\n` +
            `🔢 You are the ${memberCount}th member 🎉\n` +
            `⏰ Time : ${timeString}\n` +
            `👤 Added by : @${adderName}\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `${groupRules}\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `👑 Bot Owner : 𝐌𝐃 𝐇𝐀𝐌𝐈𝐌 💻`,
      mentions: [
        { tag: `@${userName}`, id: userID },
        { tag: `@${adderName}`, id: adderID }
      ],
      attachment: fs.createReadStream(outPath)
    };

    api.sendMessage(message, threadID, () => {
      fs.unlinkSync(bgPath);
      fs.unlinkSync(avatarPath);
      fs.unlinkSync(outPath);
    });

  } catch (error) {
    console.error("Joinnoti error:", error);
    api.sendMessage("⚙️ Welcome module error — check console 
