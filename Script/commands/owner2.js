const request = require("request");
const fs = require("fs-extra");

module.exports.config = {
 name: "owner2",
 version: "1.0.1",
 hasPermssion: 0,
 credits: "Shahadat SAHU",
 description: "Display bot owner's information",
 commandCategory: "Info",
 usages: "",
 cooldowns: 5,
 dependencies: {
 request: "",
 "fs-extra": "",
 axios: ""
 }
};

module.exports.run = async function ({ api, event }) {
 const imageUrl = "https://i.imgur.com/7cvW4mX.png";
 const path = __dirname + "/cache/owner.png";

 request(imageUrl)
 .pipe(fs.createWriteStream(path))
 .on("close", () => {
 api.sendMessage({
 body:
`╔═❖═❖═❖═❖═❖═❖═❖═❖═╗ 
║ ✨ 𝗢𝗪𝗡𝗘𝗥 𝗜𝗡𝗙𝗢 ✨
╠❖═❖═❖═❖═❖═❖═❖═❖═ ═ 
║ 👑 𝗡𝗮𝗺𝗲 : 𝗦𝘂𝗹𝗮𝗶𝗺𝗮𝗻 𝗛𝗼𝘀𝘀𝗮𝗶𝗻 𝗔𝗸𝗮𝘀𝗵
║ 🧸 𝗡𝗶𝗰𝗸 𝗡𝗮𝗺𝗲 : 𝗔𝗞𝗔𝗦𝗛
║ 🎂 𝗔𝗴𝗲 : 20+
║ 💘 𝗥𝗲𝗹𝗮𝘁𝗶𝗼𝗻 : 𝗦𝗶𝗻𝗴𝗹𝗲
║ 🎓 𝗣𝗿𝗼𝗳𝗲𝘀𝘀𝗶𝗼𝗻 : 𝗦𝘁𝘂𝗱𝗲𝗻𝘁
║ 📚 𝗘𝗱𝘂𝗰𝗮𝘁𝗶𝗼𝗻 : 𝗠𝗮𝗱𝗿𝗮𝘀𝗮𝗵
║ 🏡 𝗔𝗱𝗱𝗿𝗲𝘀𝘀 : 𝗞𝗵𝘂𝗹𝗻𝗮
╠❖═❖═❖═❖═❖═❖═❖═❖═ ═✿
║ 🔗 𝗖𝗢𝗡𝗧𝗔𝗖𝗧 𝗟𝗜𝗡𝗞𝗦
╠❖═❖═❖═❖═❖═❖═❖═❖═ ═✿
║ 📘 𝗙𝗮𝗰𝗲𝗯𝗼𝗼𝗸 :
║ fb.com/100030807632691
║ 💬 𝗠𝗲𝘀𝘀𝗲𝗻𝗴𝗲𝗿 :
║ m.me/100030807632691
║ 📞 𝗪𝗵𝗮𝘁𝘀𝗔𝗽𝗽 :
║ wa.me/01754247846
║ ✈️ 𝗧𝗲𝗹𝗲𝗴𝗿𝗮𝗺 :
║ t.me/yourakash
╚❖═❖═❖═❖═❖═❖═❖═❖══╝✿

🤖 𝗕𝗢𝗧 𝗕𝗬: —͟͟͞͞𝗛𝗔𝗠𝗜𝗠 𝗖𝗛𝗔𝗧 𝗕𝗢𝗧—͟͟͞͞
`,
 attachment: fs.createReadStream(path)
 }, event.threadID, () => fs.unlinkSync(path));
 });
};
