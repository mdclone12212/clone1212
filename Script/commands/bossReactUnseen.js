const fs = require("fs");
const pathData = __dirname + "/cache/bossReactData.json";

if (!fs.existsSync(pathData)) fs.writeFileSync(pathData, JSON.stringify({}));

const loadData = () => JSON.parse(fs.readFileSync(pathData));
const saveData = (data) => fs.writeFileSync(pathData, JSON.stringify(data, null, 2));

// Emoji & funny lines + GIFs
const emojis = ["⚡", "🔥", "💥", "🌈", "💫", "🤖", "👀", "😎", "😂"];
const lines = [
  "ভাই একটু ধীরেস্ঠির 😅",
  "এই reaction পছন্দ হয়নি 😏",
  "চুপচাপ থাকো 🤐",
  "Alert! Ultra unseen active ⚡",
  "Md Hamim Auto Unseen System 🤖",
];
const gifs = [
  "https://i.ibb.co/album1/funny1.gif",
  "https://i.ibb.co/album1/funny2.gif",
  "https://i.ibb.co/album1/funny3.gif",
  "https://i.ibb.co/album1/funny4.gif",
];

module.exports.config = {
  name: "bossReactUnseen",
  version: "5.0",
  hasPermssion: 0,
  credits: "Md Hamim",
  description: "Ultimate Mirai Boss Level React-Unseen System",
  commandCategory: "system",
  usages: "[on/off/status/delete]",
  cooldowns: 3,
};

module.exports.handleReaction = async function ({ api, event }) {
  const { threadID, messageID, userID, reaction } = event;
  if (!reaction || reaction === "") return;

  const data = loadData();
  if (!data[threadID]) data[threadID] = { enabled: true, autoDelete: false };

  if (!data[threadID].enabled) return;

  try {
    // Auto unseen effect
    await api.markAsUnread(threadID);

    // Random emoji, line, gif
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    const line = lines[Math.floor(Math.random() * lines.length)];
    const gif = gifs[Math.floor(Math.random() * gifs.length)];

    // Optional auto delete
    if (data[threadID].autoDelete) {
      try { await api.unsendMessage(messageID); } catch {}
    }

    return api.sendMessage(
      {
        body: `${emoji}━━━[ Reaction Detected ]━━━${emoji}\n` +
          `👤 UserID: ${userID}\n💬 Reaction: ${reaction}\n💫 ${line}\n\n👑 Credit: Md Hamim`,
        attachment: (await global.downloadFile(gif))
      },
      threadID,
      messageID
    );
  } catch (err) {
    console.error("❌ BossReactUnseen Error:", err);
  }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID } = event;
  const data = loadData();
  if (!data[threadID]) data[threadID] = { enabled: true, autoDelete: false };

  const option = args[0]?.toLowerCase();

  switch (option) {
    case "on":
      data[threadID].enabled = true;
      saveData(data);
      return api.sendMessage(
        "✅ Boss React-Unseen System চালু হয়েছে!\n👑 Credit: Md Hamim",
        threadID
      );

    case "off":
      data[threadID].enabled = false;
      saveData(data);
      return api.sendMessage(
        "🔴 Boss React-Unseen System বন্ধ করা হয়েছে!\n👑 Credit: Md Hamim",
        threadID
      );

    case "delete":
      data[threadID].autoDelete = !data[threadID].autoDelete;
      saveData(data);
      return api.sendMessage(
        `🗑️ Auto Delete is now: ${
          data[threadID].autoDelete ? "✅ ON" : "❌ OFF"
        }\n👑 Credit: Md Hamim`,
        threadID
      );

    case "status":
      return api.sendMessage(
        `📊 Boss React-Unseen Status:\n` +
          `🟢 Enabled: ${data[threadID].enabled ? "ON" : "OFF"}\n` +
          `🗑️ Auto Delete: ${data[threadID].autoDelete ? "ON" : "OFF"}\n👑 Credit: Md Hamim`,
        threadID
      );

    default:
      return api.sendMessage(
        `🌈 Boss React-Unseen Commands:
🟢 /bossReactUnseen on — চালু করো
🔴 /bossReactUnseen off — বন্ধ করো
🗑️ /bossReactUnseen delete — auto delete toggle
📊 /bossReactUnseen status — অবস্থা দেখো
👑 Credit: Md Hamim`,
        threadID
      );
  }
};
