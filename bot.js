const TelegramBot = require('node-telegram-bot-api');

const BOT_TOKEN = '7243591113:AAGb9pkIhxEWlWlpvjbCQt1VHbYTm7LrjLw';
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

const WEBAPP_URL = 'https://tapgame.vercel.app/?startapp=true';

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || 'user';

  console.log(`👋 /start received from ${firstName} (ID: ${chatId})`);

  bot.sendMessage(chatId, `👋 Hey ${firstName}! Tap below to launch the game:`, {
    reply_markup: {
      inline_keyboard: [[
        {
          text: '⚡ Play Tap Game',
          web_app: { url: WEBAPP_URL }
        }
      ]]
    }
  });
});

// Optional: Log any web_app_data
bot.on('web_app_data', (msg) => {
  console.log('[WebApp Data]', msg);
});

// Error handling
bot.on('polling_error', (err) => console.error('[Polling Error]', err.message));
bot.on('error', (err) => console.error('[Bot Error]', err.message));
