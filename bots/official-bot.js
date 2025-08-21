import { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, REST, Routes } from 'discord.js';
import Database from './database.js';
import cron from 'node-cron';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

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
    this.messageBuffer = [];
    this.activeUsers = new Set();
    this.apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:5000/api';
    
    this.setupCommands();
    this.setupEventHandlers();
    this.setupPeriodicTasks();
  }

  setupCommands() {
    this.commands = [
      new SlashCommandBuilder()
        .setName('activity')
        .setDescription('Show current activity comparison between servers'),
      
      new SlashCommandBuilder()
        .setName('history')
        .setDescription('Show historical activity data')
        .addStringOption(option =>
          option.setName('timeframe')
            .setDescription('Time period to show')
            .setRequired(false)
            .addChoices(
              { name: '1 hour', value: '1h' },
              { name: '6 hours', value: '6h' },
              { name: '24 hours', value: '24h' },
              { name: '7 days', value: '7d' }
            )),
      
      new SlashCommandBuilder()
        .setName('compare')
        .setDescription('Compare specific metrics between servers')
        .addStringOption(option =>
          option.setName('metric')
            .setDescription('Metric to compare')
            .setRequired(true)
            .addChoices(
              { name: 'Messages per minute', value: 'messages' },
              { name: 'Active users', value: 'users' },
              { name: 'Per capita activity', value: 'percapita' }
            )),
      
      new SlashCommandBuilder()
        .setName('status')
        .setDescription('Show bot and monitoring system status')
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
      
      // Track message for SP activity calculation
      this.messageBuffer.push({
        timestamp: Date.now(),
        userId: message.author.id,
        channelId: message.channel.id
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
          case 'compare':
            await this.handleCompareCommand(interaction);
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
      // Get latest activity data for both servers
      const spData = await this.db.getLatestActivity('snoot_palace');
      const scData = await this.db.getLatestActivity('snoot_club');

      if (!spData || !scData) {
        await interaction.editReply('❌ No activity data available. Please wait for data collection to begin.');
        return;
      }

      const spPerCapita = (spData.messages_per_minute || 0) / 150; // SP has ~150 members
      const scPerCapita = (scData.messages_per_minute || 0) / 5000; // SC has ~5000 members
      const ratio = spPerCapita / (scPerCapita || 1);
      const isWinning = ratio > 1;

      const embed = new EmbedBuilder()
        .setTitle('🏆 Server Activity Comparison')
        .setColor(isWinning ? 0x57F287 : 0xED4245)
        .setTimestamp()
        .addFields(
          {
            name: '👑 Snoot Palace',
            value: `**${spData.messages_per_minute?.toFixed(1) || '0.0'}** msg/min\n**${spData.active_users || 0}** active users\n**150** total members`,
            inline: true
          },
          {
            name: '🏛️ Snoot Club',
            value: `**${scData.messages_per_minute?.toFixed(1) || '0.0'}** msg/min\n**${scData.active_users || 0}** active users\n**5,000** total members`,
            inline: true
          },
          {
            name: isWinning ? '🎉 We\'re Winning!' : '📊 Current Status',
            value: `**${ratio.toFixed(2)}x** activity multiplier\n${isWinning ? `**${Math.round((ratio - 1) * 100)}%** more active per capita` : `**${Math.round((1 - ratio) * 100)}%** less active per capita`}`,
            inline: false
          }
        )
        .setFooter({ text: 'Data updates every minute' });

      await interaction.editReply({ embeds: [embed] });
      
      await this.db.insertSystemLog('command_executed', `/activity command used by ${interaction.user.username}`);
    } catch (error) {
      console.error('Error in activity command:', error);
      await interaction.editReply('❌ Error fetching activity data.');
    }
  }

  async handleHistoryCommand(interaction) {
    await interaction.deferReply();

    const timeframe = interaction.options.getString('timeframe') || '24h';
    
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

      const spAvg = spHistory.reduce((sum, data) => sum + (data.messages_per_minute || 0), 0) / spHistory.length;
      const scAvg = scHistory.reduce((sum, data) => sum + (data.messages_per_minute || 0), 0) / scHistory.length;
      const spPeak = Math.max(...spHistory.map(data => data.messages_per_minute || 0));
      const scPeak = Math.max(...scHistory.map(data => data.messages_per_minute || 0));

      const embed = new EmbedBuilder()
        .setTitle(`📈 Activity History (${timeframe})`)
        .setColor(0x5865F2)
        .setTimestamp()
        .addFields(
          {
            name: '👑 Snoot Palace Stats',
            value: `**${spAvg.toFixed(1)}** avg msg/min\n**${spPeak.toFixed(1)}** peak msg/min\n**${spHistory.length}** data points`,
            inline: true
          },
          {
            name: '🏛️ Snoot Club Stats',
            value: `**${scAvg.toFixed(1)}** avg msg/min\n**${scPeak.toFixed(1)}** peak msg/min\n**${scHistory.length}** data points`,
            inline: true
          }
        )
        .setFooter({ text: `Timeframe: ${timeframe}` });

      await interaction.editReply({ embeds: [embed] });
      
      await this.db.insertSystemLog('command_executed', `/history command used by ${interaction.user.username} (${timeframe})`);
    } catch (error) {
      console.error('Error in history command:', error);
      await interaction.editReply('❌ Error fetching historical data.');
    }
  }

  async handleCompareCommand(interaction) {
    await interaction.deferReply();

    const metric = interaction.options.getString('metric');
    
    try {
      const spData = await this.db.getLatestActivity('snoot_palace');
      const scData = await this.db.getLatestActivity('snoot_club');

      if (!spData || !scData) {
        await interaction.editReply('❌ No activity data available for comparison.');
        return;
      }

      let comparison = '';
      let title = '';

      switch (metric) {
        case 'messages':
          title = '💬 Messages per Minute Comparison';
          comparison = `**SP:** ${spData.messages_per_minute?.toFixed(1) || '0.0'} msg/min\n**SC:** ${scData.messages_per_minute?.toFixed(1) || '0.0'} msg/min\n**Difference:** ${((spData.messages_per_minute || 0) - (scData.messages_per_minute || 0)).toFixed(1)} msg/min`;
          break;
        case 'users':
          title = '👥 Active Users Comparison';
          comparison = `**SP:** ${spData.active_users || 0} users\n**SC:** ${scData.active_users || 0} users\n**Difference:** ${(spData.active_users || 0) - (scData.active_users || 0)} users`;
          break;
        case 'percapita':
          const spPerCapita = (spData.messages_per_minute || 0) / 150;
          const scPerCapita = (scData.messages_per_minute || 0) / 5000;
          title = '📊 Per Capita Activity Comparison';
          comparison = `**SP:** ${spPerCapita.toFixed(4)} msg/min/member\n**SC:** ${scPerCapita.toFixed(4)} msg/min/member\n**Ratio:** ${(spPerCapita / (scPerCapita || 1)).toFixed(2)}x`;
          break;
      }

      const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(comparison)
        .setColor(0x5865F2)
        .setTimestamp()
        .setFooter({ text: 'Live comparison data' });

      await interaction.editReply({ embeds: [embed] });
      
      await this.db.insertSystemLog('command_executed', `/compare command used by ${interaction.user.username} (${metric})`);
    } catch (error) {
      console.error('Error in compare command:', error);
      await interaction.editReply('❌ Error performing comparison.');
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
        
        // Filter messages from the last minute
        const recentMessages = this.messageBuffer.filter(msg => msg.timestamp > oneMinuteAgo);
        const messagesPerMinute = recentMessages.length;
        
        // Count unique active users in the last minute
        const recentActiveUsers = new Set(recentMessages.map(msg => msg.userId));
        
        // Store activity data for Snoot Palace
        await this.db.insertActivityData(
          'snoot_palace',
          messagesPerMinute,
          recentActiveUsers.size,
          recentMessages.length
        );

        // Clean old messages from buffer
        const fiveMinutesAgo = now - 300000;
        this.messageBuffer = this.messageBuffer.filter(msg => msg.timestamp > fiveMinutesAgo);
        
        // Reset active users every hour
        if (new Date().getMinutes() === 0) {
          this.activeUsers.clear();
        }

        console.log(`📊 Snoot Palace Activity - Messages/min: ${messagesPerMinute}, Active users: ${recentActiveUsers.size}`);

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
