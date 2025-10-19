
const fs = require('fs');
const CONFIG = __dirname + '/reactUnseen_debug.json';

// ensure config
if (!fs.existsSync(CONFIG)) {
  fs.writeFileSync(CONFIG, JSON.stringify({
    enabled: true,
    emojis: ["❤️","😂","😡"],
    logEvents: true
  }, null, 2));
}

module.exports.config = {
  name: "reactunseen",
  version: "3.1.0-debug",
  author: "MD HAMIM",
  role: 1,
  description: "React→Unseen with debug logs (Messenger Mirai-FCA)",
  countDown: 0
};

// helper to load/save config
function loadCfg(){ return JSON.parse(fs.readFileSync(CONFIG)); }
function saveCfg(c){ fs.writeFileSync(CONFIG, JSON.stringify(c, null, 2)); }

// safe logger
function log(...args){
  try { console.log('[reactunseen]', ...args); }
  catch(e){ /* ignore */ }
}

// handleEvent: this is called by Mirai event loader
module.exports.handleEvent = async function({ event, api }) {
  const cfg = loadCfg();

  // optional: log full event payload (for debugging)
  if (cfg.logEvents) {
    try { log('EVENT PAYLOAD:', JSON.stringify(event)); }
    catch(e){ log('EVENT PAYLOAD (could not stringify)'); }
  }

  // quick guards
  if (!cfg.enabled) {
    log('Feature disabled in config.');
    return;
  }
  // Some frameworks emit different event.type names — check common ones
  const evType = event.type || event.type_of_event || event.eventType;
  if (!evType || !/react|reaction/i.test(evType)) {
    // not a reaction event
    log('Not a reaction event:', evType);
    return;
  }

  try {
    // Try to extract common fields (falling back if shapes differ)
    const threadID = event.threadID || event.thread_id || event.thread || event.threadID_;
    const messageID = event.messageID || event.message_id || event.message || event.messageID_;
    const reaction = event.reaction || event.emoji || event.reaction_text || event.reactionEmoji;
    const userID = event.userID || event.senderID || event.author || event.user;

    log('Parsed -> threadID:', threadID, 'messageID:', messageID, 'reaction:', reaction, 'userID:', userID);

    if (!threadID || !messageID) {
      log('Missing threadID or messageID — cannot proceed.');
      return;
    }
    if (!reaction) {
      log('No reaction emoji/text found on event.');
      return;
    }

    // If reaction not in configured emoji list -> ignore
    if (!cfg.emojis.includes(reaction)) {
      log(`Reaction "${reaction}" not in allowed list. Ignoring.`);
      return;
    }

    // Try to fetch message info using multiple possible methods
    let msgInfo = null;
    if (typeof api.getMessageInfo === 'function') {
      try { msgInfo = await api.getMessageInfo(threadID, messageID); log('Fetched msgInfo via api.getMessageInfo'); } catch(e){ log('api.getMessageInfo failed:', e && e.message); }
    }
    if (!msgInfo && typeof api.getMessage === 'function') {
      try { msgInfo = await api.getMessage(messageID); log('Fetched msgInfo via api.getMessage'); } catch(e){ log('api.getMessage failed:', e && e.message); }
    }
    if (!msgInfo && typeof api.getThreadInfo === 'function') {
      try { 
        const t = await api.getThreadInfo(threadID);
        // sometimes thread info contains messages array
        msgInfo = (t && t.messages) ? t.messages.find(m => m.messageID == messageID || m.id == messageID) : null;
        log('Tried api.getThreadInfo -> searched messages');
      } catch(e){ log('api.getThreadInfo failed:', e && e.message); }
    }

    // If still no msgInfo, we'll continue but will be cautious.
    if (!msgInfo) log('Warning: Could not fetch message info. Proceeding to best-effort mark unread.');

    // Determine if reacted message was sent by BOT
    let reactedFromBot = false;
    try {
      const botId = (typeof api.getCurrentUserID === 'function') ? api.getCurrentUserID() : (api.getCurrentUser ? api.getCurrentUser() : null);
      // msgInfo shapes vary — check common flags
      if (msgInfo) {
        reactedFromBot = !!(
          msgInfo.isBot || msgInfo.sender === botId || msgInfo.senderID === botId || msgInfo.from === botId || msgInfo.messageSender && msgInfo.messageSender.userID == botId || msgInfo.fromMe
        );
      } else {
        // if we couldn't fetch msgInfo, we can't be sure; best-effort: allow action (optional)
        log('No msgInfo — cannot be sure if message was from bot. Skipping to avoid mistakes.');
        return;
      }
    } catch(e){
      log('Error while checking msg sender:', e && e.message);
    }

    if (!reactedFromBot) {
      log('Reacted message was NOT from bot. Ignoring.');
      return;
    }

    // Now mark thread as unread/unseen using multiple fallbacks
    let done = false;

    // 1) direct call: api.markAsUnread(threadID)
    if (!done && typeof api.markAsUnread === 'function') {
      try { await api.markAsUnread(threadID); done = true; log('Marked unread via api.markAsUnread'); } catch(e){ log('markAsUnread failed:', e && e.message); }
    }

    // 2) some libs use markUnread/markAsRead(false) patterns
    if (!done && typeof api.markUnread === 'function') {
      try { await api.markUnread(threadID); done = true; log('Marked unread via api.markUnread'); } catch(e){ log('markUnread failed:', e && e.message); }
    }

    if (!done && typeof api.markAsRead === 'function') {
      try {
        // try calling markAsRead with second arg false (some libs accept readFlag)
        await api.markAsRead(threadID, false);
        done = true;
        log('Tried api.markAsRead(threadID,false) — treated as unread.');
      } catch(e){
        log('api.markAsRead failed or not supported for unread:', e && e.message);
      }
    }

    // 4) facebook-chat-api style: api.markAsRead(threadID, (err) => {})
    if (!done && typeof api.markAsRead === 'function') {
      try {
        // try without second param
        await new Promise((res, rej) => {
          api.markAsRead(threadID, (err) => err ? rej(err) : res());
        });
        // note: this typically marks read; we don't want that — so we log and NOT set done = true
        log('api.markAsRead exists and called — may have marked read instead of unread. (not ideal)');
      } catch(e){ log('api.markAsRead callback failed:', e && e.message); }
    }

    // 5) as last resort: send a "typing off" or small temp message then delete to nudge client — not recommended
    if (!done) {
      log('Could not find a supported "mark unread" API on your bot client. Please check your library docs.');
      // leave done false
    }

    if (done) {
      log(`✅ Unseen action performed for thread ${threadID} due to emoji ${reaction}`);
    } else {
      log('⚠️ Unseen action NOT performed (no supported API). See notes below.');
    }

  } catch (err) {
    log('Unexpected error in handleEvent:', err && err.stack ? err.stack : err);
  }
};

// run: command interface (on/off/add/remove/list/test)
module.exports.run = async function({ event, args, api }) {
  const cfg = loadCfg();
  const cmd = (args[0] || '').toLowerCase();

  try {
    if (cmd === 'on') {
      cfg.enabled = true; saveCfg(cfg);
      return api.sendMessage('✅ ReactUnseen ENABLED', event.threadID);
    }
    if (cmd === 'off') {
      cfg.enabled = false; saveCfg(cfg);
      return api.sendMessage('❌ ReactUnseen DISABLED', event.threadID);
    }
    if (cmd === 'add') {
      const emoji = args[1]; if (!emoji) return api.sendMessage('Usage: reactunseen add 😍', event.threadID);
      if (!cfg.emojis.includes(emoji)) cfg.emojis.push(emoji); saveCfg(cfg);
      return api.sendMessage(`✅ Added ${emoji}`, event.threadID);
    }
    if (cmd === 'remove') {
      const emoji = args[1]; if (!emoji) return api.sendMessage('Usage: reactunseen remove 😍', event.threadID);
      cfg.emojis = cfg.emojis.filter(e => e !== emoji); saveCfg(cfg);
      return api.sendMessage(`❌ Removed ${emoji}`, event.threadID);
    }
    if (cmd === 'list') {
      return api.sendMessage(`Emojis: ${cfg.emojis.join(' ')}\nEnabled: ${cfg.enabled}`, event.threadID);
    }

    // test trigger: simulate a reaction handling (for debugging)
    if (cmd === 'test') {
      // create a fake event based on current message
      const fakeReaction = cfg.emojis[0] || '❤️';
      const fakeEvent = { type: 'message_reaction', threadID: event.threadID, messageID: event.messageID, reaction: fakeReaction, userID: event.senderID };
      // call handler directly
      await module.exports.handleEvent({ event: fakeEvent, api });
      return api.sendMessage('✅ Test run executed. Check bot console logs.', event.threadID);
    }

    // default help message
    return api.sendMessage('Usage: reactunseen on/off/add/remove/list/test', event.threadID);

  } catch (e) {
    log('Error in run command:', e && e.message);
    return api.sendMessage('Error occurred. Check bot console.', event.threadID);
  }
};
