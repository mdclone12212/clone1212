
const fs = require("fs");
const { createCanvas } = require("canvas");
const ffmpeg = require("fluent-ffmpeg");

module.exports = {
    name: "animated",
    description: "নিজের টেক্সট দিয়ে অ্যানিমেটেড ভিডিও বানান (100% API ফ্রি)",
    async execute(bot, message, args) {
        try {
            if (!args.length) {
                return message.reply("ভিডিওতে দেখানোর জন্য টেক্সট লিখুন!");
            }

            const text = args.join(" ");
            const width = 720;
            const height = 480;
            const tempImage = `temp_${Date.now()}.png`;
            const outputVideo = `animated_${Date.now()}.mp4`;

            // Canvas তৈরি
            const canvas = createCanvas(width, height);
            const ctx = canvas.getContext("2d");

            // ব্যাকগ্রাউন্ড
            ctx.fillStyle = "#000000";
            ctx.fillRect(0, 0, width, height);

            // ইউজারের টেক্সট
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 40px Sans";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(text, width / 2, height / 2);

            // ক্রেডিট লেখা MD HAMIM
            ctx.font = "italic 20px Sans";
            ctx.fillStyle = "#ffdd00";
            ctx.fillText("MD HAMIM", width - 100, height - 30);

            // ছবি ফাইল সেভ করা
            const buffer = canvas.toBuffer("image/png");
            fs.writeFileSync(tempImage, buffer);

            // ffmpeg দিয়ে ৫ সেকেন্ড ভিডিও তৈরি করা
            ffmpeg(tempImage)
                .loop(5)
                .outputOptions([
                    "-c:v libx264",
                    "-t 5",
                    "-pix_fmt yuv420p"
                ])
                .save(outputVideo)
                .on("end", async () => {
                    await message.reply({ files: [outputVideo] });
                    fs.unlinkSync(tempImage);
                    fs.unlinkSync(outputVideo);
                })
                .on("error", (err) => {
                    console.error(err);
                    message.reply("ভিডিও বানাতে সমস্যা হয়েছে!");
                });

        } catch (err) {
            console.error(err);
            message.reply("কিছু ভুল হয়েছে!");
        }
    }
};
