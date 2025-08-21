import { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, REST, Routes } from 'discord.js';
import Database from './database.js';
import cron from 'node-cron';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config({ path: '../attached_assets/.env' });

class SnootPalaceBot {
  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
      ]
    });
    
    this.db = new Database();
    this.serverId = process.env.SNOOT_PALACE_SERVER_ID || 'snoot_palace';
    this.targetChannelId = process.env.SNOOT_PALACE_CHANNEL_ID; // MANDATORY
    this.messageBuffer = [];
    this.activeUsers = new Set();
    this.apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:5000/api';
    
    if (!this.targetChannelId) {
      throw new Error('SNOOT_PALACE_CHANNEL_ID environment variable is required!');
    }
    
    this.setupCommands();
    this.setupEventHandlers();
    this.setupPeriodicTasks();
  }

  setupCommands() {
    this.commands = [
      new SlashCommandBuilder()
        .setName('activity')
        .setDescription('Compare current activity between Snoot Palace and Snoot Club')
        .addStringOption(option =>
          option.setName('channel')
            .setDescription('Specific channel to monitor (optional)')
            .setRequired(false)
        ),
      
      new SlashCommandBuilder()
        .setName('history')
        .setDescription('View historical activity data')
        .addStringOption(option =>
          option.setName('timeframe')
            .setDescription('Time period to analyze')
            .setRequired(false)
            .addChoices(
              { name: '1 hour', value: '1h' },
              { name: '6 hours', value: '6h' },
              { name: '24 hours', value: '24h' },
              { name: '7 days', value: '7d' }
            )
        )
        .addStringOption(option =>
          option.setName('channel')
            .setDescription('Specific channel to analyze (optional)')
            .setRequired(false)
        ),
      
      new SlashCommandBuilder()
        .setName('status')
        .setDescription('Check bot and monitoring system status')
    ];
  }

  setupEventHandlers() {
    this.client.on('ready', async () => {
      console.log(`✅ Official bot started as ${this.client.user.tag}`);
      await this.db.updateBotStatus('official_bot', 'Official Bot', 'online');
      await this.db.insertSystemLog('bot_started', 'Official bot started successfully');
      
      // Register slash commands
      await this.registerCommands();
    });

    this.client.on('messageCreate', (message) => {
      if (message.author.bot) return;
      if (message.guild?.id !== this.serverId) return;
      if (message.channel.id !== this.targetChannelId) return; // ONLY monitor specific channel
      
      // Track message for SP activity calculation
      this.messageBuffer.push({
        timestamp: Date.now(),
        userId: message.author.id,
        channelId: message.channel.id,
        channelName: message.channel.name
      });

      // Track active users
      this.activeUsers.add(message.author.id);
    });

    this.client.on('interactionCreate', async (interaction) => {
      if (!interaction.isChatInputCommand()) return;

      const { commandName, user } = interaction;
      
      try {
        await this.db.insertCommandLog(commandName, user.id, true);
        
        switch (commandName) {
          case 'activity':
            await this.handleActivityCommand(interaction);
            break;
          case 'history':
            await this.handleHistoryCommand(interaction);
            break;
          case 'status':
            await this.handleStatusCommand(interaction);
            break;
          default:
            await interaction.reply({ content: 'Unknown command!', ephemeral: true });
        }
      } catch (error) {
        console.error(`Error handling ${commandName} command:`, error);
        await this.db.insertCommandLog(commandName, user.id, false, error.message);
        
        // Check if we can still respond
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
        } else if (interaction.deferred) {
          await interaction.editReply('An error occurred while executing the command.');
        }
      }
    });

    this.client.on('error', async (error) => {
      console.error('Official bot error:', error);
      await this.db.insertSystemLog('bot_error', 'Official bot encountered an error', error.message);
    });
  }

  async registerCommands() {
    const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);
    
    try {
      console.log('🔄 Refreshing application (/) commands...');
      
      await rest.put(
        Routes.applicationCommands(this.client.user.id),
        { body: this.commands.map(cmd => cmd.toJSON()) }
      );
      
      console.log('✅ Successfully reloaded application (/) commands.');
    } catch (error) {
      console.error('❌ Error registering commands:', error);
    }
  }

  async handleActivityCommand(interaction) {
    await interaction.deferReply();

    try {
      const channelFilter = interaction.options.getString('channel');
      
      // Get latest activity data for both servers
      const spData = await this.db.getLatestActivity('snoot_palace');
      const scData = await this.db.getLatestActivity('snoot_club');

      if (!spData || !scData) {
        await interaction.editReply('❌ No activity data available. Please wait for data collection to begin.');
        return;
      }

      const spMessages = spData.messages_per_minute || 0;
      const scMessages = scData.messages_per_minute || 0;
      const spUsers = spData.active_users || 0;
      const scUsers = scData.active_users || 0;
      
      // Simple activity score: messages + distinct users
      const spScore = spMessages + spUsers;
      const scScore = scMessages + scUsers;
      
      let response;
      if (scScore > spScore) {
        const msgDiff = scMessages - spMessages;
        const userDiff = scUsers - spUsers;
        const multiplier = spScore > 0 ? (scScore / spScore).toFixed(1) : 'infinite';
        response = `the fucking chuds in snoot house are *more active* by ${msgDiff} messages per hour and ${userDiff} distinct users.... meaning they are ${multiplier}x more active. palace has fallen...`;
      } else {
        const msgDiff = spMessages - scMessages;
        const userDiff = spUsers - scUsers;
        const multiplier = scScore > 0 ? (spScore / scScore).toFixed(1) : 'infinite';
        response = `We are SO fucking back. The west has risen, we are more active by ${msgDiff} messages per hour and ${userDiff} distinct users, meaning we are ${multiplier}x more active. Keep it up xisters.`;
      }
      
      await interaction.editReply(response);
      await this.db.insertSystemLog('command_executed', `/activity command used by ${interaction.user.username}`);
    } catch (error) {
      console.error('Error in activity command:', error);
      await interaction.editReply('❌ Error fetching activity data.');
    }
  }

  async handleHistoryCommand(interaction) {
    await interaction.deferReply();

    const timeframe = interaction.options.getString('timeframe') || '24h';
    const channelFilter = interaction.options.getString('channel');
    
    try {
      const now = new Date();
      let startTime;
      
      switch (timeframe) {
        case '1h':
          startTime = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case '6h':
          startTime = new Date(now.getTime() - 6 * 60 * 60 * 1000);
          break;
        case '24h':
          startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        default:
          startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }

      const spHistory = await this.db.getActivityInRange('snoot_palace', startTime.toISOString(), now.toISOString());
      const scHistory = await this.db.getActivityInRange('snoot_club', startTime.toISOString(), now.toISOString());

      if (spHistory.length === 0 && scHistory.length === 0) {
        await interaction.editReply(`❌ No historical data available for ${timeframe}.`);
        return;
      }

      const spAvg = spHistory.reduce((sum, data) => sum + (data.messages_per_minute || 0), 0) / (spHistory.length || 1);
      const scAvg = scHistory.reduce((sum, data) => sum + (data.messages_per_minute || 0), 0) / (scHistory.length || 1);
      const spPeak = Math.max(...spHistory.map(data => data.messages_per_minute || 0));
      const scPeak = Math.max(...scHistory.map(data => data.messages_per_minute || 0));
      
      let response = `Today, we had a peak message per hour of ${spPeak.toFixed(1)} and an average of ${spAvg.toFixed(1)}, while those RETARDS over in the 'club had a peak message per hour of ${scPeak.toFixed(1)} and an average of ${scAvg.toFixed(1)}.`;
      
      if (spPeak > scPeak || spAvg > scAvg) {
        response += ' Keep it up palacecacas.';
      } else {
        response += ' they had higher stats today. palace fallen. its so over. I am NOT obsessed btw.';
      }
      
      await interaction.editReply(response);
      await this.db.insertSystemLog('command_executed', `/history command used by ${interaction.user.username} (${timeframe})`);
    } catch (error) {
      console.error('Error in history command:', error);
      await interaction.editReply('❌ Error fetching historical data.');
    }
  }


  async handleStatusCommand(interaction) {
    await interaction.deferReply();

    try {
      const botStatuses = await this.db.getAllBotStatuses();
      const officialBot = botStatuses.find(bot => bot.id === 'official_bot');
      const monitorBot = botStatuses.find(bot => bot.id === 'monitor_bot');

      const embed = new EmbedBuilder()
        .setTitle('🤖 System Status')
        .setColor(0x5865F2)
        .setTimestamp()
        .addFields(
          {
            name: '🟢 Official Bot',
            value: `**Status:** ${officialBot?.status || 'Unknown'}\n**Last Seen:** ${officialBot?.last_seen ? new Date(officialBot.last_seen).toLocaleString() : 'Never'}`,
            inline: true
          },
          {
            name: '👁️ Monitor Bot',
            value: `**Status:** ${monitorBot?.status || 'Unknown'}\n**Last Seen:** ${monitorBot?.last_seen ? new Date(monitorBot.last_seen).toLocaleString() : 'Never'}`,
            inline: true
          },
          {
            name: '📊 System Info',
            value: `**Uptime:** ${Math.floor(process.uptime() / 60)} minutes\n**Memory:** ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB\n**Node.js:** ${process.version}`,
            inline: false
          }
        )
        .setFooter({ text: 'Status updated every 5 minutes' });

      await interaction.editReply({ embeds: [embed] });
      
      await this.db.insertSystemLog('command_executed', `/status command used by ${interaction.user.username}`);
    } catch (error) {
      console.error('Error in status command:', error);
      await interaction.editReply('❌ Error fetching system status.');
    }
  }

  setupPeriodicTasks() {
    // Calculate and store SP activity data every minute
    cron.schedule('* * * * *', async () => {
      try {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        
        // Filter messages from the last hour and calculate per-hour rate
        const oneHourAgo = now - 3600000; // 1 hour ago
        const recentMessages = this.messageBuffer.filter(msg => msg.timestamp > oneHourAgo);
        const messagesPerHour = recentMessages.length;
        
        // Count unique active users in the last minute
        const recentActiveUsers = new Set(recentMessages.map(msg => msg.userId));
        
        // Store activity data for Snoot Palace
        await this.db.insertActivityData(
          'snoot_palace',
          messagesPerHour,
          recentActiveUsers.size,
          recentMessages.length
        );

        // Clean old messages from buffer (keep 2 hours of data)
        const twoHoursAgo = now - 7200000;
        this.messageBuffer = this.messageBuffer.filter(msg => msg.timestamp > twoHoursAgo);
        
        // Reset active users every hour
        if (new Date().getMinutes() === 0) {
          this.activeUsers.clear();
        }

        console.log(`📊 Snoot Palace Activity - Messages/hour: ${messagesPerHour}, Active users: ${recentActiveUsers.size}`);

        // API removed - storing to local database only

      } catch (error) {
        console.error('Error calculating SP activity:', error);
        await this.db.insertSystemLog('calculation_error', 'Error calculating SP activity data', error.message);
      }
    });

    // Update bot status every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      await this.db.updateBotStatus('official_bot', 'Official Bot', 'online');
    });
  }

  async start() {
    const token = process.env.BOT_TOKEN;
    if (!token) {
      console.error('❌ BOT_TOKEN environment variable is required');
      process.exit(1);
    }

    try {
      await this.client.login(token);
    } catch (error) {
      console.error('❌ Failed to login:', error);
      await this.db.insertSystemLog('login_error', 'Failed to login official bot', error.message);
      process.exit(1);
    }
  }

  async stop() {
    await this.db.updateBotStatus('official_bot', 'Official Bot', 'offline');
    await this.client.destroy();
    this.db.close();
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  if (global.bot) {
    await global.bot.stop();
  }
  process.exit(0);
});

// Start the bot
const bot = new SnootPalaceBot();
global.bot = bot;
bot.start();
