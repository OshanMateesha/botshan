const mineflayer = require('mineflayer');
const express = require('express');
const { SocksClient } = require('socks'); // Proxy එක වැඩ කරන්න මේක අනිවාර්යයෙන්ම ඕනේ

const app = express();

// 1. Render.com / Koyeb සඳහා Express Web Server එක (Port 5000)
const PORT = process.env.PORT || 5000;
app.get('/', (req, res) => res.send('Minecraft Bot Active with New Proxy!'));
app.listen(PORT, () => console.log(`[Web] Express සර්වර් එක Port ${PORT} හරහා ක්‍රියාත්මකයි.`));

// 2. ඔයා දීපු අලුත්ම Proxy සැකසුම් (New SOCKS5 Proxy Details)
const proxyHost = '38.154.203.95'; 
const proxyPort = 5863;           
const proxyUser = 'hqvlugcl';     // අලුත් Username
const proxyPass = '721fqf0r7vjn'; // අලුත් Password

// 3. සර්වර් සැකසුම් 
const serverHost = 'oshan11.aternos.me'; 
const serverPort = 32775;                

let bot;
let afkTimeout;

function createBot() {
  console.log('--------------------------------------------------');
  console.log('[Bot] අලුත් SOCKS5 Proxy හරහා සර්වර් එකට සම්බන්ධ වීමට උත්සාහ කරයි...');
  console.log('--------------------------------------------------');

  bot = mineflayer.createBot({
    username: 'botshan',        
    version: '1.21.9',           
    skipValidation: true,
    checkTimeoutInterval: 60000,
    
    // SOCKS5 Proxy හරහා සර්වර් එකට සම්බන්ධ වීම
    connect: (client) => {
      SocksClient.createConnection({
        proxy: { 
          host: proxyHost, 
          port: parseInt(proxyPort), 
          type: 5, 
          userId: proxyUser, 
          password: proxyPass 
        },
        command: 'connect',
        destination: { 
          host: serverHost, 
          port: parseInt(serverPort) 
        }
      }, (err, info) => {
        if (err) {
          console.log("\n❌ [PROXY ERROR]: Proxy එක වැඩ කරන්නේ නැත ->", err.message);
          console.log("[Bot] තත්පර 30කින් නැවත සම්බන්ධ වීමට උත්සාහ කරයි...\n");
          setTimeout(createBot, 30000);
          return;
        }
        console.log("🟢 [Proxy] Handshake එක සාර්ථකයි! සර්වර් එකට සම්බන්ධ වෙනවා...");
        client.setSocket(info.socket);
        client.emit('connect');
      });
    }
  });

  // බොට් සාර්ථකව සර්වර් එක ඇතුළටම ආ විට
  bot.on('spawn', () => {
    console.log('[✔ SUCCESS] බොට් සාර්ථකව සර්වර් එක ඇතුළටම ජොයින් වුණා!');
    
    // Spectator mode එකට මාරු වීමට විධානයක් යැවීම
    setTimeout(() => {
        bot.chat('/gamemode spectator'); 
        console.log('[Bot] Spectator mode එකට මාරු වීමට විධානයක් යැවුවා.');
        
        // Spectator වැටී තත්පර 5කට පසු Double Jump කර පාවීමට (Fly) සැලැස්වීම
        startFlyingAfter5Secs();
    }, 2000);

    // විනාඩි 5+ Anti-AFK පියවර ක්‍රියාත්මක කිරීම ආරම්භ කිරීම
    scheduleNextWalk();
  });

  // Double Jump කර පාවීමේ ශ්‍රිතය (Function)
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

  // විනාඩි 5ත් 8ත් අතර රෑන්ඩම් වෙලාවකින් ඇවිදින Anti-AFK ශ්‍රිතය
  function scheduleNextWalk() {
    if (afkTimeout) clearTimeout(afkTimeout);

    const minTime = 5 * 60 * 1000; 
    const maxTime = 8 * 60 * 1000; 
    const randomDelay = Math.floor(Math.random() * (maxTime - minTime + 1)) + minTime;

    const minutesDisplay = (randomDelay / 1000 / 60).toFixed(2);
    console.log(`[Anti-AFK] ඊළඟ ඇවිදීම තවත් විනාඩි ${minutesDisplay} කින් සිදුවේ...`);

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

  // සර්වර් එක ඇතුළෙන් බොට්ව කික් කරොත්
  bot.on('kicked', (reason) => {
    const kickReason = JSON.stringify(reason) || reason;
    console.log('\n--------------------------------------------------');
    console.log(`[❌ KICKED / BLOCKED] බොට්ව සර්වර් එකෙන් ඉවත් කරා!`);
    console.log(`හේතුව (Reason): ${kickReason}`);
    console.log('--------------------------------------------------\n');
  });

  // නෙට්වර්ක් දෝෂ (Firewall Blocks)
  bot.on('error', (err) => {
    console.log('\n--------------------------------------------------');
    console.log(`[⚠️ NETWORK ERROR] සම්බන්ධතාවයේ දෝෂයක් ඇත! -> ${err.message}`);
    console.log('--------------------------------------------------\n');
  });

  // සර්වර් එකෙන් ඩිස්කනෙක්ට් වුණොත් (කලින් කතා කරපු විදිහට මැසේජ් එක උඩට ගත්තා)
  bot.on('end', (reason) => {
    if (afkTimeout) clearTimeout(afkTimeout); 
    console.log(`\n🔴 [DISCONNECTED] හේතුව: ${reason}`);
    console.log('[Bot] තත්පර 30කින් නැවත සම්බන්ධ වීමට උත්සාහ කරයි...\n');
    setTimeout(createBot, 30000);
  });
}

createBot();
