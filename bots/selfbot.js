import { Client } from 'discord.js-selfbot-v13';
import Database from './database.js';
import cron from 'node-cron';
import dotenv from 'dotenv';

dotenv.config({ path: '../attached_assets/.env' });

class SnootClubMonitor {
  constructor() {
    this.client = new Client({
      checkUpdate: false
    });
    
    this.db = new Database();
    this.serverId = process.env.SNOOT_CLUB_SERVER_ID || 'snoot_club';
    this.channelId = process.env.SNOOT_CLUB_CHANNEL_ID; // Specific channel to monitor
    this.messageBuffer = [];
    this.activeUsers = new Set();
    this.isMonitoring = false;
    
    this.setupEventHandlers();
    this.setupPeriodicTasks();
  }

  setupEventHandlers() {
    this.client.on('ready', async () => {
      console.log(`✅ Selfbot monitoring started as ${this.client.user.tag}`);
      await this.db.updateBotStatus('monitor_bot', 'Monitor Bot', 'monitoring');
      await this.db.insertSystemLog('monitor_connected', 'Selfbot connected and monitoring started');
      this.isMonitoring = true;
    });

    this.client.on('messageCreate', (message) => {
      if (message.author.bot) return;
      if (message.guild?.id !== this.serverId) return;
      
      // Only monitor specific channel if specified
      if (this.channelId && message.channel.id !== this.channelId) return;
      
      // Track message for activity calculation
      this.messageBuffer.push({
        timestamp: Date.now(),
        userId: message.author.id,
        channelId: message.channel.id,
        channelName: message.channel.name
      });

      // Track active users
      this.activeUsers.add(message.author.id);
    });

    this.client.on('error', async (error) => {
      console.error('Selfbot error:', error);
      await this.db.insertSystemLog('monitor_error', 'Selfbot encountered an error', error.message);
    });

    this.client.on('disconnect', async () => {
      console.log('❌ Selfbot disconnected');
      await this.db.updateBotStatus('monitor_bot', 'Monitor Bot', 'offline');
      await this.db.insertSystemLog('monitor_disconnected', 'Selfbot disconnected');
      this.isMonitoring = false;
    });
  }

  setupPeriodicTasks() {
    // Calculate and store activity data every minute
    cron.schedule('* * * * *', async () => {
      if (!this.isMonitoring) return;
      
      try {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        
        // Filter messages from the last hour and calculate per-hour rate
        const oneHourAgo = now - 3600000; // 1 hour ago  
        const recentMessages = this.messageBuffer.filter(msg => msg.timestamp > oneHourAgo);
        const messagesPerHour = recentMessages.length;
        
        // Count unique active users in the last hour
        const recentActiveUsers = new Set(recentMessages.map(msg => msg.userId));
        
        // Store activity data
        await this.db.insertActivityData(
          'snoot_club',
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

        console.log(`📊 Snoot Club Activity - Messages/hour: ${messagesPerHour}, Active users: ${recentActiveUsers.size}`);

        // Detect activity spikes
        if (messagesPerHour > 200) {
          await this.db.insertSystemLog(
            'activity_spike', 
            'High activity detected in Snoot Club',
            `${messagesPerHour} messages per hour`
          );
        }

      } catch (error) {
        console.error('Error calculating activity:', error);
        await this.db.insertSystemLog('calculation_error', 'Error calculating activity data', error.message);
      }
    });

    // Update bot status every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      if (this.isMonitoring) {
        await this.db.updateBotStatus('monitor_bot', 'Monitor Bot', 'monitoring');
      }
    });

    // Cleanup old data every day at midnight
    cron.schedule('0 0 * * *', async () => {
      try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        await this.db.run('DELETE FROM activity_data WHERE timestamp < ?', [thirtyDaysAgo]);
        await this.db.run('DELETE FROM system_logs WHERE timestamp < ?', [thirtyDaysAgo]);
        console.log('🧹 Cleaned up old data');
      } catch (error) {
        console.error('Error cleaning up data:', error);
      }
    });
  }

  async start() {
    let token = process.env.SELFBOT_TOKEN;
    if (!token) {
      console.error('❌ SELFBOT_TOKEN environment variable is required');
      process.exit(1);
    }

    // Remove any quotes that might be around the token
    token = token.replace(/^["']|["']$/g, '');
    
    console.log(`🔐 Cleaned token length: ${token.length}`);
    console.log(`🔐 Token starts with: ${token.substring(0, 10)}...`);

    try {
      await this.client.login(token);
    } catch (error) {
      console.error('❌ Failed to login:', error);
      await this.db.insertSystemLog('login_error', 'Failed to login selfbot', error.message);
      process.exit(1);
    }
  }

  async stop() {
    this.isMonitoring = false;
    await this.db.updateBotStatus('monitor_bot', 'Monitor Bot', 'offline');
    await this.client.destroy();
    this.db.close();
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  if (global.monitor) {
    await global.monitor.stop();
  }
  process.exit(0);
});

// Start the monitor
const monitor = new SnootClubMonitor();
global.monitor = monitor;
monitor.start();
