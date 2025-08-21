import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, real, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const servers = pgTable("servers", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  totalMembers: integer("total_members").default(0),
});

export const activityData = pgTable("activity_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serverId: varchar("server_id").notNull().references(() => servers.id),
  timestamp: timestamp("timestamp").defaultNow(),
  messagesPerMinute: real("messages_per_minute").default(0),
  activeUsers: integer("active_users").default(0),
  messageCount: integer("message_count").default(0),
});

export const commandLogs = pgTable("command_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  command: text("command").notNull(),
  userId: text("user_id").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  success: boolean("success").default(true),
  response: text("response"),
});

export const systemLogs = pgTable("system_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // 'activity_spike', 'command_executed', 'monitor_reconnected', etc.
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  metadata: text("metadata"), // JSON string for additional data
});

export const botStatus = pgTable("bot_status", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  status: text("status").notNull(), // 'online', 'offline', 'monitoring'
  lastSeen: timestamp("last_seen").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertServerSchema = createInsertSchema(servers).omit({
  id: true,
});

export const insertActivityDataSchema = createInsertSchema(activityData).omit({
  id: true,
  timestamp: true,
});

export const insertCommandLogSchema = createInsertSchema(commandLogs).omit({
  id: true,
  timestamp: true,
});

export const insertSystemLogSchema = createInsertSchema(systemLogs).omit({
  id: true,
  timestamp: true,
});

export const insertBotStatusSchema = createInsertSchema(botStatus).omit({
  lastSeen: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Server = typeof servers.$inferSelect;
export type ActivityData = typeof activityData.$inferSelect;
export type CommandLog = typeof commandLogs.$inferSelect;
export type SystemLog = typeof systemLogs.$inferSelect;
export type BotStatus = typeof botStatus.$inferSelect;
export type InsertServer = z.infer<typeof insertServerSchema>;
export type InsertActivityData = z.infer<typeof insertActivityDataSchema>;
export type InsertCommandLog = z.infer<typeof insertCommandLogSchema>;
export type InsertSystemLog = z.infer<typeof insertSystemLogSchema>;
export type InsertBotStatus = z.infer<typeof insertBotStatusSchema>;
