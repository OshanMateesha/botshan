const mineflayer = require('mineflayer');
const express = require('express');
const { SocksClient } = require('socks');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5001; 
app.get('/', (req, res) => res.send('Minecraft Bot Active with 100% Free Auto-Proxy!'));
app.listen(PORT, () => console.log(`[Web] Express සර්වර් එක Port ${PORT} හරහා ක්‍රියාත්මකයි.`));

const serverHost = 'oshan11.aternos.me'; 
const serverPort = 32775;                

let bot;
let afkTimeout;

// 100% Free ProxyScrape API එකෙන් රෑන්ඩම් SOCKS5 Proxy එකක් ලබා ගැනීම
async function getFreeProxy() {
  try {
    console.log('[Free-API] ProxyScrape වෙතින් නොමිලේ SOCKS5 Proxy ලැයිස්තුව ලබා ගැනීමට උත්සාහ කරයි...');
    
    // කිසිම API Key එකක් නැති පොදු Free API එක
    const response = await axios.get('https://api.proxyscrape.com/v2/?request=displayproxies&protocol=socks5&timeout=10000&country=all&ssl=all&anonymity=all');
    
    if (response.data && typeof response.data === 'string') {
      // ලැබෙන Text එක Lines වලට කඩා හිස් පේළි අයින් කිරීම
      const lines = response.data.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      
      if (lines.length > 0) {
        // ලැබුණු මුළු ලැයිස්තුවෙන්ම Random එකක් තෝරා ගැනීම (එතකොට බ්ලොක් වෙන්න තියෙන ඉඩ අඩුයි)
        const randomLine = lines[Math.floor(Math.random() * lines.length)];
        
        if (randomLine.includes(':')) {
          const [host, port] = randomLine.split(':');
          console.log(`🟢 [Free-API] සාර්ථකව වැඩ කරන Free Proxy එකක් ගත්තා: ${host}:${port}`);
          return { host, port: parseInt(port) };
        }
      }
    }
    throw new Error("Free Proxy ලැයිස්තුව හිස්ව පවතී.");
  } catch (error) {
    console.log('❌ [Free-API Error] Proxy ලබා ගැනීමට නොහැකි වුණා:', error.message);
    return null;
  }
}

async function createBot() {
  // Free API එකෙන් Proxy එකක් ඇදලා ගන්නවා
  const proxy = await getFreeProxy();
  
  if (!proxy) {
    console.log('[Bot] Proxy එකක් නැතිව සම්බන්ධ විය නොහැක. තත්පර 15කින් නැවත උත්සාහ කරයි...');
    setTimeout(createBot, 15000);
    return;
  }

  console.log('--------------------------------------------------');
  console.log(`[Bot] Free Proxy (${proxy.host}:${proxy.port}) හරහා සම්බන්ධ වීමට උත්සාහ කරයි...`);
  console.log('--------------------------------------------------');

  bot = mineflayer.createBot({
    username: 'botshan',        
    version: '1.21.9',           
    skipValidation: true,
    checkTimeoutInterval: 60000,
    
    connect: (client) => {
      SocksClient.createConnection({
        proxy: { 
          host: proxy.host, 
          port: proxy.port, 
          type: 5 // Free SOCKS5 Proxy
          // 💡 Free ඒවට Username/Password ඕනේ නැත!
        },
        command: 'connect',
        destination: { host: serverHost, port: parseInt(serverPort) }
      }, (err, info) => {
        if (err) {
          // Free proxy ඉක්මනට Dead වන නිසා Error එකක් ආවොත් වහාම ඊළඟ තත්පර 5න් වෙන එකක් ට්‍රයි කරනවා
          console.log(`\n❌ [PROXY ERROR]: ${proxy.host}:${proxy.port} වැඩ කරන්නේ නැත. (${err.message})`);
          console.log("[Bot] වෙනත් අලුත් Free Proxy එකක් auto අරන් බලන්න තත්පර 5කින් රීස්ටාර්ට් වේ...\n");
          setTimeout(createBot, 5000);
          return;
        }
        console.log("🟢 [Proxy] Handshake එක සාර්ථකයි! Minecraft සර්වර් එකට සම්බන්ධ වෙනවා...");
        client.setSocket(info.socket);
        client.emit('connect');
      });
    }
  });

  bot.on('spawn', () => {
    console.log('[✔ SUCCESS] බොට් සාර්ථකව සර්වර් එක ඇතුළටම ජොයින් වුණා!');
    setTimeout(() => {
        bot.chat('/gamemode spectator'); 
        console.log('[Bot] Spectator mode එකට මාරු වීමට විධානයක් යැවුවා.');
        startFlyingAfter5Secs();
    }, 2000);
    scheduleNextWalk();
  });

  function startFlyingAfter5Secs() {
    console.log('[Bot] තත්පර 5ක ටයිමරය ආරම්භ වුණා. ඉන්පසු Double Jump කර පාවීමට පටන් ගනී...');
    setTimeout(() => {
      if (bot && bot.entity) {
        bot.setControlState('jump', true);
        setTimeout(() => {
          bot.setControlState('jump', false);
          bot.creative.startFlying(); 
          console.log('[🚀 FLY] බොට් සාර්ථකව Double Jump කර අහසේ පාවීම (Flying) ආරම්භ කරා!');
        }, 150); 
      }
    }, 5000); 
  }

  function scheduleNextWalk() {
    if (afkTimeout) clearTimeout(afkTimeout);
    const minTime = 5 * 60 * 1000; 
    const maxTime = 8 * 60 * 1000; 
    const randomDelay = Math.floor(Math.random() * (maxTime - minTime + 1)) + minTime;

    afkTimeout = setTimeout(() => {
      if (!bot || !bot.entity) return;
      const directions = ['forward', 'back', 'left', 'right'];
      const randomDirection = directions[Math.floor(Math.random() * directions.length)];
      
      console.log(`[Anti-AFK] බොට් අහසේ පාවෙමින්ම ${randomDirection} දිශාවට පොඩ්ඩක් ගමන් කරයි.`);
      bot.setControlState(randomDirection, true);

      setTimeout(() => {
        if (bot && bot.entity) {
          bot.clearControlStates();
          scheduleNextWalk();
        }
      }, 500);
    }, randomDelay);
  }

  bot.on('kicked', (reason) => console.log(`[❌ KICKED] හේතුව: ${JSON.stringify(reason)}`));
  bot.on('error', (err) => console.log(`[⚠️ NETWORK ERROR] -> ${err.message}`));
  bot.on('end', (reason) => {
    if (afkTimeout) clearTimeout(afkTimeout); 
    console.log(`\n🔴 [DISCONNECTED] හේතුව: ${reason}`);
    console.log('[Bot] වෙනත් Free Proxy එකක් Fetch කර කනෙක්ට් වෙන්න තත්පර 10කින් උත්සාහ කරයි...\n');
    setTimeout(createBot, 10000);
  });
}

createBot();
