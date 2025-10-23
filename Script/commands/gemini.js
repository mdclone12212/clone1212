const fs = require("fs-extra");

module.exports.config = {
  name: "gemini",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "MD HAMIM",
  description: "All-in-one responder without any API. Replies to text, emoji, image, video, sticker.",
  commandCategory: "fun",
  usages: "Just reply or message, Gemini will respond",
  cooldowns: 3
};

module.exports.run = async function({ api, event, args }) {
  try {
    let replyText = "";

    // If user replied to a message
    if (event.messageReply) {
      const type = event.messageReply.type || "";
      switch(type) {
        case "photo":
        case "image":
          replyText = "Nice pic! 😎 What should I do with this?";
          break;
        case "video":
          replyText = "Cool video! 🎬 Got it.";
          break;
        case "sticker":
        case "animated_image":
          replyText = "Haha! 😆 I love stickers.";
          break;
        default:
          replyText = `I saw your reply: "${event.messageReply.body || 'something'}" 🤖`;
      }
    } else if (event.body) {
      const text = event.body.toLowerCase();

      // Keyword-based replies
      if (text.includes("hi") || text.includes("hello")) {
        replyText = "Hey there! 👋 How are you?";
      } else if (text.includes("how are you")) {
        replyText = "I'm Gemini, always ready to chat! 😎";
      } else if (text.includes("😂") || text.includes("lol") || text.includes("haha")) {
        replyText = "Haha! 😆 You're funny!";
      } else if (text.includes("video") || text.includes("movie")) {
        replyText = "Do you want me to make a video? 🎬";
      } else if (text.includes("image") || text.includes("pic") || text.includes("photo")) {
        replyText = "Send me a picture and I'll admire it! 📸";
      } else if (text.includes("emoji")) {
        replyText = "I love emojis! 😍🥳✨";
      } else {
        // fallback random responses
        const randomResponses = [
          "Interesting! Tell me more 😏",
          "Hmm... I'm thinking 🤔",
          "Wow, really? 😲",
          "Tell me something else! 😎",
          "I see! 🧐",
          "Cool! 😎",
          "Haha! That's funny! 😂",
          "Wow! 🌟"
        ];
        replyText = randomResponses[Math.floor(Math.random() * randomResponses.length)];
      }
    } else {
      replyText = "I see! 😎 Ask me anything!";
    }

    await api.sendMessage(replyText, event.threadID);

  } catch (err) {
    console.error(err);
    api.sendMessage("Oops! Something went wrong 🤖", event.threadID);
  }
};
