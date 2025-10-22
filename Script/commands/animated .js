
import os
import random
import string
import requests
from mirai import Mirai, MessageChain, Image, Bot

# ---------------- CONFIG ----------------
BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"
BOT_HOST = "http://localhost:8080"
BOT_QQ = 123456789  # Replace with your bot QQ
AI_API_ENDPOINT = "https://your-ai-video-api.com/generate"  # Replace with actual AI video API
AI_API_KEY = "YOUR_AI_API_KEY_HERE"

bot = Mirai(
    host=BOT_HOST,
    auth_key=BOT_TOKEN,
    qq=BOT_QQ
)

# ------------- Helper Functions -------------
def generate_ai_video(image_url, text):
    """
    Calls AI video API with image + text input, returns video file path
    """
    payload = {
        "image_url": image_url,
        "text": text,
        "voice": "default",
        "style": "realistic"
    }
    headers = {"Authorization": f"Bearer {AI_API_KEY}"}
    try:
        response = requests.post(AI_API_ENDPOINT, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()
        video_url = data.get("video_url")
        if not video_url:
            print("No video returned by API")
            return None
        video_path = f"./temp_video_{''.join(random.choices(string.ascii_letters, k=6))}.mp4"
        video_content = requests.get(video_url).content
        with open(video_path, "wb") as f:
            f.write(video_content)
        return video_path
    except Exception as e:
        print("Error generating AI video:", e)
        return None

# ------------- Bot Event Handler -------------
@bot.on_message
async def handle_message(bot: Bot, msg: MessageChain, sender):
    # Detect images in the message
    images = [seg.url for seg in msg if isinstance(seg, Image)]
    if not images:
        return  # No image, ignore

    # Detect 'animated' command and extract text
    user_text = ""
    for seg in msg:
        if hasattr(seg, "text") and "animated" in seg.text.lower():
            user_text = seg.text.lower().replace("animated", "").strip()
    if not user_text:
        user_text = "Hello!"  # default text

    if images:
        video_file = generate_ai_video(images[0], user_text)
        if video_file:
            await bot.send(sender, MessageChain().append(video_file))
            os.remove(video_file)
        else:
            await bot.send(sender, MessageChain().append("Video generation failed!"))

# ------------- Run Bot -------------
if __name__ == "__main__":
    print("Starting MD HAMIM AI Video Bot...")
    bot.run()
