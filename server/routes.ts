import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertActivityDataSchema, insertCommandLogSchema, insertSystemLogSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all servers
  app.get("/api/servers", async (req, res) => {
    try {
      const servers = await storage.getAllServers();
      res.json(servers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch servers" });
    }
  });

  // Get server by ID
  app.get("/api/servers/:id", async (req, res) => {
    try {
      const server = await storage.getServer(req.params.id);
      if (!server) {
        return res.status(404).json({ error: "Server not found" });
      }
      res.json(server);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch server" });
    }
  });

  // Get activity data for a server
  app.get("/api/servers/:id/activity", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const activityData = await storage.getActivityData(req.params.id, limit);
      res.json(activityData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch activity data" });
    }
  });

  // Get latest activity data for a server
  app.get("/api/servers/:id/activity/latest", async (req, res) => {
    try {
      const latestData = await storage.getLatestActivityData(req.params.id);
      if (!latestData) {
        return res.status(404).json({ error: "No activity data found" });
      }
      res.json(latestData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch latest activity data" });
    }
  });

  // Get activity data in date range
  app.get("/api/servers/:id/activity/range", async (req, res) => {
    try {
      const startTime = new Date(req.query.start as string);
      const endTime = new Date(req.query.end as string);
      
      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        return res.status(400).json({ error: "Invalid date range" });
      }

      const activityData = await storage.getActivityDataInRange(req.params.id, startTime, endTime);
      res.json(activityData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch activity data range" });
    }
  });

  // Create activity data (used by bots)
  app.post("/api/activity", async (req, res) => {
    try {
      const validatedData = insertActivityDataSchema.parse(req.body);
      const activityData = await storage.createActivityData(validatedData);
      res.status(201).json(activityData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create activity data" });
    }
  });

  // Get command logs
  app.get("/api/commands", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const commandLogs = await storage.getCommandLogs(limit);
      res.json(commandLogs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch command logs" });
    }
  });

  // Create command log
  app.post("/api/commands", async (req, res) => {
    try {
      const validatedData = insertCommandLogSchema.parse(req.body);
      const commandLog = await storage.createCommandLog(validatedData);
      res.status(201).json(commandLog);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create command log" });
    }
  });

  // Get system logs
  app.get("/api/logs", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const systemLogs = await storage.getSystemLogs(limit);
      res.json(systemLogs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch system logs" });
    }
  });

  // Create system log
  app.post("/api/logs", async (req, res) => {
    try {
      const validatedData = insertSystemLogSchema.parse(req.body);
      const systemLog = await storage.createSystemLog(validatedData);
      res.status(201).json(systemLog);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create system log" });
    }
  });

  // Get bot statuses
  app.get("/api/bots/status", async (req, res) => {
    try {
      const botStatuses = await storage.getAllBotStatuses();
      res.json(botStatuses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bot statuses" });
    }
  });

  // Update bot status
  app.put("/api/bots/status/:id", async (req, res) => {
    try {
      const statusData = { id: req.params.id, ...req.body };
      const botStatus = await storage.updateBotStatus(statusData);
      res.json(botStatus);
    } catch (error) {
      res.status(500).json({ error: "Failed to update bot status" });
    }
  });

  // Get activity comparison
  app.get("/api/comparison", async (req, res) => {
    try {
      const spData = await storage.getLatestActivityData("snoot_palace");
      const scData = await storage.getLatestActivityData("snoot_club");
      
      if (!spData || !scData) {
        return res.status(404).json({ error: "Activity data not found" });
      }

      const spServer = await storage.getServer("snoot_palace");
      const scServer = await storage.getServer("snoot_club");

      const spActivityPerCapita = (spData.messagesPerMinute || 0) / (spServer?.totalMembers || 1);
      const scActivityPerCapita = (scData.messagesPerMinute || 0) / (scServer?.totalMembers || 1);
      
      const activityRatio = spActivityPerCapita / (scActivityPerCapita || 1);
      const isWinning = activityRatio > 1;

      res.json({
        snootPalace: {
          ...spData,
          server: spServer,
          activityPerCapita: spActivityPerCapita
        },
        snootClub: {
          ...scData,
          server: scServer,
          activityPerCapita: scActivityPerCapita
        },
        activityRatio,
        isWinning,
        advantage: isWinning ? Math.round((activityRatio - 1) * 100) : Math.round((1 - activityRatio) * 100)
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch comparison data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
