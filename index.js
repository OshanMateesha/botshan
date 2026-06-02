const mineflayer = require('mineflayer');
const express = require('express');
const app = express();

// Web Server
const PORT = process.env.PORT || 5000;
app.get('/', (req, res) => res.send('Minecraft Bot Active with Double Jump & Fly!'));
app.listen(PORT, () => console.log(`[Web] Express සර්වර් එක Port ${PORT} හරහා ක්‍රියාත්මකයි.`));

const botArgs = {
  host: 'oshan11.aternos.me',
  port: 32775,
  username: 'botshan',
  version: '1.21.9'
};

let bot;
let afkTimeout;

function createBot() {
  console.log('[Bot] සර්වර් එකට සම්බන්ධ වීමට උත්සාහ කරයි...');
  bot = mineflayer.createBot(botArgs);

  bot.on('spawn', () => {
    console.log('[✔ SUCCESS] බොට් සාර්ථකව සර්වර් එක ඇතුළටම ජොයින් වුණා!');
    
    // 1. සර්වර් එකට ආපු ගමන් Spectator mode එකට මාරු වීමට විධානයක් යැවීම
    setTimeout(() => {
        bot.chat('/gamemode spectator'); 
        console.log('[Bot] Spectator mode එකට මාරු වීමට විධානයක් යැවුවා.');
        
        // 2. Spectator වැටී තත්පර 5කට පසු Double Jump කර පාවීමට (Fly) සැලැස්වීම
        startFlyingAfter5Secs();

    }, 2000); // ජොයින් වෙලා තත්පර 2කින් spectator වෙනවා

    // නිශ්චිත වෙලාවකට පස්සේ Anti-AFK පියවර ක්‍රියාත්මක කිරීම ආරම්භ කිරීම
    scheduleNextWalk();
  });

  // Spectator වැටී තත්පර 5කට පසු පියෑඹීමට සකස් කළ ශ්‍රිතය (Function)
  function startFlyingAfter5Secs() {
    console.log('[Bot] තත්පර 5ක ටයිමරය ආරම්භ වුණා. ඉන්පසු Double Jump කර පාවීමට පටන් ගනී...');
    
    setTimeout(() => {
      if (bot && bot.entity) {
        // Double Jump එකක් පෙන්වීමට බොට්ව උඩ පනින (Jump) තත්වයට පත් කිරීම
        bot.setControlState('jump', true);
        
        setTimeout(() => {
          bot.setControlState('jump', false); // Jump එක නතර කිරීම
          
          // Mineflayer හරහා බොට්ව අහසේ පාවෙන (Fly) තත්වයට පත් කිරීම
          bot.creative.startFlying(); 
          console.log('[🚀 FLY] බොට් සාර්ථකව Double Jump කර අහසේ පාවීම (Flying) ආරම්භ කරා!');
        }, 150); // තත්පරයෙන් ඉතා කුඩා කොටසකදී (150ms) jump එක off කර පාවීම ඔන් කරයි
      }
    }, 5000); // Spectator වෙලා හරියටම තත්පර 5කට පසු (5000ms)
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

  // 1. සර්වර් එක ඇතුළෙන් බොට්ව බ්ලොක් කරලා/කිකර් කරලා අයින් කරොත්
  bot.on('kicked', (reason) => {
    const kickReason = JSON.stringify(reason) || reason;
    console.log('\n--------------------------------------------------');
    console.log(`[❌ KICKED / BLOCKED] බොට්ව සර්වර් එකෙන් ඉවත් කරා!`);
    console.log(`හේතුව (Reason): ${kickReason}`);
    console.log('--------------------------------------------------\n');
  });

  // 2. සර්වර් එකට ඇතුල් වෙන්නත් කලින් Firewall එකෙන් බ්ලොක් කරොත්
  bot.on('error', (err) => {
    console.log('\n--------------------------------------------------');
    console.log(`[⚠️ NETWORK ERROR / BLOCK] සම්බන්ධතාවයේ දෝෂයක් ඇත!`);
    console.log(`Error Message: ${err.message}`);

    if (err.code === 'ECONNRESET') {
      console.log('විස්තරය: සර්වර් එකෙන් සම්බන්ධතාවය ප්‍රතික්ෂේප කරා (Connection Reset). Aternos Firewall එකෙන් ඔයාගේ IP එක බ්ලොක් කරලා හෝ සර්වර් එක Offline වෙන්න පුළුවන්.');
    } else if (err.code === 'ETIMEDOUT') {
      console.log('විස්තරය: සර්වර් එක ප්‍රතිචාර දක්වන්නේ නැත (Timed Out). පෝට් (Port) අංකය වැරදි හෝ සර්වර් එක දැනට ක්‍රියා විරහිතයි.');
    } else if (err.code === 'ECONNREFUSED') {
      console.log('විස්තරය: සර්වර් එකට ඇතුල් වීම තහනම් කරා (Connection Refused). සර්වර් එක සම්පූර්ණයෙන්ම Offline.');
    } else {
      console.log(`Error Code: ${err.code}`);
    }
    console.log('--------------------------------------------------\n');
  });

  bot.on('end', () => {
    if (afkTimeout) clearTimeout(afkTimeout); 
    console.log('[Bot] සර්වර් එකෙන් ඉවත් වුණා. තත්පර 30කින් නැවත සම්බන්ධ වීමට උත්සාහ කරයි...');
    setTimeout(createBot, 30000);
  });
}

createBot();