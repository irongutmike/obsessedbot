# Discord Monitoring System Setup

## Quick Setup

1. **Clone/Import** this project to your Replit account
2. **Set Environment Variables** in Replit's Secrets tab:
   ```
   BOT_TOKEN=your_official_discord_bot_token
   SELFBOT_TOKEN=your_selfbot_token
   SNOOT_CLUB_SERVER_ID=target_server_id_to_monitor
   SNOOT_PALACE_SERVER_ID=your_server_id_for_commands
   ```

3. **Run** the project - it will automatically:
   - Install all dependencies
   - Start both Discord bots
   - Begin collecting activity data

## How It Works

- **Official Bot**: Responds to slash commands in your server
- **Selfbot**: Secretly monitors the target server for activity data
- **Commands Available**:
  - `/activity` - Live activity comparison
  - `/history` - Historical data analysis  
  - `/status` - System health check

## Getting Bot Tokens

### Official Bot Token
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create new application → Bot section
3. Copy the bot token
4. Invite bot to your server with proper permissions

### Selfbot Token
1. Open Discord in browser → F12 Developer Tools
2. Go to Application/Storage → Local Storage → Discord
3. Find "token" key - this is your selfbot token
4. **WARNING**: Using selfbots violates Discord ToS - use at your own risk

## Server IDs
1. Enable Developer Mode in Discord Settings
2. Right-click on server name → Copy Server ID

## File Structure
```
bots/
├── official-bot.js    # Main bot with commands
├── selfbot.js         # Monitoring bot
├── database.js        # SQLite database
├── start-bots.js      # Launcher script
└── package.json       # Dependencies
```

The system is completely self-contained and portable!