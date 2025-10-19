const fs = require("fs");
const configPath = __dirname + "/reactUnseen.json";

// Config create if not exists
if (!fs.existsSync(configPath)) {
  fs.writeFileSync(configPath, JSON.stringify({ enabled: true }, null, 2));
}

module.exports.config = {
  name: "reactunseen",
  version: "1.0.0",
  author: "MD HAMIM",
  role: 1,
  description: "Auto unseen bot message when someone reacts",
  countDown: 0
};

// যখন বট লোড হবে
module.exports.onLoad = () => {
  console.log("✅ React → Unseen system loaded (By MD HAMIM)");
};

// রিঅ্যাকশন ধরবে
module.exports.handleEvent = async function ({ event, api }) {
  const settings = JSON.parse(fs.readFileSync(configPath));
  if (!settings.enabled) return;
  if (event.type !== "message_reaction") return;

  try {
    const { messageID, threadID, userID } = event;
    if (!messageID || !threadID) return;

    const msgInfo = await api.getMessageInfo(threadID, messageID);
    const botID = api.getCurrentUserID();

    // শুধু তখন কাজ করবে যখন রিঅ্যাকশন বটের পাঠানো মেসেজে দেওয়া হয়
    if (msgInfo.messageSender && msgInfo.messageSender.userID == botID) {
      await api.markAsUnread(threadID);
      console.log(`💤 Message marked unseen (react by ${userID})`);
    }
  } catch (err) {
    console.log("❌ ReactUnseen error:", err);
  }
};

// কমান্ড সিস্টেম (on/off)
module.exports.run = async function ({ event, args, api }) {
  const settings = JSON.parse(fs.readFileSync(configPath));

  if (args[0] === "on") {
    settings.enabled = true;
    fs.writeFileSync(configPath, JSON.stringify(settings, null, 2));
    return api.sendMessage("✅ React → Unseen system ACTIVATED!", event.threadID, event.messageID);
  }

  if (args[0] === "off") {
    settings.enabled = false;
    fs.writeFileSync(configPath, JSON.stringify(settings, null, 2));
    return api.sendMessage("❌ React → Unseen system DEACTIVATED!", event.threadID, event.messageID);
  }

  return api.sendMessage(
    `🔘 React → Unseen is now: ${settings.enabled ? "ON ✅" : "OFF ❌"}\nUse: reactunseen on/off`,
    event.threadID,
    event.messageID
  );
};
