
"module.exports = {
    name: "reelectionship",
    alias: ["reship"],
    desc: "Send a unic Re-election ship image",
    type: "fun",
    example: "reelectionship @user1 @user2",
    start: async (Miku, m, { text, prefix, pushName }) => {
        try {
            let mentioned = m.mentionedJid;
            if (!mentioned || mentioned.length < 2) {
                return Miku.sendMessage(
                    m.from,
                    { text: `⚠️ দয়া করে ২ জন ব্যবহারকারিকে ট্যাগ করুন।\nউদাহরণ:\n${prefix}reelectionship @user1 @user2` },
                    { quoted: m }
                );
            }

            // ইউনিক সুন্দর রিলেশনশিপ ছবি
            let shipImage = "https://i.ibb.co/3kq9s5X/relationship-unique.png"; // এখানে তুমি নিজের ছবি লিঙ্ক বসাতে পারো

            let caption = `💞 Re-election Ship 💞\n\n${pushName} ships ${mentioned.map(u => '@' + u.split("@")[0]).join(" ❤️ ")}!`;

            await Miku.sendMessage(
                m.from,
                { image: { url: shipImage }, caption: caption, mentions: mentioned },
                { quoted: m }
            );

        } catch (err) {
            console.log(err);
            Miku.sendMessage(
                m.from,
                { text: "❌ কিছু ভুল হয়েছে। ছবি পাঠানো যায়নি।" },
                { quoted: m }
            );
        }
    }
};"
