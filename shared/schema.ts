import { z } from "zod";

// MQTT Instance Schema
export const mqttInstanceSchema = z.object({
  instance: z.string(),
  set: z.string().optional(),
  state: z.string().optional(),
});

// Value Mapping Schema
export const valueMappingSchema = z.object({
  type: z.string(),
  mapping: z.array(z.array(z.union([z.string(), z.boolean(), z.number()]))),
});

// Capability Parameters Schema
export const capabilityParametersSchema = z.object({
  instance: z.string().optional(),
  unit: z.string().optional(),
  range: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    precision: z.number().optional(),
  }).optional(),
  events: z.array(z.object({
    value: z.string(),
  })).optional(),
  random_access: z.boolean().optional(),
});

// Capability State Schema
export const capabilityStateSchema = z.object({
  instance: z.string(),
  value: z.union([z.string(), z.number(), z.boolean()]),
});

// Device Capability Schema
export const deviceCapabilitySchema = z.object({
  type: z.string(),
  retrievable: z.boolean().optional(),
  reportable: z.boolean().optional(),
  parameters: capabilityParametersSchema.optional(),
  state: capabilityStateSchema.optional(),
});

// Device Property Schema
export const devicePropertySchema = z.object({
  type: z.string(),
  retrievable: z.boolean().optional(),
  reportable: z.boolean().optional(),
  parameters: capabilityParametersSchema.optional(),
});

// Device Schema
export const deviceSchema = z.object({
  id: z.string(),
  name: z.string(),
  room: z.string(),
  type: z.string(),
  mqtt: z.array(mqttInstanceSchema),
  valueMapping: z.array(valueMappingSchema).optional(),
  capabilities: z.array(deviceCapabilitySchema).optional(),
  properties: z.array(devicePropertySchema).optional(),
});

// MQTT Config Schema
export const mqttConfigSchema = z.object({
  host: z.string(),
  port: z.number(),
  user: z.string(),
  password: z.string(),
});

// HTTPS Config Schema
export const httpsConfigSchema = z.object({
  privateKey: z.string(),
  certificate: z.string(),
  port: z.number(),
});

// Client Schema
export const clientSchema = z.object({
  id: z.string(),
  name: z.string(),
  clientId: z.string(),
  clientSecret: z.string(),
  isTrusted: z.boolean(),
});

// User Schema
export const userSchema = z.object({
  id: z.string(),
  username: z.string(),
  password: z.string(),
  name: z.string(),
});

// App Settings Schema
export const appSettingsSchema = z.object({
  devicesFilePath: z.string(), // Path to config.js file
});

// Complete Configuration Schema
export const configurationSchema = z.object({
  mqtt: mqttConfigSchema,
  https: httpsConfigSchema,
  clients: z.array(clientSchema),
  users: z.array(userSchema),
  devices: z.array(deviceSchema),
});

// Insert Schemas
export const insertDeviceSchema = deviceSchema;
export const updateDeviceSchema = deviceSchema.partial().extend({ id: z.string() });
export const updateAppSettingsSchema = appSettingsSchema.partial();

// Types
export type Device = z.infer<typeof deviceSchema>;
export type InsertDevice = z.infer<typeof insertDeviceSchema>;
export type UpdateDevice = z.infer<typeof updateDeviceSchema>;
export type MqttInstance = z.infer<typeof mqttInstanceSchema>;
export type DeviceCapability = z.infer<typeof deviceCapabilitySchema>;
export type DeviceProperty = z.infer<typeof devicePropertySchema>;
export type Configuration = z.infer<typeof configurationSchema>;
export type MqttConfig = z.infer<typeof mqttConfigSchema>;
export type AppSettings = z.infer<typeof appSettingsSchema>;
export type UpdateAppSettings = z.infer<typeof updateAppSettingsSchema>;
