import sqlite3 from 'sqlite3';
import { promisify } from 'util';

class Database {
  constructor(dbPath = './discord_monitoring.db') {
    this.db = new sqlite3.Database(dbPath);
    this.run = promisify(this.db.run.bind(this.db));
    this.get = promisify(this.db.get.bind(this.db));
    this.all = promisify(this.db.all.bind(this.db));
    this.init();
  }

  async init() {
    await this.run(`
      CREATE TABLE IF NOT EXISTS servers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        total_members INTEGER DEFAULT 0
      )
    `);

    await this.run(`
      CREATE TABLE IF NOT EXISTS activity_data (
        id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
        server_id TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        messages_per_minute REAL DEFAULT 0,
        active_users INTEGER DEFAULT 0,
        message_count INTEGER DEFAULT 0,
        FOREIGN KEY (server_id) REFERENCES servers (id)
      )
    `);

    await this.run(`
      CREATE TABLE IF NOT EXISTS command_logs (
        id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
        command TEXT NOT NULL,
        user_id TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        success BOOLEAN DEFAULT 1,
        response TEXT
      )
    `);

    await this.run(`
      CREATE TABLE IF NOT EXISTS system_logs (
        id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
        type TEXT NOT NULL,
        message TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        metadata TEXT
      )
    `);

    await this.run(`
      CREATE TABLE IF NOT EXISTS bot_status (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        status TEXT NOT NULL,
        last_seen DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Initialize default servers
    await this.run(`
      INSERT OR IGNORE INTO servers (id, name, total_members) 
      VALUES ('snoot_palace', 'Snoot Palace', 150)
    `);

    await this.run(`
      INSERT OR IGNORE INTO servers (id, name, total_members) 
      VALUES ('snoot_club', 'Snoot Club', 5000)
    `);

    // Streaks table for tracking who's been winning
    await this.run(`
      CREATE TABLE IF NOT EXISTS streaks (
        id INTEGER PRIMARY KEY,
        current_leader TEXT NOT NULL,
        streak_started DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_notification DATETIME DEFAULT NULL
      )
    `);

    // Initialize streak tracking if not exists
    await this.run(`
      INSERT OR IGNORE INTO streaks (id, current_leader, streak_started)
      VALUES (1, 'unknown', CURRENT_TIMESTAMP)
    `);

    console.log('Database initialized successfully');
  }

  async insertActivityData(serverId, messagesPerMinute, activeUsers, messageCount) {
    return await this.run(`
      INSERT INTO activity_data (server_id, messages_per_minute, active_users, message_count)
      VALUES (?, ?, ?, ?)
    `, [serverId, messagesPerMinute, activeUsers, messageCount]);
  }

  async getLatestActivity(serverId) {
    return await this.get(`
      SELECT * FROM activity_data 
      WHERE server_id = ? 
      ORDER BY timestamp DESC 
      LIMIT 1
    `, [serverId]);
  }

  async getActivityInRange(serverId, startTime, endTime) {
    return await this.all(`
      SELECT * FROM activity_data 
      WHERE server_id = ? AND timestamp BETWEEN ? AND ?
      ORDER BY timestamp ASC
    `, [serverId, startTime, endTime]);
  }

  async insertCommandLog(command, userId, success = true, response = null) {
    return await this.run(`
      INSERT INTO command_logs (command, user_id, success, response)
      VALUES (?, ?, ?, ?)
    `, [command, userId, success, response]);
  }

  async insertSystemLog(type, message, metadata = null) {
    return await this.run(`
      INSERT INTO system_logs (type, message, metadata)
      VALUES (?, ?, ?)
    `, [type, message, metadata]);
  }

  async updateBotStatus(id, name, status) {
    return await this.run(`
      INSERT OR REPLACE INTO bot_status (id, name, status, last_seen)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `, [id, name, status]);
  }

  async getBotStatus(id) {
    return await this.get(`
      SELECT * FROM bot_status WHERE id = ?
    `, [id]);
  }

  async getAllBotStatuses() {
    return await this.all(`SELECT * FROM bot_status`);
  }

  async getCurrentStreak() {
    return await this.get(`SELECT * FROM streaks WHERE id = 1`);
  }

  async updateStreak(leader) {
    const current = await this.getCurrentStreak();
    if (current.current_leader !== leader) {
      // Leader changed, start new streak
      return await this.run(`
        UPDATE streaks SET 
        current_leader = ?, 
        streak_started = CURRENT_TIMESTAMP,
        last_notification = NULL
        WHERE id = 1
      `, [leader]);
    }
    return null; // No change
  }

  async updateLastNotification() {
    return await this.run(`
      UPDATE streaks SET last_notification = CURRENT_TIMESTAMP WHERE id = 1
    `);
  }

  close() {
    this.db.close();
  }
}

export default Database;
