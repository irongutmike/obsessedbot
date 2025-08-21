import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting Discord monitoring bots...');

// Start official bot
const officialBot = spawn('node', [join(__dirname, 'official-bot.js')], {
  stdio: 'inherit',
  cwd: __dirname
});

// Start selfbot
const selfbot = spawn('node', [join(__dirname, 'selfbot.js')], {
  stdio: 'inherit', 
  cwd: __dirname
});

console.log(`✅ Official bot started with PID: ${officialBot.pid}`);
console.log(`✅ Selfbot started with PID: ${selfbot.pid}`);

// Handle process exits
officialBot.on('exit', (code) => {
  console.log(`❌ Official bot exited with code: ${code}`);
  if (code !== 0) {
    console.log('🔄 Restarting official bot in 5 seconds...');
    setTimeout(() => {
      spawn('node', [join(__dirname, 'official-bot.js')], {
        stdio: 'inherit',
        cwd: __dirname
      });
    }, 5000);
  }
});

selfbot.on('exit', (code) => {
  console.log(`❌ Selfbot exited with code: ${code}`);
  if (code !== 0) {
    console.log('🔄 Restarting selfbot in 5 seconds...');
    setTimeout(() => {
      spawn('node', [join(__dirname, 'selfbot.js')], {
        stdio: 'inherit',
        cwd: __dirname
      });
    }, 5000);
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down bots...');
  officialBot.kill('SIGINT');
  selfbot.kill('SIGINT');
  process.exit(0);
});