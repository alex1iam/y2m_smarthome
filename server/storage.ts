import { type Device, type InsertDevice, type Configuration, type AppSettings, type UpdateAppSettings } from "@shared/schema";
import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";

export interface IStorage {
  getDevices(): Promise<Device[]>;
  getDevice(id: string): Promise<Device | undefined>;
  createDevice(device: InsertDevice): Promise<Device>;
  updateDevice(id: string, device: Partial<Device>): Promise<Device | undefined>;
  deleteDevice(id: string): Promise<boolean>;
  getConfiguration(): Promise<Configuration>;
  saveConfiguration(config: Configuration): Promise<void>;
  getRooms(): Promise<string[]>;
  getAppSettings(): Promise<AppSettings>;
  updateAppSettings(settings: UpdateAppSettings): Promise<AppSettings>;
  getDevicesFilePath(): string;
  setDevicesFilePath(path: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private devices: Map<string, Device>;
  private configuration: Configuration | null = null;
  private configPath = '/opt/yandex2mqtt/config.js';
  private appSettings: AppSettings = {
    devicesFilePath: '/opt/yandex2mqtt/config.js'
  };

  constructor() {
    this.devices = new Map();
    this.loadAppSettings();
    this.loadConfiguration();
  }

  private async loadAppSettings(): Promise<void> {
    try {
      const settingsPath = path.join(process.cwd(), 'app-settings.json');
      const settingsContent = await fs.readFile(settingsPath, 'utf-8');
      this.appSettings = JSON.parse(settingsContent);
      this.configPath = this.appSettings.devicesFilePath;
    } catch (error) {
      // Use default settings if file doesn't exist
      console.log('Using default app settings');
    }
  }

  private async saveAppSettings(): Promise<void> {
    try {
      const settingsPath = path.join(process.cwd(), 'app-settings.json');
      await fs.writeFile(settingsPath, JSON.stringify(this.appSettings, null, 2));
    } catch (error) {
      console.error('Failed to save app settings:', error);
    }
  }

  private async loadConfiguration(): Promise<void> {
    try {
      let configContent: string;
      try {
        // Try to read the main config file
        configContent = await fs.readFile(this.configPath, 'utf-8');
      } catch {
        // Fallback to uploaded config if main file doesn't exist
        const uploadedConfigPath = path.join(process.cwd(), 'attached_assets', 'Pasted-module-exports-mqtt-host-localhost-port-1883-user-alex1ia-1753588228601_1753588228603.txt');
        configContent = await fs.readFile(uploadedConfigPath, 'utf-8');
      }

      // Parse the module.exports format
      const configStart = configContent.indexOf('module.exports = {');
      if (configStart !== -1) {
        const configCode = configContent.substring(configStart);
        const configEnd = this.findMatchingBrace(configCode, configCode.indexOf('{'));
        const configObject = configCode.substring(0, configEnd + 1);
        
        // Use eval to parse the configuration (in production, use a proper JS parser)
        const moduleExports = {};
        eval(configObject.replace('module.exports = ', 'moduleExports.config = '));
        this.configuration = (moduleExports as any).config;
        
        // Load devices into memory
        if (this.configuration?.devices) {
          this.configuration.devices.forEach(device => {
            this.devices.set(device.id, device);
          });
        }
      }
    } catch (error) {
      console.error('Failed to load configuration:', error);
      // Initialize with empty configuration
      this.configuration = {
        mqtt: { host: 'localhost', port: 1883, user: '', password: '' },
        https: { privateKey: '', certificate: '', port: 443 },
        clients: [],
        users: [],
        devices: []
      };
    }
  }

  private findMatchingBrace(str: string, startIndex: number): number {
    let count = 1;
    for (let i = startIndex + 1; i < str.length; i++) {
      if (str[i] === '{') count++;
      else if (str[i] === '}') count--;
      if (count === 0) return i;
    }
    return str.length - 1;
  }

  async getDevices(): Promise<Device[]> {
    return Array.from(this.devices.values());
  }

  async getDevice(id: string): Promise<Device | undefined> {
    return this.devices.get(id);
  }

  async createDevice(insertDevice: InsertDevice): Promise<Device> {
    const id = `id_device_${randomUUID().substring(0, 8)}`;
    const device: Device = { ...insertDevice, id };
    this.devices.set(id, device);
    
    // Update configuration
    if (this.configuration) {
      this.configuration.devices = Array.from(this.devices.values());
    }
    
    return device;
  }

  async updateDevice(id: string, updates: Partial<Device>): Promise<Device | undefined> {
    const device = this.devices.get(id);
    if (!device) return undefined;
    
    const updatedDevice = { ...device, ...updates, id };
    this.devices.set(id, updatedDevice);
    
    // Update configuration
    if (this.configuration) {
      this.configuration.devices = Array.from(this.devices.values());
    }
    
    return updatedDevice;
  }

  async deleteDevice(id: string): Promise<boolean> {
    const deleted = this.devices.delete(id);
    
    // Update configuration
    if (this.configuration && deleted) {
      this.configuration.devices = Array.from(this.devices.values());
    }
    
    return deleted;
  }

  async getConfiguration(): Promise<Configuration> {
    if (!this.configuration) {
      await this.loadConfiguration();
    }
    return this.configuration!;
  }

  async saveConfiguration(config: Configuration): Promise<void> {
    this.configuration = config;
    
    // Update devices map
    this.devices.clear();
    config.devices.forEach(device => {
      this.devices.set(device.id, device);
    });

    // Save to file
    const configString = this.generateConfigString(config);
    try {
      await fs.mkdir(path.dirname(this.configPath), { recursive: true });
    } catch (error) {
      // Directory might already exist, ignore error
    }
    await fs.writeFile(this.configPath, configString, 'utf-8');
  }

  private generateConfigString(config: Configuration): string {
    return `module.exports = ${JSON.stringify(config, null, 4).replace(/"([^"]+)":/g, '$1:')};`;
  }

  async getRooms(): Promise<string[]> {
    const devices = Array.from(this.devices.values());
    const rooms = new Set(devices.map(device => device.room));
    return Array.from(rooms).sort();
  }

  async getAppSettings(): Promise<AppSettings> {
    return this.appSettings;
  }

  async updateAppSettings(settings: UpdateAppSettings): Promise<AppSettings> {
    this.appSettings = { ...this.appSettings, ...settings };
    
    // Update config path if it changed
    if (settings.devicesFilePath) {
      this.configPath = settings.devicesFilePath;
      // Reload configuration from new path
      await this.loadConfiguration();
    }
    
    await this.saveAppSettings();
    return this.appSettings;
  }

  getDevicesFilePath(): string {
    return this.appSettings.devicesFilePath;
  }

  async setDevicesFilePath(newPath: string): Promise<void> {
    await this.updateAppSettings({ devicesFilePath: newPath });
  }
}

export const storage = new MemStorage();
