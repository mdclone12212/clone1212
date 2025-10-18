const fs = require("fs");
const pathData = __dirname + "/cache/autoReactToggle.json";

// Cache folder check
if (!fs.existsSync(__dirname + "/cache")) fs.mkdirSync(__dirname + "/cache");
if (!fs.existsSync(pathData)) fs.writeFileSync(pathData, JSON.stringify({}));

const loadData = () => JSON.parse(fs.readFileSync(pathData));
const saveData = (data) => fs.writeFileSync(pathData, JSON.stringify(data, null, 2));

module.exports.config = {
  name: "autoReactUnseen",
  version: "2.0",
  hasPermssion: 0,
  credits: "Md Hamim",
  description: "Reaction দিলে মেসেজ auto unseen হবে (ON/OFF)",
  commandCategory: "system",
  usages: "[on/off/status]",
  cooldowns: 3,
};

module.exports.handleReaction = async function ({ api, event }) {
  const { threadID, reaction } = event;
  if (!reaction || reaction === "") return;

  const data = loadData();
  if (!data[threadID] || data[threadID].enabled !== true) return; // Only active threads

  try {
    await api.markAsUnread(threadID); // Auto unseen
  } catch (err) {
    console.error("❌ AutoReactUnseen Error:", err);
  }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID } = event;
  const data = loadData();
  if (!data[threadID]) data[threadID] = { enabled: false };

  const option = args[0]?.toLowerCase();

  switch (option) {
    case "on":
      data[threadID].enabled = true;
      saveData(data);
      return api.sendMessage(
        "✅ AutoReactUnseen চালু করা হয়েছে!\n👑 Credit: Md Hamim",
        threadID
      );

    case "off":
      data[threadID].enabled = false;
      saveData(data);
      return api.sendMessage(
        "🔴 AutoReactUnseen বন্ধ করা হয়েছে!\n👑 Credit: Md Hamim",
        threadID
      );

    case "status":
      return api.sendMessage(
        `📊 AutoReactUnseen Status: ${
          data[threadID].enabled ? "🟢 ON" : "🔴 OFF"
        }\n👑 Credit: Md Hamim`,
        threadID
      );

    default:
      return api.sendMessage(
        `🌈 AutoReactUnseen Commands:
🟢 /autoReactUnseen on — চালু করো
🔴 /autoReactUnseen off — বন্ধ করো
📊 /autoReactUnseen status — অবস্থা দেখো
👑 Credit: Md Hamim`,
        threadID
      );
  }
};
