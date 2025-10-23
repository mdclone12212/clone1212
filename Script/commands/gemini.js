// Safe Short Gemini.js - MD HAMIM
const fs = require("fs");
const path = require("path");
const tf = require("@tensorflow/tfjs-node");
const mobilenet = require("@tensorflow-models/mobilenet");
const readline = require("readline");

// ইনপুট ফোল্ডার (সব ছবি, ভিডিও, টেক্সট, ইমোজি রাখো এখানে)
const inputFolder = path.join(__dirname, "inputs");

// ফাইল ধরার ফাংশন
function detectType(file){
  const ext = path.extname(file).toLowerCase();
  if([".jpg",".jpeg",".png"].includes(ext)) return "ছবি";
  if([".mp4",".mov",".avi"].includes(ext)) return "ভিডিও";
  if(file.match(/[\u2700-\u27BF]|[\u1F300-\u1F6FF]/)) return "ইমোজি/স্টিকার";
  if([".txt"].includes(ext)) return "টেক্সট";
  return "অজানা";
}

// ছবি বিশ্লেষণ
async function analyzeImage(filePath){
  try{
    const img = tf.node.decodeImage(fs.readFileSync(filePath));
    const model = await mobilenet.load();
    const predictions = await model.classify(img);
    img.dispose();
    return `এই ছবিতে সম্ভাব্যভাবে আছে: ${predictions.map(p=>`${p.className} (${(p.probability*100).toFixed(2)}%)`).join(", ")}`;
  }catch{
    return "ছবিটি বিশ্লেষণ করতে সমস্যা হয়েছে।";
  }
}

// অন্যান্য ইনপুট বিশ্লেষণ
function analyzeOther(file){
  switch(detectType(file)){
    case "ভিডিও": return "ভিডিও সম্ভবত চলমান দৃশ্য বা ঘটনা দেখাচ্ছে।";
    case "ইমোজি/স্টিকার": return "এটি একটি ইমোজি বা স্টিকার। অনুভূতি বা মজা প্রকাশ করছে।";
    case "টেক্সট": return "এটি একটি টেক্সট। এখানে লেখা থাকতে পারে।";
    default: return "ইনপুটটি বুঝতে পারিনি।";
  }
}

// CLI – Command-free
const rl = readline.createInterface({input: process.stdin, output: process.stdout});
console.log("Safe Short Gemini AI - MD HAMIM\nইনপুট দিন (ফাইল/ইমোজি/স্টিকার/ভিডিও/টেক্সট):");

rl.on("line", async input=>{
  input = input.trim();
  const filePath = path.join(inputFolder, input);
  
  const reply = (fs.existsSync(filePath) && detectType(filePath)==="ছবি") 
                ? await analyzeImage(filePath) 
                : analyzeOther(input);
                
  console.log("Gemini:", reply, "\n");
});
