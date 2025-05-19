import { 
  users, type User, type InsertUser,
  accounts, type Account, type InsertAccount,
  orders, type Order, type InsertOrder,
  positions, type Position, type InsertPosition,
  logs, type Log, type InsertLog,
  settings, type Setting, type InsertSetting,
  serviceStatus, type ServiceStatus, type InsertServiceStatus,
  programState, type ProgramState, type InsertProgramState,
  bandData, type BandData, type InsertBandData,
  quoteData, type QuoteData, type InsertQuoteData
} from "@shared/schema";

// Extend the storage interface with CRUD methods for our application
export interface IStorage {
  // Users (keeping original methods)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Accounts
  getAccounts(): Promise<Account[]>;
  getAccount(id: number): Promise<Account | undefined>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount(id: number, account: Partial<InsertAccount>): Promise<Account | undefined>;
  deleteAccount(id: number): Promise<boolean>;
  
  // Orders
  getOrders(): Promise<Order[]>;
  getOrdersByAccount(accountId: number): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order | undefined>;
  deleteOrder(id: number): Promise<boolean>;
  
  // Positions
  getPositions(): Promise<Position[]>;
  getPositionsByAccount(accountId: number): Promise<Position[]>;
  getPosition(id: number): Promise<Position | undefined>;
  createPosition(position: InsertPosition): Promise<Position>;
  updatePosition(id: number, position: Partial<InsertPosition>): Promise<Position | undefined>;
  deletePosition(id: number): Promise<boolean>;
  
  // Logs
  getLogs(): Promise<Log[]>;
  createLog(log: InsertLog): Promise<Log>;
  
  // Settings
  getSetting(type: string): Promise<Setting | undefined>;
  createOrUpdateSetting(type: string, data: any): Promise<Setting>;
  
  // Service Status
  getServiceStatuses(): Promise<ServiceStatus[]>;
  updateServiceStatus(name: string, status: string, details?: string): Promise<ServiceStatus>;
  
  // Program State
  getProgramState(): Promise<ProgramState | undefined>;
  toggleProgramState(): Promise<ProgramState>;
  
  // Band Data
  getCurrentBandData(): Promise<BandData | undefined>;
  updateBandData(data: InsertBandData): Promise<BandData>;
  getBandDataHistory(limit: number): Promise<BandData[]>;
  
  // Quote Data
  getCurrentQuote(symbol: string): Promise<QuoteData | undefined>;
  updateQuote(data: InsertQuoteData): Promise<QuoteData>;
  getQuoteHistory(symbol: string, limit: number): Promise<QuoteData[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private accounts: Map<number, Account>;
  private orders: Map<number, Order>;
  private positions: Map<number, Position>;
  private logs: Log[];
  private settingsMap: Map<string, Setting>;
  private serviceStatusMap: Map<string, ServiceStatus>;
  private programStateValue: ProgramState | undefined;
  private bandDataHistory: BandData[];
  private quoteDataMap: Map<string, QuoteData[]>;
  
  private userId: number;
  private accountId: number;
  private orderId: number;
  private positionId: number;
  private logId: number;
  private settingId: number;
  private serviceStatusId: number;
  private programStateId: number;
  private bandDataId: number;
  private quoteDataId: number;

  constructor() {
    this.users = new Map();
    this.accounts = new Map();
    this.orders = new Map();
    this.positions = new Map();
    this.logs = [];
    this.settingsMap = new Map();
    this.serviceStatusMap = new Map();
    this.bandDataHistory = [];
    this.quoteDataMap = new Map();
    
    this.userId = 1;
    this.accountId = 1;
    this.orderId = 1;
    this.positionId = 1;
    this.logId = 1;
    this.settingId = 1;
    this.serviceStatusId = 1;
    this.programStateId = 1;
    this.bandDataId = 1;
    this.quoteDataId = 1;
    
    // Initialize with default service statuses
    this.initializeServiceStatuses();
    
    // Set initial program state
    this.programStateValue = {
      id: this.programStateId++,
      running: false,
      updatedAt: new Date()
    };
    
    // Initialize with test data for development
    this.initializeTestData();
  }

  // User methods (keeping original implementation)
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Account methods
  async getAccounts(): Promise<Account[]> {
    return Array.from(this.accounts.values());
  }
  
  async getAccount(id: number): Promise<Account | undefined> {
    return this.accounts.get(id);
  }
  
  async createAccount(account: InsertAccount): Promise<Account> {
    const id = this.accountId++;
    const newAccount: Account = { ...account, id };
    this.accounts.set(id, newAccount);
    return newAccount;
  }
  
  async updateAccount(id: number, accountUpdate: Partial<InsertAccount>): Promise<Account | undefined> {
    const account = this.accounts.get(id);
    if (!account) return undefined;
    
    const updatedAccount = { ...account, ...accountUpdate };
    this.accounts.set(id, updatedAccount);
    return updatedAccount;
  }
  
  async deleteAccount(id: number): Promise<boolean> {
    return this.accounts.delete(id);
  }
  
  // Order methods
  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }
  
  async getOrdersByAccount(accountId: number): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(order => order.accountId === accountId);
  }
  
  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }
  
  async createOrder(order: InsertOrder): Promise<Order> {
    const id = this.orderId++;
    const newOrder: Order = { 
      ...order, 
      id, 
      createdAt: new Date() 
    };
    this.orders.set(id, newOrder);
    
    // Log order creation
    this.createLog({
      level: "Info",
      message: `New order created: ${order.side} ${order.quantity} ${order.symbol} @ ${order.price}`
    });
    
    return newOrder;
  }
  
  async updateOrder(id: number, orderUpdate: Partial<InsertOrder>): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const updatedOrder = { ...order, ...orderUpdate };
    this.orders.set(id, updatedOrder);
    
    // Log order update
    this.createLog({
      level: "Info",
      message: `Order #${id} updated: ${updatedOrder.status}`
    });
    
    return updatedOrder;
  }
  
  async deleteOrder(id: number): Promise<boolean> {
    const order = this.orders.get(id);
    if (order) {
      // Log order deletion
      this.createLog({
        level: "Info",
        message: `Order #${id} canceled: ${order.side} ${order.quantity} ${order.symbol} @ ${order.price}`
      });
    }
    
    return this.orders.delete(id);
  }
  
  // Position methods
  async getPositions(): Promise<Position[]> {
    return Array.from(this.positions.values());
  }
  
  async getPositionsByAccount(accountId: number): Promise<Position[]> {
    return Array.from(this.positions.values()).filter(position => position.accountId === accountId);
  }
  
  async getPosition(id: number): Promise<Position | undefined> {
    return this.positions.get(id);
  }
  
  async createPosition(position: InsertPosition): Promise<Position> {
    const id = this.positionId++;
    const newPosition: Position = { ...position, id };
    this.positions.set(id, newPosition);
    return newPosition;
  }
  
  async updatePosition(id: number, positionUpdate: Partial<InsertPosition>): Promise<Position | undefined> {
    const position = this.positions.get(id);
    if (!position) return undefined;
    
    const updatedPosition = { ...position, ...positionUpdate };
    this.positions.set(id, updatedPosition);
    return updatedPosition;
  }
  
  async deletePosition(id: number): Promise<boolean> {
    return this.positions.delete(id);
  }
  
  // Log methods
  async getLogs(): Promise<Log[]> {
    return this.logs;
  }
  
  async createLog(log: InsertLog): Promise<Log> {
    const id = this.logId++;
    const newLog: Log = { 
      ...log, 
      id, 
      timestamp: new Date() 
    };
    this.logs.push(newLog);
    
    // Keep only the most recent 1000 logs
    if (this.logs.length > 1000) {
      this.logs.shift();
    }
    
    return newLog;
  }
  
  // Settings methods
  async getSetting(type: string): Promise<Setting | undefined> {
    return this.settingsMap.get(type);
  }
  
  async createOrUpdateSetting(type: string, data: any): Promise<Setting> {
    const existingSetting = this.settingsMap.get(type);
    
    if (existingSetting) {
      const updatedSetting = { ...existingSetting, data };
      this.settingsMap.set(type, updatedSetting);
      return updatedSetting;
    } else {
      const id = this.settingId++;
      const newSetting: Setting = { id, type, data };
      this.settingsMap.set(type, newSetting);
      return newSetting;
    }
  }
  
  // Service Status methods
  async getServiceStatuses(): Promise<ServiceStatus[]> {
    return Array.from(this.serviceStatusMap.values());
  }
  
  async updateServiceStatus(name: string, status: string, details?: string): Promise<ServiceStatus> {
    const existingStatus = Array.from(this.serviceStatusMap.values())
      .find(s => s.name === name);
    
    if (existingStatus) {
      const updatedStatus = { 
        ...existingStatus, 
        status, 
        details: details || existingStatus.details,
        updatedAt: new Date()
      };
      this.serviceStatusMap.set(name, updatedStatus);
      return updatedStatus;
    } else {
      const id = this.serviceStatusId++;
      const newStatus: ServiceStatus = { 
        id, 
        name, 
        status, 
        details: details || null, 
        updatedAt: new Date() 
      };
      this.serviceStatusMap.set(name, newStatus);
      return newStatus;
    }
  }
  
  // Program State methods
  async getProgramState(): Promise<ProgramState | undefined> {
    return this.programStateValue;
  }
  
  async toggleProgramState(): Promise<ProgramState> {
    if (!this.programStateValue) {
      this.programStateValue = {
        id: this.programStateId++,
        running: true,
        updatedAt: new Date()
      };
    } else {
      this.programStateValue = {
        ...this.programStateValue,
        running: !this.programStateValue.running,
        updatedAt: new Date()
      };
    }
    
    // Log program state change
    this.createLog({
      level: "Info",
      message: `Program ${this.programStateValue.running ? 'started' : 'stopped'}`
    });
    
    return this.programStateValue;
  }
  
  // Band Data methods
  async getCurrentBandData(): Promise<BandData | undefined> {
    if (this.bandDataHistory.length === 0) return undefined;
    return this.bandDataHistory[this.bandDataHistory.length - 1];
  }
  
  async updateBandData(data: InsertBandData): Promise<BandData> {
    const id = this.bandDataId++;
    const newBandData: BandData = { 
      ...data, 
      id, 
      timestamp: new Date() 
    };
    this.bandDataHistory.push(newBandData);
    
    // Keep only recent history
    if (this.bandDataHistory.length > 1000) {
      this.bandDataHistory.shift();
    }
    
    return newBandData;
  }
  
  async getBandDataHistory(limit: number): Promise<BandData[]> {
    return this.bandDataHistory.slice(-limit);
  }
  
  // Quote Data methods
  async getCurrentQuote(symbol: string): Promise<QuoteData | undefined> {
    const quotes = this.quoteDataMap.get(symbol);
    if (!quotes || quotes.length === 0) return undefined;
    return quotes[quotes.length - 1];
  }
  
  async updateQuote(data: InsertQuoteData): Promise<QuoteData> {
    const id = this.quoteDataId++;
    const newQuote: QuoteData = { 
      ...data, 
      id, 
      timestamp: new Date() 
    };
    
    if (!this.quoteDataMap.has(data.symbol)) {
      this.quoteDataMap.set(data.symbol, []);
    }
    
    const quotes = this.quoteDataMap.get(data.symbol)!;
    quotes.push(newQuote);
    
    // Keep only recent history
    if (quotes.length > 1000) {
      quotes.shift();
    }
    
    return newQuote;
  }
  
  async getQuoteHistory(symbol: string, limit: number): Promise<QuoteData[]> {
    const quotes = this.quoteDataMap.get(symbol);
    if (!quotes) return [];
    return quotes.slice(-limit);
  }
  
  // Helper methods for initialization
  private initializeServiceStatuses() {
    const statuses = [
      { name: 'Backend API', status: 'Connected', details: 'API running at http://localhost:5001' },
      { name: 'SignalR', status: 'Connected', details: 'WebSocket connection established' },
      { name: 'Market Data', status: 'Active', details: 'Real-time data feed operational' },
      { name: 'Order System', status: 'Connected', details: 'Order routing system ready' }
    ];
    
    statuses.forEach(status => {
      const id = this.serviceStatusId++;
      const serviceStatus: ServiceStatus = {
        id,
        name: status.name,
        status: status.status,
        details: status.details,
        updatedAt: new Date()
      };
      this.serviceStatusMap.set(status.name, serviceStatus);
    });
  }
  
  private initializeTestData() {
    // Initialize basic test accounts
    const testAccounts: InsertAccount[] = [
      { name: 'Account 1', broker: 'Interactive Brokers', apiKey: 'test-key-1', apiSecret: 'test-secret-1', active: true },
      { name: 'Account 2', broker: 'TD Ameritrade', apiKey: 'test-key-2', apiSecret: 'test-secret-2', active: true }
    ];
    
    testAccounts.forEach(account => this.createAccount(account));
    
    // Initialize band data
    const initialBandData: InsertBandData = {
      premium: 2.43,
      upperBand: 4.62,
      lowerBand: 1.24
    };
    
    this.updateBandData(initialBandData);
    
    // Initialize quote data
    const initialQuote: InsertQuoteData = {
      symbol: 'ES2023',
      price: 4287.25,
      change: 0.25
    };
    
    this.updateQuote(initialQuote);
  }
}

export const storage = new MemStorage();
