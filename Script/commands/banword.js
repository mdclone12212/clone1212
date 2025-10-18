module.exports.config = {
  name: "banword",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Md Hamim",
  description: "Delete or warn if banned words are used",
  commandCategory: "group",
  usages: "[auto detect]",
  cooldowns: 3,
};

const bannedWords = [
  "fuck",
  "bitch",
  "nude",
  "sex",
  "spam",
  "badword"
];

const warningData = {};

module.exports.handleEvent = async function ({ api, event, Users, Threads }) {
  const { threadID, messageID, senderID, body } = event;
  if (!body) return;

  const text = body.toLowerCase();

  for (const word of bannedWords) {
    if (text.includes(word)) {
      try {
        // Delete the offending message
        await api.unsendMessage(messageID);
      } catch (e) {
        console.log("❌ Message delete failed:", e.message);
      }

      // Warning system
      if (!warningData[threadID]) warningData[threadID] = {};
      if (!warningData[threadID][senderID]) warningData[threadID][senderID] = 0;

      warningData[threadID][senderID]++;

      const warnCount = warningData[threadID][senderID];

      if (warnCount < 3) {
        return api.sendMessage(
          `🚫 নিষিদ্ধ শব্দ ব্যবহার করা হয়েছে!\n⚠️ সতর্কতা ${warnCount}/3\n\nদয়া করে এমন ভাষা ব্যবহার করবেন না।\n\n👑 Credit: Md Hamim`,
          threadID
        );
      } else {
        // After 3 warnings, kick user (if admin permission)
        warningData[threadID][senderID] = 0;
        try {
          await api.removeUserFromGroup(senderID, threadID);
          return api.sendMessage(
            `❌ ${senderID} কে গ্রুপ থেকে বাদ দেওয়া হয়েছে কারণ সে ৩ বার নিষিদ্ধ শব্দ ব্যবহার করেছে!\n👑 Credit: Md Hamim`,
            threadID
          );
        } catch (e) {
          return api.sendMessage(
            `⚠️ ${senderID} নিষিদ্ধ শব্দ বারবার ব্যবহার করেছে কিন্তু আমি তাকে রিমুভ করতে পারিনি (admin প্রয়োজন)।\n👑 Credit: Md Hamim`,
            threadID
          );
        }
      }
    }
  }
};

module.exports.run = async function ({ api, event }) {
  return api.sendMessage(
    `🧠 Banword System Active\n\nযে কেউ নিচের শব্দ বললে message auto delete + warn পাবে।\n\n🔞 Word List:\n${bannedWords.join(", ")}\n\n👑 Credit: Md Hamim`,
    event.threadID
  );
};
