import { pgTable, text, serial, integer, boolean, numeric, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users schema (keeping existing structure)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Accounts schema
export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  broker: text("broker").notNull(),
  apiKey: text("api_key").notNull(),
  apiSecret: text("api_secret").notNull(),
  accountNumber: text("account_number"),
  refreshToken: text("refresh_token"),
  percentToTrade: numeric("percent_to_trade", { precision: 3, scale: 2 }).default("0.5"),
  active: boolean("active").notNull().default(true),
});

export const insertAccountSchema = createInsertSchema(accounts).omit({
  id: true,
});

// Orders schema
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull(),
  symbol: text("symbol").notNull(),
  side: text("side").notNull(), // "Buy" or "Sell"
  quantity: integer("quantity").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  orderType: text("order_type").notNull(), // "Limit", "Market", etc.
  timeInForce: text("time_in_force").notNull(), // "Day", "GTC", etc.
  status: text("status").notNull(), // "Working", "Pending", "Filled", "Canceled"
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
});

// Positions schema
export const positions = pgTable("positions", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull(),
  symbol: text("symbol").notNull(),
  quantity: integer("quantity").notNull(),
  avgPrice: numeric("avg_price", { precision: 10, scale: 2 }).notNull(),
  pnl: numeric("pnl", { precision: 10, scale: 2 }).notNull(),
});

export const insertPositionSchema = createInsertSchema(positions).omit({
  id: true,
});

// Logs schema
export const logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow(),
  level: text("level").notNull(), // "Info", "Warning", "Error", "Debug"
  message: text("message").notNull(),
});

export const insertLogSchema = createInsertSchema(logs).omit({
  id: true,
  timestamp: true,
});

// Settings schema (for global and daily settings)
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // "global" or "daily"
  data: jsonb("data").notNull(),
});

export const insertSettingSchema = createInsertSchema(settings).omit({
  id: true,
});

// Service status schema
export const serviceStatus = pgTable("service_status", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  status: text("status").notNull(), // "Connected", "Disconnected", "Warning"
  details: text("details"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertServiceStatusSchema = createInsertSchema(serviceStatus).omit({
  id: true,
  updatedAt: true,
});

// Program state schema
export const programState = pgTable("program_state", {
  id: serial("id").primaryKey(),
  running: boolean("running").notNull().default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProgramStateSchema = createInsertSchema(programState).omit({
  id: true,
  updatedAt: true,
});

// Band data schema
export const bandData = pgTable("band_data", {
  id: serial("id").primaryKey(),
  premium: numeric("premium", { precision: 10, scale: 2 }).notNull(),
  upperBand: numeric("upper_band", { precision: 10, scale: 2 }).notNull(),
  lowerBand: numeric("lower_band", { precision: 10, scale: 2 }).notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertBandDataSchema = createInsertSchema(bandData).omit({
  id: true,
  timestamp: true,
});

// Quote data schema
export const quoteData = pgTable("quote_data", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  change: numeric("change", { precision: 10, scale: 2 }).notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertQuoteDataSchema = createInsertSchema(quoteData).omit({
  id: true,
  timestamp: true,
});

// Type exports
export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type Position = typeof positions.$inferSelect;
export type InsertPosition = z.infer<typeof insertPositionSchema>;

export type Log = typeof logs.$inferSelect;
export type InsertLog = z.infer<typeof insertLogSchema>;

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;

export type ServiceStatus = typeof serviceStatus.$inferSelect;
export type InsertServiceStatus = z.infer<typeof insertServiceStatusSchema>;

export type ProgramState = typeof programState.$inferSelect;
export type InsertProgramState = z.infer<typeof insertProgramStateSchema>;

export type BandData = typeof bandData.$inferSelect;
export type InsertBandData = z.infer<typeof insertBandDataSchema>;

export type QuoteData = typeof quoteData.$inferSelect;
export type InsertQuoteData = z.infer<typeof insertQuoteDataSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Global Settings type definition
export type GlobalSettings = {
  futureSymbol: string;
  expirationDate: string;
  initialMargin: number;
  maintenanceMargin: number;
  contractSize: number;
  tickValue: number;
  tradingHoursStart: string;
  tradingHoursEnd: string;
  maxPositionSize: number;
  maxDailyLoss: number;
  targetProfit: number;
};

// Daily Parameters type definition
export type DayParameters = {
  day: string;
  upperBandThreshold: number;
  lowerBandThreshold: number;
  maxTradeQuantity: number;
  premiumVolatilityFactor: number;
  tradingStrategy: string;
  timeAdjustments: {
    marketOpen: number;
    midDay: number;
    marketClose: number;
  };
};
