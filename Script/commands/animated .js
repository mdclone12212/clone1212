const fs = require('fs');
const path = require('path');
const axios = require('axios');
const WebSocket = require('ws');
const FormData = require('form-data');
const ffmpeg = require('fluent-ffmpeg');
const tmp = require('tmp');

// ====================== USER-CONFIG ======================
const MIRAI_WS = 'ws://127.0.0.1:8080';
const MIRAI_HTTP = 'http://127.0.0.1:8080';
const AUTH_KEY = 'demo_auth_key_please_replace';
const DEMO_API_URL = 'https://api.demo-animate.ai/generate';
const DEMO_API_KEY = 'demo_api_key';
const COMMAND_PREFIX = 'animated ';
const OUT_WIDTH = 480;
const OUT_HEIGHT = 480;
const VIDEO_DURATION = 3; // seconds
// ==========================================================

function log(...args){console.log(new Date().toISOString(), ...args);}

async function downloadToFile(url, outPath){
  const writer = fs.createWriteStream(outPath);
  const res = await axios({ url, method: 'GET', responseType: 'stream', timeout: 30000 });
  res.data.pipe(writer);
  return new Promise((resolve, reject)=>{
    writer.on('finish',()=>resolve(outPath));
    writer.on('error',reject);
  });
}

async function postToDemoApi(imagePath, actionText){
  const form = new FormData();
  form.append('file', fs.createReadStream(imagePath));
  form.append('action', actionText);
  form.append('duration', String(VIDEO_DURATION));
  const headers = Object.assign({ 'x-api-key': DEMO_API_KEY }, form.getHeaders());
  try{
    const res = await axios.post(DEMO_API_URL, form, { headers, timeout:120000 });
    return res.data;
  }catch(err){
    log('Demo API call failed:', err?.response?.data || err.message || err);
    throw err;
  }
}

async function saveBase64ToFile(base64str, outPath){
  const buf = Buffer.from(base64str, 'base64');
  await fs.promises.writeFile(outPath, buf);
  return outPath;
}

async function uploadFileToMirai(filePath){
  const url = MIRAI_HTTP.replace(/\/$/,'')+'/uploadFile';
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));
  const headers = form.getHeaders();
  if(AUTH_KEY) headers['Authorization'] = AUTH_KEY;
  try{
    const res = await axios.post(url, form, { headers, timeout:120000 });
    return res.data;
  }catch(err){
    log('uploadFileToMirai error:', err?.response?.data || err.message || err);
    throw err;
  }
}

async function sendMiraiMessage(target, isGroup, messageChain){
  const endpoint = isGroup ? '/sendGroupMessage' : '/sendFriendMessage';
  const url = MIRAI_HTTP.replace(/\/$/,'')+endpoint;
  const headers = {'Content-Type':'application/json'};
  if(AUTH_KEY) headers['Authorization']=AUTH_KEY;
  const body = Object.assign({}, {target:Number(target), messageChain});
  try{
    const res = await axios.post(url, body, {headers});
    return res.data;
  }catch(err){
    log('sendMiraiMessage error:', err?.response?.data || err.message || err);
    throw err;
  }
}

async function createLoopVideoFromImage(imagePath, outVideoPath){
  return new Promise((resolve,reject)=>{
    ffmpeg(imagePath)
      .loop(VIDEO_DURATION)
      .outputOptions(['-vf', `scale=${OUT_WIDTH}:${OUT_HEIGHT}`, '-pix_fmt yuv420p'])
      .on('end',()=>resolve(outVideoPath))
      .on('error',(err)=>reject(err))
      .save(outVideoPath);
  });
}

function extractActionFromText(text){
  if(!text) return null;
  const t=text.trim();
  if(t.toLowerCase().startsWith(COMMAND_PREFIX)) return t.slice(COMMAND_PREFIX.length).trim();
  return null;
}

async function handleCommandImage(event, imagePartUrl, actionText){
  log('handling command image',actionText);
  const tmpDir = tmp.dirSync({unsafeCleanup:true});
  try{
    const imgPath = path.join(tmpDir.name,'input_image');
    const ext = path.extname(new URL(imagePartUrl).pathname) || '.jpg';
    const imgFile = imgPath+ext;
    await downloadToFile(imagePartUrl,imgFile);

    let apiRes = null;
    try{ apiRes = await postToDemoApi(imgFile,actionText); }catch(err){ log('Demo API failed — fallback local video'); }

    let finalVideoPath = path.join(tmpDir.name,'out.mp4');
    if(apiRes && apiRes.video_base64) await saveBase64ToFile(apiRes.video_base64,finalVideoPath);
    else if(apiRes && apiRes.video_url) await downloadToFile(apiRes.video_url,finalVideoPath);
    else await createLoopVideoFromImage(imgFile,finalVideoPath);

    const uploadInfo = await uploadFileToMirai(finalVideoPath);
    let messageChain = [];
    if(uploadInfo && uploadInfo.url) messageChain.push({type:'Plain',text:'[Animated video] '+uploadInfo.url});
    else messageChain.push({type:'Plain',text:'[Animated video generated — check your mirai upload response]'});

    const isGroup = event.type && /group/i.test(event.type);
    const target = isGroup ? event.sender.group?.id || event.receiver || event.target : event.sender?.id || event.receiver || event.target;
    await sendMiraiMessage(target,isGroup,messageChain);
    log('sent message back to chat (demo).');
  }finally{ if(!process.env.DEBUG_KEEP_FILES) tmpDir.removeCallback(); }
}

function startWs(){
  log('Connecting to Mirai WS at', MIRAI_WS);
  const ws = new WebSocket(MIRAI_WS);
  ws.on('open',()=>log('Mirai WS connected.'));
  ws.on('error',(err)=>log('Mirai WS error', err?.message || err));
  ws.on('message', async (raw)=>{
    try{
      const data=JSON.parse(raw.toString());
      if(!data||!data.messageChain) return;
      const plainParts=data.messageChain.filter(p=>p.type==='Plain');
      const text=plainParts.map(p=>p.text).join('');
      const action=extractActionFromText(text);
      if(!action) return;
      const imageParts=data.messageChain.filter(p=>p.type==='Image');
      let imageUrl=null;
      if(imageParts.length>0) imageUrl=imageParts[0].url||imageParts[0].imageId||imageParts[0].path||null;
      if(!imageUrl && data.quote && data.quote.origin){ log('Quoted image — demo does not fetch automatically.'); return; }
      if(!imageUrl){ log('No image found — ignoring.'); return; }
      if(!/^https?:\/\//i.test(imageUrl) && MIRAI_HTTP) imageUrl=MIRAI_HTTP.replace(/\/$/,'')+'/file?type=image&id='+encodeURIComponent(imageUrl);
      await handleCommandImage(data,imageUrl,action);
    }catch(err){ log('WS message handler error:',err?.message||err); }
  });
  ws.on('close',()=>{ log('Mirai WS closed — reconnecting in 5s'); setTimeout(startWs,5000); });
}

(function main(){
  log('animate.js demo starting — connecting to Mirai...');
  try{ startWs(); }catch(err){ log('Fatal error starting script:', err?.message||err); process.exit(1); }
})();
