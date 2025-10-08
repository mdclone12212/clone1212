module.exports.config = {
 name: "upt",
 version: "2.0.0",
 hasPermssion: 0,
 credits: "Islamick Cyber Chat + Saiful Edit",
 description: "Monitoring for your messenger robot (24-hour active)",
 commandCategory: "monitor",
 usages: "[url/reply]",
 cooldowns: 5
};

//////////////////////////////
//        On Load           //
//////////////////////////////
module.exports.onLoad = () => {
 const fs = require("fs-extra");
 const request = require("request");
 const dir = __dirname + `/noprefix/`;
 if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
 if (!fs.existsSync(dir + "upt.png")) {
   request("https://i.imgur.com/sMy3AQU.jpeg").pipe(fs.createWriteStream(dir + "upt.png"));
 }
};

//////////////////////////////
//         Main Run         //
//////////////////////////////
module.exports.run = async function({ api, event, args }) {
 const fs = require("fs-extra");
 const request = require("request");

 // Uptime Calculation
 let time = process.uptime();
 let hours = Math.floor(time / (60 * 60));
 let minutes = Math.floor((time % (60 * 60)) / 60);
 let seconds = Math.floor(time % 60);

 // Input URL
 var url = (event.type == "message_reply") ? event.messageReply.body : args.join(" ");
 var urlPattern = /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g;

 // If no URL — Show uptime only
 if(url.match(urlPattern) == null) {
   return api.sendMessage({
     body: `╔═══════════════════╗
║ 🕧 𝗨𝗣𝗧𝗜𝗠𝗘 𝗥𝗢𝗕𝗢𝗧 🕧 
╠═══════════════════╣
║ 𝗗𝗢𝗨𝗚𝗛 𝗧𝗜𝗠𝗘𝗥 𝗖𝗨𝗥𝗥𝗘𝗡𝗧𝗟𝗬 
║ 𝗢𝗡𝗟𝗜𝗡𝗘 𝗜𝗡 𝗧𝗢𝗧𝗔𝗟 
╠═══════════════════╣
║ ⏱ 𝗛𝗢𝗨𝗥𝗦 : ${hours}
║ ⏱ 𝗠𝗜𝗡𝗨𝗧𝗘 : ${minutes}
║ ⏱ 𝗦𝗘𝗖𝗢𝗡𝗗 : ${seconds}
╚═══════════════════╝

📡 Please reply or enter a valid URL to add in Uptime Robot.`,
     attachment: fs.createReadStream(__dirname + `/noprefix/upt.png`)
   }, event.threadID, event.messageID);
 }

 // If URL given — Create monitor
 var options = {
   method: 'POST',
   url: 'https://api.uptimerobot.com/v2/newMonitor',
   headers: {
     'content-type': 'application/x-www-form-urlencoded'
   },
   form: {
     api_key: 'u2008156-9837ddae6b3c429bd0315101',
     format: 'json',
     type: '1',
     url: url,
     friendly_name: Date.now()
   }
 };

 request(options, function (error, response, body) {
   if (error) return api.sendMessage(`⚠️ Error connecting to UptimeRobot API!`, event.threadID, event.messageID);
   let data = JSON.parse(body);

   if(data.stat == 'fail') {
     return api.sendMessage({
       body: `╔═══════════════════╗
║ 🕧 𝗨𝗣𝗧𝗜𝗠𝗘 𝗥𝗢𝗕𝗢𝗧 🕧 
╠═══════════════════╣
║ 𝗗𝗢𝗨𝗚𝗛 𝗧𝗜𝗠𝗘𝗥 𝗖𝗨𝗥𝗥𝗘𝗡𝗧𝗟𝗬 
║ 𝗢𝗡𝗟𝗜𝗡𝗘 𝗜𝗡 𝗧𝗢𝗧𝗔𝗟 
╠═══════════════════╣
║ ⏱ 𝗛𝗢𝗨𝗥𝗦 : ${hours}
║ ⏱ 𝗠𝗜𝗡𝗨𝗧𝗘 : ${minutes}
║ ⏱ 𝗦𝗘𝗖𝗢𝗡𝗗 : ${seconds}
╚═══════════════════╝

❌ ERROR: This monitor already exists!
🔗 LINK: ${url}`,
       attachment: fs.createReadStream(__dirname + `/noprefix/upt.png`)
     }, event.threadID, event.messageID);
   }

   if(data.stat == 'success') {
     return api.sendMessage({
       body: `╔═══════════════════╗
║ 🕧 𝗨𝗣𝗧𝗜𝗠𝗘 𝗥𝗢𝗕𝗢𝗧 🕧 
╠═══════════════════╣
║ 𝗗𝗢𝗨𝗚𝗛 𝗧𝗜𝗠𝗘𝗥 𝗖𝗨𝗥𝗥𝗘𝗡𝗧𝗟𝗬 
║ 𝗢𝗡𝗟𝗜𝗡𝗘 𝗜𝗡 𝗧𝗢𝗧𝗔𝗟 
╠═══════════════════╣
║ ⏱ 𝗛𝗢𝗨𝗥𝗦 : ${hours}
║ ⏱ 𝗠𝗜𝗡𝗨𝗧𝗘 : ${minutes}
║ ⏱ 𝗦𝗘𝗖𝗢𝗡𝗗 : ${seconds}
╚═══════════════════╝

✅ SUCCESS: Uptime monitor created successfully!
🔗 LINK: ${url}`,
       attachment: fs.createReadStream(__dirname + `/noprefix/upt.png`)
     }, event.threadID, event.messageID);
   }
 });
};
