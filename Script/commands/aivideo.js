module.exports = {
    name: "aivideo",
    alias: ["couplevideo", "loveai"],
    desc: "User er pic-er reply te AI-style animated video pathabe (Credit: MD HAMIM)",
    type: "fun",
    start: async (Miku, m, { pushName }) => {
        try {
            // Check if message has image
            if (!m.quoted && !m.image) {
                return await Miku.sendMessage(
                    m.from,
                    { text: "📸 Ekta picture pathao, ami AI-style animated video pathabo! 😍\n\n(Credit: MD HAMIM)" },
                    { quoted: m }
                );
            }

            // AI-style animated video list
            let videos = [
                "https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.mp4",
                "https://media.giphy.com/media/l41lFw057lAJQMwg0/giphy.mp4",
                "https://media.giphy.com/media/xT9IgG50Fb7Mi0prBC/giphy.mp4",
                "https://media.giphy.com/media/3oz8xIsloV7zOmt81G/giphy.mp4"
            ];
            let video = videos[Math.floor(Math.random() * videos.length)];

            // Animated captions with credit
            let messages = [
                `💖 ${pushName}, ekhon tumi & tomar special er sathe hat dhore boshe achho! 🥰\n\n(Credit: MD HAMIM)`,
                `✨ AI-style love vibes for ${pushName}! 💑\n\n(Credit: MD HAMIM)`,
                `🌹 ${pushName}, enjoy this animated romantic moment! 😍\n\n(Credit: MD HAMIM)`,
                `💫 ${pushName}, AI-style couple moment incoming! 💕\n\n(Credit: MD HAMIM)`
            ];
            let msg = messages[Math.floor(Math.random() * messages.length)];

            // Send video + caption
            await Miku.sendMessage(
                m.from,
                { video: { url: video }, caption: msg },
                { quoted: m }
            );

        } catch (err) {
            console.log(err);
        }
    },
};
