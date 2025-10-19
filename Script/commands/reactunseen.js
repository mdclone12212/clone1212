
const fs = require("fs");
const file = __dirname + "/reactUnseen.json";

// Default config create if not exist
if (!fs.existsSync(file)) {
  fs.writeFileSync(
    file,
    JSON.stringify({ enabled: true, emojis: ["❤️", "😂", "😡"] }, null, 2)
  );
}

module.exports.config = {
  name: "reactunseen",
  version: "3.0.0",
  author: "MD HAMIM",
  role: 1,
  description: "Auto unseen bot message on selected emoji reaction (Messenger)",
  countDown: 0
};

// When someone reacts on bot message
module.exports.handleEvent = async function ({ event, api }) {
  const data = JSON.parse(fs.readFileSync(file));
  if (!data.enabled) return;
  if (event.type !== "message_reaction") return;

  try {
    const { threadID, messageID, reaction, userID } = event;
    const botID = api.getCurrentUserID();

    // Fetch info about reacted message
    const msgInfo = await api.getMessageInfo(threadID, messageID);

    // যদি রিঅ্যাক্ট করা মেসেজ বট পাঠায়, এবং নির্দিষ্ট ইমোজি মিলে যায়
    if (
      msgInfo.messageSender &&
      msgInfo.messageSender.userID == botID &&
      data.emojis.includes(reaction)
    ) {
      // Unseen/mark unread
      await api.markAsUnread(threadID);
      console.log(`💤 Unseen triggered (Emoji: ${reaction} by ${userID})`);
    }
  } catch (err) {
    console.log("❌ ReactUnseen Error:", err);
  }
};

// Command system
module.exports.run = async function ({ event, args, api }) {
  const data = JSON.parse(fs.readFileSync(file));
  const option = (args[0] || "").toLowerCase();
  const emoji = args[1];

  switch (option) {
    case "on":
      data.enabled = true;
      fs.writeFileSync(file, JSON.stringify(data, null, 2));
      return api.sendMessage("✅ React→Unseen system ACTIVATED!", event.threadID);

    case "off":
      data.enabled = false;
      fs.writeFileSync(file, JSON.stringify(data, null, 2));
      return api.sendMessage("❌ React→Unseen system DEACTIVATED!", event.threadID);

    case "add":
      if (!emoji) return api.sendMessage("⚠️ Example: reactunseen add 😍", event.threadID);
      if (data.emojis.includes(emoji)) return api.sendMessage("⚠️ এই emoji আগেই যোগ করা আছে!", event.threadID);
      data.emojis.push(emoji);
      fs.writeFileSync(file, JSON.stringify(data, null, 2));
      return api.sendMessage(`✅ Emoji ${emoji} সফলভাবে যোগ হলো!`, event.threadID);

    case "remove":
      if (!emoji) return api.sendMessage("⚠️ Example: reactunseen remove 😍", event.threadID);
      if (!data.emojis.includes(emoji)) return api.sendMessage("⚠️ এই emoji তালিকায় নেই!", event.threadID);
      data.emojis = data.emojis.filter((e) => e !== emoji);
      fs.writeFileSync(file, JSON.stringify(data, null, 2));
      return api.sendMessage(`❌ Emoji ${emoji} মুছে ফেলা হলো!`, event.threadID);

    case "list":
      return api.sendMessage(
        `📋 বর্তমান Emoji তালিকা:\n${data.emojis.join(" ")}\n\n🔘 System: ${data.enabled ? "ON ✅" : "OFF ❌"}\n\nUse:\nreactunseen add 😍\nreactunseen remove 😍\nreactunseen on/off`,
        event.threadID
      );

    default:
      return api.sendMessage(
        `⚙️ ReactUnseen (By MD HAMIM)\nStatus: ${data.enabled ? "🟢 ON" : "🔴 OFF"}\nবর্তমান Emoji: ${data.emojis.join(
          " "
        )}\n\nCommands:\n• reactunseen on/off\n• reactunseen add 😍\n• reactunseen remove 😍\n• reactunseen list`,
        event.threadID
      );
  }
};
