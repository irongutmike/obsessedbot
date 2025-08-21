import { 
  type User, 
  type InsertUser, 
  type Server, 
  type InsertServer,
  type ActivityData,
  type InsertActivityData,
  type CommandLog,
  type InsertCommandLog,
  type SystemLog,
  type InsertSystemLog,
  type BotStatus,
  type InsertBotStatus
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Server methods
  getServer(id: string): Promise<Server | undefined>;
  createServer(server: InsertServer): Promise<Server>;
  updateServerMembers(id: string, totalMembers: number): Promise<Server | undefined>;
  getAllServers(): Promise<Server[]>;
  
  // Activity data methods
  createActivityData(data: InsertActivityData): Promise<ActivityData>;
  getActivityData(serverId: string, limit?: number): Promise<ActivityData[]>;
  getActivityDataInRange(serverId: string, startTime: Date, endTime: Date): Promise<ActivityData[]>;
  getLatestActivityData(serverId: string): Promise<ActivityData | undefined>;
  
  // Command log methods
  createCommandLog(log: InsertCommandLog): Promise<CommandLog>;
  getCommandLogs(limit?: number): Promise<CommandLog[]>;
  
  // System log methods
  createSystemLog(log: InsertSystemLog): Promise<SystemLog>;
  getSystemLogs(limit?: number): Promise<SystemLog[]>;
  
  // Bot status methods
  updateBotStatus(status: InsertBotStatus): Promise<BotStatus>;
  getBotStatus(id: string): Promise<BotStatus | undefined>;
  getAllBotStatuses(): Promise<BotStatus[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private servers: Map<string, Server>;
  private activityData: ActivityData[];
  private commandLogs: CommandLog[];
  private systemLogs: SystemLog[];
  private botStatuses: Map<string, BotStatus>;

  constructor() {
    this.users = new Map();
    this.servers = new Map();
    this.activityData = [];
    this.commandLogs = [];
    this.systemLogs = [];
    this.botStatuses = new Map();
    
    // Initialize default servers
    this.initializeDefaultData();
  }

  private async initializeDefaultData() {
    const snootPalace: Server = {
      id: "snoot_palace",
      name: "Snoot Palace",
      totalMembers: 150
    };
    
    const snootClub: Server = {
      id: "snoot_club", 
      name: "Snoot Club",
      totalMembers: 5000
    };
    
    this.servers.set(snootPalace.id, snootPalace);
    this.servers.set(snootClub.id, snootClub);
    
    // Initialize bot statuses
    const officialBot: BotStatus = {
      id: "official_bot",
      name: "Official Bot",
      status: "online",
      lastSeen: new Date()
    };
    
    const monitorBot: BotStatus = {
      id: "monitor_bot", 
      name: "Monitor Bot",
      status: "monitoring",
      lastSeen: new Date()
    };
    
    this.botStatuses.set(officialBot.id, officialBot);
    this.botStatuses.set(monitorBot.id, monitorBot);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getServer(id: string): Promise<Server | undefined> {
    return this.servers.get(id);
  }

  async createServer(insertServer: InsertServer): Promise<Server> {
    const id = randomUUID();
    const server: Server = { ...insertServer, id, totalMembers: insertServer.totalMembers ?? 0 };
    this.servers.set(id, server);
    return server;
  }

  async updateServerMembers(id: string, totalMembers: number): Promise<Server | undefined> {
    const server = this.servers.get(id);
    if (server) {
      server.totalMembers = totalMembers;
      this.servers.set(id, server);
      return server;
    }
    return undefined;
  }

  async getAllServers(): Promise<Server[]> {
    return Array.from(this.servers.values());
  }

  async createActivityData(insertData: InsertActivityData): Promise<ActivityData> {
    const id = randomUUID();
    const data: ActivityData = {
      ...insertData,
      id,
      timestamp: new Date(),
      messagesPerMinute: insertData.messagesPerMinute ?? 0,
      activeUsers: insertData.activeUsers ?? 0,
      messageCount: insertData.messageCount ?? 0
    };
    this.activityData.push(data);
    return data;
  }

  async getActivityData(serverId: string, limit: number = 100): Promise<ActivityData[]> {
    return this.activityData
      .filter(data => data.serverId === serverId)
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0))
      .slice(0, limit);
  }

  async getActivityDataInRange(serverId: string, startTime: Date, endTime: Date): Promise<ActivityData[]> {
    return this.activityData
      .filter(data => 
        data.serverId === serverId && 
        data.timestamp && 
        data.timestamp >= startTime && 
        data.timestamp <= endTime
      )
      .sort((a, b) => (a.timestamp?.getTime() || 0) - (b.timestamp?.getTime() || 0));
  }

  async getLatestActivityData(serverId: string): Promise<ActivityData | undefined> {
    const data = await this.getActivityData(serverId, 1);
    return data[0];
  }

  async createCommandLog(insertLog: InsertCommandLog): Promise<CommandLog> {
    const id = randomUUID();
    const log: CommandLog = {
      ...insertLog,
      id,
      timestamp: new Date(),
      success: insertLog.success ?? true,
      response: insertLog.response ?? null
    };
    this.commandLogs.push(log);
    return log;
  }

  async getCommandLogs(limit: number = 50): Promise<CommandLog[]> {
    return this.commandLogs
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0))
      .slice(0, limit);
  }

  async createSystemLog(insertLog: InsertSystemLog): Promise<SystemLog> {
    const id = randomUUID();
    const log: SystemLog = {
      ...insertLog,
      id,
      timestamp: new Date(),
      metadata: insertLog.metadata ?? null
    };
    this.systemLogs.push(log);
    return log;
  }

  async getSystemLogs(limit: number = 50): Promise<SystemLog[]> {
    return this.systemLogs
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0))
      .slice(0, limit);
  }

  async updateBotStatus(insertStatus: InsertBotStatus): Promise<BotStatus> {
    const status: BotStatus = {
      ...insertStatus,
      lastSeen: new Date()
    };
    this.botStatuses.set(status.id, status);
    return status;
  }

  async getBotStatus(id: string): Promise<BotStatus | undefined> {
    return this.botStatuses.get(id);
  }

  async getAllBotStatuses(): Promise<BotStatus[]> {
    return Array.from(this.botStatuses.values());
  }
}

export const storage = new MemStorage();
