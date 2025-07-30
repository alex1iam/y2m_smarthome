import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDeviceSchema, updateDeviceSchema, updateAppSettingsSchema } from "@shared/schema";
import { z } from "zod";
import archiver from "archiver";
import fs from "fs";
import path from "path";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all devices
  app.get("/api/devices", async (req, res) => {
    try {
      const devices = await storage.getDevices();
      res.json(devices);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch devices" });
    }
  });

  // Get device by ID
  app.get("/api/devices/:id", async (req, res) => {
    try {
      const device = await storage.getDevice(req.params.id);
      if (!device) {
        return res.status(404).json({ message: "Device not found" });
      }
      res.json(device);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch device" });
    }
  });

  // Create new device
  app.post("/api/devices", async (req, res) => {
    try {
      const deviceData = insertDeviceSchema.parse(req.body);
      const device = await storage.createDevice(deviceData);
      res.status(201).json(device);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid device data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create device" });
    }
  });

  // Update device
  app.put("/api/devices/:id", async (req, res) => {
    try {
      const updates = updateDeviceSchema.parse({ ...req.body, id: req.params.id });
      const device = await storage.updateDevice(req.params.id, updates);
      if (!device) {
        return res.status(404).json({ message: "Device not found" });
      }
      res.json(device);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid device data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update device" });
    }
  });

  // Delete device
  app.delete("/api/devices/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteDevice(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Device not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete device" });
    }
  });

  // Get rooms
  app.get("/api/rooms", async (req, res) => {
    try {
      const rooms = await storage.getRooms();
      res.json(rooms);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch rooms" });
    }
  });

  // Get full configuration
  app.get("/api/configuration", async (req, res) => {
    try {
      const config = await storage.getConfiguration();
      res.json(config);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch configuration" });
    }
  });

  // Save configuration
  app.post("/api/configuration", async (req, res) => {
    try {
      const config = req.body;
      await storage.saveConfiguration(config);
      res.json({ message: "Configuration saved successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to save configuration" });
    }
  });

  // Export configuration as file
  app.get("/api/configuration/export", async (req, res) => {
    try {
      const config = await storage.getConfiguration();
      const configString = `module.exports = ${JSON.stringify(config, null, 4)};`;
      
      res.setHeader('Content-Type', 'application/javascript');
      res.setHeader('Content-Disposition', 'attachment; filename="devices.js"');
      res.send(configString);
    } catch (error) {
      res.status(500).json({ message: "Failed to export configuration" });
    }
  });

  // Get app settings
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getAppSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  // Update app settings
  app.put("/api/settings", async (req, res) => {
    try {
      const updates = updateAppSettingsSchema.parse(req.body);
      const settings = await storage.updateAppSettings(updates);
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid settings data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Test devices file path
  app.post("/api/settings/test-path", async (req, res) => {
    try {
      const { path: testPath } = req.body;
      if (!testPath || typeof testPath !== 'string') {
        return res.status(400).json({ message: "Path is required" });
      }

      // Check if file exists and is readable
      try {
        await fs.promises.access(testPath, fs.constants.R_OK | fs.constants.W_OK);
        res.json({ valid: true, message: "Путь доступен для чтения и записи" });
      } catch (error) {
        // Check if directory exists
        const dir = path.dirname(testPath);
        try {
          await fs.promises.access(dir, fs.constants.R_OK | fs.constants.W_OK);
          res.json({ valid: true, message: "Директория доступна, файл будет создан" });
        } catch {
          res.json({ valid: false, message: "Путь или директория недоступны" });
        }
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to test path" });
    }
  });

  // Toggle device state
  app.post("/api/devices/:id/toggle", async (req, res) => {
    try {
      const device = await storage.getDevice(req.params.id);
      if (!device) {
        return res.status(404).json({ message: "Device not found" });
      }

      // Find on/off capability
      const onOffCapability = device.capabilities?.find(c => c.type === 'devices.capabilities.on_off');
      if (!onOffCapability) {
        return res.status(400).json({ message: "Device does not support on/off toggle" });
      }

      // Toggle the state
      const currentState = onOffCapability.state?.value === true;
      const newState = !currentState;

      // Update device state
      const updatedCapabilities = device.capabilities?.map(capability => {
        if (capability.type === 'devices.capabilities.on_off') {
          return {
            ...capability,
            state: {
              instance: capability.state?.instance || 'on',
              value: newState
            }
          };
        }
        return capability;
      });

      const updatedDevice = await storage.updateDevice(req.params.id, {
        ...device,
        capabilities: updatedCapabilities
      });

      res.json({
        device: updatedDevice,
        previousState: currentState,
        newState: newState,
        message: `Устройство ${newState ? 'включено' : 'выключено'}`
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle device state" });
    }
  });

  // Export entire project as ZIP
  app.get("/api/project/export", async (req, res) => {
    try {
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="smart-home-manager.zip"');
      
      const archive = archiver('zip', {
        zlib: { level: 9 }
      });
      
      archive.pipe(res);
      
      // Add all project files except node_modules, .git, and dist
      archive.glob('**/*', {
        cwd: process.cwd(),
        ignore: [
          'node_modules/**',
          '.git/**',
          'dist/**',
          '.next/**',
          '.replit',
          '.upm/**',
          'replit.nix',
          '*.log'
        ]
      });
      
      await archive.finalize();
    } catch (error) {
      console.error('Export error:', error);
      res.status(500).json({ message: "Failed to export project" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
