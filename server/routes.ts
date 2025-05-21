import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketServer } from "ws";
import { 
  insertAccountSchema, 
  insertOrderSchema, 
  insertSettingSchema,
  insertLogSchema
} from "@shared/schema";
import { ZodError } from "zod";
import fs from "fs";
import path from "path";

// Create local folder for storing configuration
const configFolder = process.env.CONFIG_FOLDER || path.join(process.cwd(), "config");
if (!fs.existsSync(configFolder)) {
  fs.mkdirSync(configFolder, { recursive: true });
}

// File paths for configuration
const accountsFilePath = path.join(configFolder, "accounts.json");
const inputsFilePath = path.join(configFolder, "inputs.json");
const programStateFilePath = path.join(configFolder, "programState.json");

// Helper function to save data to JSON file
async function saveToFile(filePath: string, data: any): Promise<void> {
  try {
    await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error saving to file ${filePath}:`, error);
  }
}

// Helper function to read data from JSON file
async function readFromFile(filePath: string): Promise<any> {
  try {
    if (fs.existsSync(filePath)) {
      const data = await fs.promises.readFile(filePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(`Error reading from file ${filePath}:`, error);
  }
  return null;
}

// Initialize from stored files
async function initializeFromFiles() {
  // Load accounts
  const storedAccounts = await readFromFile(accountsFilePath);
  if (storedAccounts && Array.isArray(storedAccounts)) {
    for (const account of storedAccounts) {
      try {
        const validAccount = insertAccountSchema.parse(account);
        await storage.createAccount(validAccount);
      } catch (error) {
        console.error("Invalid account data:", error);
      }
    }
  }
  
  // Load settings
  const storedInputs = await readFromFile(inputsFilePath);
  if (storedInputs) {
    if (storedInputs.global) {
      await storage.createOrUpdateSetting('global', storedInputs.global);
    }
    if (storedInputs.daily) {
      await storage.createOrUpdateSetting('daily', storedInputs.daily);
    }
  }
  
  // Load program state
  const storedProgramState = await readFromFile(programStateFilePath);
  if (storedProgramState && storedProgramState.running !== undefined) {
    // Set program state to match stored value
    const currentState = await storage.getProgramState();
    if (currentState && currentState.running !== storedProgramState.running) {
      await storage.toggleProgramState();
    }
  }
}

// Call initialization
initializeFromFiles().catch(console.error);

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Set up WebSocket server for SignalR-like functionality
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/trading-ws' // Specify a custom path to avoid conflicts with Vite
  });
  
  wss.on("connection", (ws) => {
    console.log("Trading WebSocket client connected");
    
    // Send initial data to new client
    sendInitialData(ws);
    
    ws.on("close", () => {
      console.log("Trading WebSocket client disconnected");
    });
    
    ws.on("message", async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle different message types
        if (data.type === "toggleProgramState") {
          const newState = await storage.toggleProgramState();
          await saveToFile(programStateFilePath, { running: newState.running });
          broadcastToAll({ type: "programStateUpdated", data: newState });
        }
      } catch (error) {
        console.error("Error handling WebSocket message:", error);
      }
    });
  });
  
  // Helper function to broadcast to all clients
  function broadcastToAll(data: any) {
    wss.clients.forEach((client) => {
      if (client.readyState === 1) { // OPEN
        client.send(JSON.stringify(data));
      }
    });
  }
  
  // Helper function to send initial data to new client
  async function sendInitialData(ws: any) {
    try {
      // Send current band data
      const bandData = await storage.getCurrentBandData();
      if (bandData) {
        ws.send(JSON.stringify({ type: "bandDataUpdated", data: bandData }));
      }
      
      // Send current positions
      const positions = await storage.getPositions();
      ws.send(JSON.stringify({ type: "positionsUpdated", data: positions }));
      
      // Send current orders
      const orders = await storage.getOrders();
      ws.send(JSON.stringify({ type: "ordersUpdated", data: orders }));
      
      // Send current service status
      const serviceStatus = await storage.getServiceStatuses();
      ws.send(JSON.stringify({ type: "serviceStatusUpdated", data: serviceStatus }));
      
      // Send current logs
      const logs = await storage.getLogs();
      ws.send(JSON.stringify({ type: "logsUpdated", data: logs }));
      
      // Send current program state
      const programState = await storage.getProgramState();
      ws.send(JSON.stringify({ type: "programStateUpdated", data: programState }));
      
      // Send current quote data
      const quoteData = await storage.getCurrentQuote("ES2023");
      if (quoteData) {
        ws.send(JSON.stringify({ type: "quoteUpdated", data: quoteData }));
      }
    } catch (error) {
      console.error("Error sending initial data:", error);
    }
  }
  
  // Simulate real-time updates for development purposes
  setupSimulatedUpdates(broadcastToAll);
  
  // API Routes
  
  // New route to get inputs from the specified JSON file
  app.get("/api/inputs-from-file", async (req: Request, res: Response) => {
    const inputsJsonPath = "C:\\Users\\hp\\OneDrive\\Documents\\AlfaIntegrationFolder\\inputs.json";
    try {
      if (fs.existsSync(inputsJsonPath)) {
        const fileData = await fs.promises.readFile(inputsJsonPath, 'utf8');
        const rawInputs = JSON.parse(fileData);

        // Transform Global Settings keys
        const globalSettings = {
          futureSymbol: rawInputs.FutureSymbol,
          marginRequirement: rawInputs.MarginRequirement,
          expirationDate: rawInputs.ExpirationDate, // Keep as string, frontend handles Date object
          expirationTime: rawInputs.ExpirationTime,
          signalCalculationStartTime: rawInputs.SignalCalculationStartTime,
          tradingStartTime: rawInputs.TradingStartTime,
          globalEndTime: rawInputs.GlobalEndTime,
          // Add any other global settings fields from your context/GlobalSettings type if they exist in JSON
          // For example, if your GlobalSettings type has these and they are NOT in the JSON,
          // you might provide defaults or they will be undefined.
          initialMargin: rawInputs.InitialMargin || 5000, // Example: provide default if not in JSON
          maintenanceMargin: rawInputs.MaintenanceMargin || 4000,
          contractSize: rawInputs.ContractSize || 50,
          tickValue: rawInputs.TickValue || 12.5,
          tradingHoursStart: rawInputs.TradingHoursStart || "09:30",
          tradingHoursEnd: rawInputs.TradingHoursEnd || "16:00",
          maxPositionSize: rawInputs.MaxPositionSize || 10,
          maxDailyLoss: rawInputs.MaxDailyLoss || 1000,
          targetProfit: rawInputs.TargetProfit || 2000,
        };

        // Transform Daily Parameters keys
        const dailyParameters = rawInputs.DailyParameters.map((param: any) => ({
          day: param.DayOfWeek,
          premiumThresholdIn: param.PremiumThresholdIn,
          premiumThresholdOut: param.PremiumThresholdOut,
          avgLength: param.AVGLength,
          upperBandDeviation: param.UpperBandDeviation,
          lowerBandDeviation: param.LowerBandDeviation,
          // timeAdjustments: param.TimeAdjustments || { vixOpen: 0, marketOpen: 0, marketClose: 0 } // Example if you add this later
        }));

        res.json({ globalSettings, dailyParameters });
      } else {
        console.warn(`Inputs JSON file not found at: ${inputsJsonPath}`);
        res.status(404).json({ message: "Inputs JSON data file not found." });
      }
    } catch (error) {
      console.error(`Error processing inputs JSON file at ${inputsJsonPath}:`, error);
      if (error instanceof SyntaxError) {
        res.status(500).json({ message: "Failed to parse inputs JSON data.", error: error.message });
      } else {
        res.status(500).json({ message: "Failed to retrieve inputs from file due to an internal error." });
      }
    }
  });
  
  // Accounts
  app.get("/api/accounts", async (req: Request, res: Response) => {
    const hardcodedAccountsPath = "C:\\Users\\hp\\OneDrive\\Documents\\AlfaIntegrationFolder\\accounts.json"; // Using double backslashes for Windows path in JS string
    try {
      if (fs.existsSync(hardcodedAccountsPath)) {
        const fileData = await fs.promises.readFile(hardcodedAccountsPath, 'utf8');
        const rawAccounts = JSON.parse(fileData);
        
        // Transform accounts to match frontend expectations
        const transformedAccounts = rawAccounts.map((acc: any, index: number) => ({
          id: acc.id || index + 1, // Use existing id or generate one
          name: acc.Name || acc.name, 
          broker: acc.Broker || acc.broker,
          apiKey: acc.ApiKey || acc.apiKey,
          apiSecret: acc.ApiSecret || acc.apiSecret,
          accountNumber: acc.AccountNumber || acc.accountNumber,
          refreshToken: acc.RefreshToken || acc.refreshToken,
          percentToTrade: parseFloat(acc.PercentToTrade || acc.percentToTrade || "0"),
          active: acc.active !== undefined ? acc.active : true // Default to true if not present
        }));
        
        res.json(transformedAccounts);
      } else {
        console.warn(`Accounts file not found at: ${hardcodedAccountsPath}`);
        res.status(404).json({ message: "Accounts data file not found." });
      }
    } catch (error) {
      console.error(`Error processing accounts file at ${hardcodedAccountsPath}:`, error);
      if (error instanceof SyntaxError) {
        res.status(500).json({ message: "Failed to parse accounts data.", error: error.message });
      } else {
        res.status(500).json({ message: "Failed to retrieve accounts due to an internal error." });
      }
    }
  });
  
  app.post("/api/accounts", async (req: Request, res: Response) => {
    try {
      const account = insertAccountSchema.parse(req.body);
      const newAccount = await storage.createAccount(account);
      
      // Save accounts to file
      const allAccounts = await storage.getAccounts();
      await saveToFile(accountsFilePath, allAccounts);
      
      res.status(201).json(newAccount);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid account data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create account" });
      }
    }
  });
  
  app.put("/api/accounts/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const accountUpdate = insertAccountSchema.partial().parse(req.body);
      const updatedAccount = await storage.updateAccount(id, accountUpdate);
      
      if (!updatedAccount) {
        return res.status(404).json({ message: "Account not found" });
      }
      
      // Save accounts to file
      const allAccounts = await storage.getAccounts();
      await saveToFile(accountsFilePath, allAccounts);
      
      res.json(updatedAccount);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid account data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update account" });
      }
    }
  });
  
  app.delete("/api/accounts/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteAccount(id);
      
      if (!success) {
        return res.status(404).json({ message: "Account not found" });
      }
      
      // Save accounts to file
      const allAccounts = await storage.getAccounts();
      await saveToFile(accountsFilePath, allAccounts);
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete account" });
    }
  });
  
  // Orders
  app.get("/api/orders", async (req: Request, res: Response) => {
    try {
      let orders;
      if (req.query.accountId) {
        const accountId = parseInt(req.query.accountId as string);
        orders = await storage.getOrdersByAccount(accountId);
      } else {
        orders = await storage.getOrders();
      }
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve orders" });
    }
  });
  
  app.post("/api/orders", async (req: Request, res: Response) => {
    try {
      const order = insertOrderSchema.parse(req.body);
      const newOrder = await storage.createOrder(order);
      
      // Broadcast update to WebSocket clients
      broadcastToAll({ type: "orderAdded", data: newOrder });
      
      res.status(201).json(newOrder);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid order data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create order" });
      }
    }
  });
  
  app.put("/api/orders/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const orderUpdate = insertOrderSchema.partial().parse(req.body);
      const updatedOrder = await storage.updateOrder(id, orderUpdate);
      
      if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Broadcast update to WebSocket clients
      broadcastToAll({ type: "orderUpdated", data: updatedOrder });
      
      res.json(updatedOrder);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid order data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update order" });
      }
    }
  });
  
  app.delete("/api/orders/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteOrder(id);
      
      if (!success) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Broadcast update to WebSocket clients
      broadcastToAll({ type: "orderDeleted", data: { id } });
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete order" });
    }
  });
  
  // Positions
  app.get("/api/positions", async (req: Request, res: Response) => {
    try {
      let positions;
      if (req.query.accountId) {
        const accountId = parseInt(req.query.accountId as string);
        positions = await storage.getPositionsByAccount(accountId);
      } else {
        positions = await storage.getPositions();
      }
      res.json(positions);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve positions" });
    }
  });
  
  // Logs
  app.get("/api/logs", async (req: Request, res: Response) => {
    try {
      const logs = await storage.getLogs();
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve logs" });
    }
  });
  
  app.post("/api/logs", async (req: Request, res: Response) => {
    try {
      const log = insertLogSchema.parse(req.body);
      const newLog = await storage.createLog(log);
      
      // Broadcast update to WebSocket clients
      broadcastToAll({ type: "logAdded", data: newLog });
      
      res.status(201).json(newLog);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid log data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create log" });
      }
    }
  });
  
  // Settings
  app.get("/api/settings/:type", async (req: Request, res: Response) => {
    try {
      const type = req.params.type;
      const setting = await storage.getSetting(type);
      
      if (!setting) {
        return res.status(404).json({ message: "Setting not found" });
      }
      
      res.json(setting.data);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve setting" });
    }
  });
  
  app.post("/api/settings/:type", async (req: Request, res: Response) => {
    try {
      const type = req.params.type;
      const data = req.body;
      
      // Validate settings based on type
      if (type === 'global' || type === 'daily') {
        insertSettingSchema.parse({ type, data });
      } else {
        return res.status(400).json({ message: "Invalid setting type" });
      }
      
      const setting = await storage.createOrUpdateSetting(type, data);
      
      // Save settings to file
      const allSettings = {
        global: (await storage.getSetting('global'))?.data,
        daily: (await storage.getSetting('daily'))?.data
      };
      await saveToFile(inputsFilePath, allSettings);
      
      // Broadcast update to WebSocket clients
      broadcastToAll({ type: "settingUpdated", data: { type, data: setting.data } });
      
      res.json(setting.data);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid setting data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to save setting" });
      }
    }
  });
  
  // Service Status
  app.get("/api/service-status", async (req: Request, res: Response) => {
    try {
      const statuses = await storage.getServiceStatuses();
      res.json(statuses);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve service status" });
    }
  });
  
  // Program State
  app.get("/api/program-state", async (req: Request, res: Response) => {
    try {
      const state = await storage.getProgramState();
      res.json(state);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve program state" });
    }
  });
  
  app.post("/api/program-state/toggle", async (req: Request, res: Response) => {
    try {
      const newState = await storage.toggleProgramState();
      
      // Save program state to file
      await saveToFile(programStateFilePath, { running: newState.running });
      
      // Broadcast update to WebSocket clients
      broadcastToAll({ type: "programStateUpdated", data: newState });
      
      res.json(newState);
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle program state" });
    }
  });
  
  // Band Data
  app.get("/api/band-data", async (req: Request, res: Response) => {
    try {
      const bandData = await storage.getCurrentBandData();
      if (bandData) {
        res.json({
          ...bandData,
          premium: parseFloat(bandData.premium as string),
          upperBand: parseFloat(bandData.upperBand as string),
          lowerBand: parseFloat(bandData.lowerBand as string),
          m1Close: parseFloat(bandData.m1Close as string || "0"),
          bollingerUpperBand: parseFloat(bandData.bollingerUpperBand as string || "0"),
          bollingerLowerBand: parseFloat(bandData.bollingerLowerBand as string || "0"),
        });
      } else {
        res.json(null);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve band data" });
    }
  });
  
  app.get("/api/band-data/history", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const history = await storage.getBandDataHistory(limit);
      // Assuming history also contains stringified numbers, parse them
      const parsedHistory = history.map((item: any) => ({
        ...item,
        premium: parseFloat(item.premium as string),
        upperBand: parseFloat(item.upperBand as string),
        lowerBand: parseFloat(item.lowerBand as string),
        m1Close: parseFloat(item.m1Close as string || "0"),
        bollingerUpperBand: parseFloat(item.bollingerUpperBand as string || "0"),
        bollingerLowerBand: parseFloat(item.bollingerLowerBand as string || "0"),
      }));
      res.json(parsedHistory);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve band data history" });
    }
  });
  
  // Quote Data
  app.get("/api/quote/:symbol", async (req: Request, res: Response) => {
    try {
      const symbol = req.params.symbol;
      const quote = await storage.getCurrentQuote(symbol);
      
      if (!quote) {
        return res.status(404).json({ message: "Quote not found" });
      }
      
      res.json({
        ...quote,
        price: parseFloat(quote.price as string),
        change: parseFloat(quote.change as string),
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve quote" });
    }
  });
  
  app.get("/api/quote/:symbol/history", async (req: Request, res: Response) => {
    try {
      const symbol = req.params.symbol;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const history = await storage.getQuoteHistory(symbol, limit);
      // Assuming history also contains stringified numbers, parse them
      const parsedHistory = history.map((item: any) => ({
        ...item,
        price: parseFloat(item.price as string),
        change: parseFloat(item.change as string),
      }));
      res.json(parsedHistory);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve quote history" });
    }
  });

  return httpServer;
}

// Simulate real-time updates for development purposes
function setupSimulatedUpdates(broadcast: (data: any) => void) {
  // Update band data every 5 seconds with slight variations
  setInterval(async () => {
    try {
      const currentBand = await storage.getCurrentBandData();
      if (currentBand) {
        const variation = Math.random() * 0.2 - 0.1; // Random variation between -0.1 and 0.1
        const newPremium = Number((parseFloat(currentBand.premium.toString()) + variation).toFixed(2));
        
        const newBandData = await storage.updateBandData({
          premium: newPremium.toString(),
          upperBand: currentBand.upperBand,
          lowerBand: currentBand.lowerBand,
          m1Close: (4200 + Math.random() * 50).toString(), // Mock M1 close price around 4200
          bollingerUpperBand: (4250 + Math.random() * 20).toString(), // Mock upper Bollinger band
          bollingerLowerBand: (4150 + Math.random() * 20).toString(), // Mock lower Bollinger band
        });
        
        broadcast({ type: "bandDataUpdated", data: newBandData });
      }
    } catch (error) {
      console.error("Error updating band data:", error);
    }
  }, 5000);
  
  // Update quote data every 3 seconds
  setInterval(async () => {
    try {
      const currentQuote = await storage.getCurrentQuote("ES2023");
      if (currentQuote) {
        const priceVariation = Math.random() * 2 - 1; // Random variation between -1 and 1
        const newPrice = Number((parseFloat(currentQuote.price.toString()) + priceVariation).toFixed(2));
        const changePercent = Number(((newPrice / 4275 - 1) * 100).toFixed(2));
        
        const newQuote = await storage.updateQuote({
          symbol: "ES2023",
          price: newPrice.toString(),
          change: changePercent.toString()
        });
        
        broadcast({ type: "quoteUpdated", data: newQuote });
      }
    } catch (error) {
      console.error("Error updating quote data:", error);
    }
  }, 3000);
  
  // Add random logs occasionally
  setInterval(async () => {
    try {
      if (Math.random() > 0.7) { // 30% chance of creating a log
        const levels = ["Info", "Warning", "Error", "Debug"];
        const level = levels[Math.floor(Math.random() * levels.length)];
        
        const messages = [
          "Recalculating bands: Upper=4.62, Lower=1.24",
          "Premium spike detected, evaluating response",
          "Connected to market data feed",
          "Premium values stabilizing within range",
          "API connection refreshed",
          "Latency detected in order execution",
          "Successfully placed order with broker",
          "Order filled at requested price",
          "Account balance updated"
        ];
        
        const message = messages[Math.floor(Math.random() * messages.length)];
        
        const newLog = await storage.createLog({
          level,
          message
        });
        
        broadcast({ type: "logAdded", data: newLog });
      }
    } catch (error) {
      console.error("Error creating log:", error);
    }
  }, 7000);
}
