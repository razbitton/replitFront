import React, { createContext, useContext, useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { connectToSignalR, disconnectFromSignalR } from "@/lib/signalRConnection";
import { useToast } from "@/hooks/use-toast";

// Types for our data models
export type Account = {
  id: number;
  name: string;
  broker: string;
  apiKey: string;
  apiSecret: string;
  accountNumber?: string;
  refreshToken?: string;
  percentToTrade: number;
  active: boolean;
};

export type Order = {
  id: string;
  account: string;
  symbol: string;
  quantity: number | null;      // Represents QuantityOrdered
  quantityLeft: number | null;  // Represents QuantityLeft
  price: number | null;
  side: "Buy" | "Sell";
  type: "Market" | "Limit" | "Stop" | "StopLimit";
  status: "Working" | "Filled" | "Cancelled" | "Rejected";
  timestamp: string;
};

export type Position = {
  id: string; // Changed to string for robust React keys
  accountName: string;   // Account display name (from C# PositionInfo.Name -> JSON name)
  accountNumber: string; // Account string identifier (from C# PositionInfo.Account -> JSON account)
  symbol: string;
  quantity: number;
  avgPrice: number | null;
  pnl: number;
  timestamp: string;
};

export type Log = {
  id: number;
  timestamp: string;
  type: string;
  message: string;
};

// // Old ServiceStatus type - no longer used with new DTO
// export type ServiceStatus = {
//   id: number;
//   name: string;
//   status: string;
//   details: string | null;
//   updatedAt: string;
// };

// New type for service log messages from SignalR
export type ServiceLogMessage = {
  id: string; // client-generated for React keys
  timestamp: string;
  message: string;
};

export type BandData = {
  id?: number;
  premium: number;
  upperBand: number;
  lowerBand: number;
  timestamp: string;
  m1Close: number;
  bollingerUpperBand: number;
  bollingerLowerBand: number;
};

export type QuoteData = {
  id: number;
  symbol: string;
  price: number;
  change: number;
  timestamp: string;
  bid?: number | null;
  ask?: number | null;
};

// Type for VIX-specific quote data
export type VixQuoteData = {
  price: number | null;
  change: number | null; // Or any other relevant fields like bid/ask if available
  timestamp: string | null;
};

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
  marginRequirement: number;
  expirationTime: string;
  signalCalculationStartTime: string;
  tradingStartTime: string;
  globalEndTime: string;
  lastVixUpdate: string | null;
  lastAssetUpdate: string | null;
  lastQuoteFeedUpdate: string | null;
  lastSignalUpdate: string | null;
  vixQuoteData: VixQuoteData | null; // Added VIX quote data
};

export type DayParameter = {
  day: string;
  premiumThresholdIn: number;
  premiumThresholdOut: number;
  avgLength: number;
  upperBandDeviation: number;
  lowerBandDeviation: number;
};

export type DailyParameters = DayParameter[];

// Context value type
export interface TradingContextType {
  // Data
  accounts: Account[];
  orders: Order[];
  positions: Position[];
  logs: Log[];
  // serviceStatus: ServiceStatus[]; // Old
  serviceLogMessages: ServiceLogMessage[]; // New
  bandData: BandData | null;
  historicalBandData: BandData[];
  quoteData: QuoteData | null;
  programRunning: boolean;
  globalSettings: GlobalSettings | null;
  dailyParameters: DailyParameters | null;
  
  // Timestamps for specific service data updates
  lastVixUpdate: string | null;
  lastAssetUpdate: string | null;
  lastQuoteFeedUpdate: string | null;
  lastSignalUpdate: string | null;
  
  // Loading states
  isLoading: boolean;

  // Actions
  toggleProgramState: () => Promise<void>;
  saveGlobalSettings: (settings: GlobalSettings) => Promise<void>;
  saveDailyParameters: (parameters: DailyParameters) => Promise<void>;
  addAccount: (account: Omit<Account, "id">) => Promise<void>;
  updateAccount: (id: number, account: Partial<Account>) => Promise<void>;
  deleteAccount: (id: number) => Promise<void>;
  placeOrder: (order: Omit<Order, "id" | "createdAt">) => Promise<void>;
  updateOrder: (id: number, order: Partial<Order>) => Promise<void>;
  cancelOrder: (id: number) => Promise<void>;

  // Filtering
  selectedAccount: string;
  setSelectedAccount: (account: string) => void;
  selectedLogLevel: string;
  setSelectedLogLevel: (level: string) => void;

  vixQuoteData: VixQuoteData | null; // Export VIX quote data
}

// Default global settings
const defaultGlobalSettings: GlobalSettings = {
  futureSymbol: "ES",
  marginRequirement: 12000,
  expirationDate: new Date().toISOString().split("T")[0],
  expirationTime: "16:00",
  signalCalculationStartTime: "09:15",
  tradingStartTime: "09:30",
  globalEndTime: "16:00",
  initialMargin: 5000,
  maintenanceMargin: 4000,
  contractSize: 50,
  tickValue: 12.5,
  tradingHoursStart: "09:30",
  tradingHoursEnd: "16:00",
  maxPositionSize: 10,
  maxDailyLoss: 1000,
  targetProfit: 2000,
  lastVixUpdate: null,
  lastAssetUpdate: null,
  lastQuoteFeedUpdate: null,
  lastSignalUpdate: null,
  vixQuoteData: null,
};

// Default daily parameters
const defaultDailyParameters: DailyParameters = [
  {
    day: "Monday",
    premiumThresholdIn: 2.5,
    premiumThresholdOut: 1.5,
    avgLength: 20,
    upperBandDeviation: 2.0,
    lowerBandDeviation: 2.0
  },
  {
    day: "Tuesday",
    premiumThresholdIn: 2.5,
    premiumThresholdOut: 1.5,
    avgLength: 20,
    upperBandDeviation: 2.0,
    lowerBandDeviation: 2.0
  },
  {
    day: "Wednesday",
    premiumThresholdIn: 2.5,
    premiumThresholdOut: 1.5,
    avgLength: 20,
    upperBandDeviation: 2.0,
    lowerBandDeviation: 2.0
  },
  {
    day: "Thursday",
    premiumThresholdIn: 2.5,
    premiumThresholdOut: 1.5,
    avgLength: 20,
    upperBandDeviation: 2.0,
    lowerBandDeviation: 2.0
  },
  {
    day: "Friday",
    premiumThresholdIn: 2.5,
    premiumThresholdOut: 1.5,
    avgLength: 20,
    upperBandDeviation: 2.0,
    lowerBandDeviation: 2.0
  }
];

// Create context with default values
const TradingContext = createContext<TradingContextType>({
  // Data
  accounts: [],
  orders: [],
  positions: [],
  logs: [],
  // serviceStatus: [], // Old
  serviceLogMessages: [], // New
  bandData: null,
  historicalBandData: [],
  quoteData: null,
  programRunning: false,
  globalSettings: null,
  dailyParameters: null,
  
  // Timestamps for specific service data updates
  lastVixUpdate: null,
  lastAssetUpdate: null,
  lastQuoteFeedUpdate: null,
  lastSignalUpdate: null,
  
  // Loading state
  isLoading: true,

  // Actions
  toggleProgramState: async () => {},
  saveGlobalSettings: async () => {},
  saveDailyParameters: async () => {},
  addAccount: async () => {},
  updateAccount: async () => {},
  deleteAccount: async () => {},
  placeOrder: async () => {},
  updateOrder: async () => {},
  cancelOrder: async () => {},

  // Filtering
  selectedAccount: "All Accounts",
  setSelectedAccount: () => {},
  selectedLogLevel: "All Levels",
  setSelectedLogLevel: () => {},

  vixQuoteData: null,
});

export const TradingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State for all data
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  // const [serviceStatus, setServiceStatus] = useState<ServiceStatus[]>([]); // Old
  const [serviceLogMessages, setServiceLogMessages] = useState<ServiceLogMessage[]>([]); // New
  const [bandData, setBandData] = useState<BandData | null>(null);
  const [historicalBandData, setHistoricalBandData] = useState<BandData[]>([]);
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const [programRunning, setProgramRunning] = useState<boolean>(false);
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings | null>(null);
  const [dailyParameters, setDailyParameters] = useState<DailyParameters | null>(null);
  
  // State for specific service update timestamps
  const [lastVixUpdate, setLastVixUpdate] = useState<string | null>(null);
  const [lastAssetUpdate, setLastAssetUpdate] = useState<string | null>(null);
  const [lastQuoteFeedUpdate, setLastQuoteFeedUpdate] = useState<string | null>(null);
  const [lastSignalUpdate, setLastSignalUpdate] = useState<string | null>(null);
  
  // Loading state
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Filtering state
  const [selectedAccount, setSelectedAccount] = useState<string>("All Accounts");
  const [selectedLogLevel, setSelectedLogLevel] = useState<string>("All Levels");
  
  const { toast } = useToast();

  // Initialize VIX quote data
  const [vixQuoteData, setVixQuoteData] = useState<VixQuoteData | null>(null);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch accounts
        const accountsResponse = await fetch("/api/accounts");
        if (accountsResponse.ok) {
          const accountsData = await accountsResponse.json();
          setAccounts(accountsData);
        }
        
        // Fetch orders
        const ordersResponse = await fetch("/api/orders");
        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json();

          const parseOrderFields = (orderInput: any): Order => {
            const rawPrice = orderInput.price; 
            const rawQuantityOrdered = orderInput.quantityOrdered;
            const rawQuantityLeft = orderInput.quantityLeft;
            const rawAccountIdentifier = orderInput.account;

            let processedPriceString = rawPrice;
            if (typeof rawPrice === 'string') {
              processedPriceString = rawPrice.replace(/,/g, '');
            }
            const tempPrice = typeof processedPriceString === 'string'
                               ? parseFloat(processedPriceString)
                               : (typeof processedPriceString === 'number' ? processedPriceString : NaN);

            let processedQuantityOrderedString = rawQuantityOrdered;
            if (typeof rawQuantityOrdered === 'string') {
              processedQuantityOrderedString = rawQuantityOrdered.replace(/,/g, '');
            }
            const tempQuantityOrdered = typeof processedQuantityOrderedString === 'string'
                                 ? parseFloat(processedQuantityOrderedString)
                                 : (typeof processedQuantityOrderedString === 'number' ? processedQuantityOrderedString : NaN);

            let processedQuantityLeftString = rawQuantityLeft;
            if (typeof rawQuantityLeft === 'string') {
              processedQuantityLeftString = rawQuantityLeft.replace(/,/g, '');
            }
            const tempQuantityLeft = typeof processedQuantityLeftString === 'string'
                                 ? parseFloat(processedQuantityLeftString)
                                 : (typeof processedQuantityLeftString === 'number' ? processedQuantityLeftString : NaN);

            return {
              ...(orderInput as Omit<Order, 'price' | 'quantity' | 'quantityLeft' | 'account'>),
              id: String(orderInput.id),
              account: String(rawAccountIdentifier || ''),
              price: !isNaN(tempPrice) ? tempPrice : null,
              quantity: !isNaN(tempQuantityOrdered) ? tempQuantityOrdered : null,
              quantityLeft: !isNaN(tempQuantityLeft) ? tempQuantityLeft : null,
              symbol: String(orderInput.symbol),
              side: orderInput.side,
              type: orderInput.type,
              status: orderInput.status,
              timestamp: String(orderInput.timestamp || new Date().toISOString()),
            };
          };

          if (Array.isArray(ordersData)) {
            setOrders(ordersData.map(parseOrderFields));
          } else if (ordersData && typeof ordersData === 'object') { // Handle if API unexpectedly returns a single object
            setOrders([parseOrderFields(ordersData)]);
          }
        }
        
        // Fetch positions
        const positionsResponse = await fetch("/api/positions");
        if (positionsResponse.ok) {
          const positionsData = await positionsResponse.json();
          if (Array.isArray(positionsData)) {
            setPositions(
              positionsData.map((p: any) => {
                let newId = p.id;
                if (newId == null) { // Checks for null or undefined
                  newId = crypto.randomUUID();
                  console.warn(`[TradingContext] Position ID from API was null/undefined, generated new UUID: ${newId} for item:`, JSON.stringify(p));
                } else {
                  newId = String(newId);
                }
                // Rarely, String(something) can be 'NaN' if something was already NaN. crypto.randomUUID won't be.
                if (newId === 'NaN' || !newId.trim()) { 
                  const problematicId = newId;
                  newId = crypto.randomUUID(); 
                  console.error(`[TradingContext] Position ID from API was problematic ('${problematicId}'), using fallback UUID: ${newId} for item:`, JSON.stringify(p));
                }

                let processedPriceString = p.price; 
                if (typeof p.price === 'string') {
                  processedPriceString = p.price.replace(/,/g, '');
                }
                const tempAvgPrice = typeof processedPriceString === 'string' 
                                   ? parseFloat(processedPriceString) 
                                   : (typeof processedPriceString === 'number' ? processedPriceString : NaN);
                return {
                  id: newId,
                  accountName: String(p.name || 'N/A'),
                  accountNumber: String(p.account || ''),
                  symbol: String(p.symbol),
                  quantity: parseFloat(p.quantity), // Consider making this robust like price if needed
                  avgPrice: !isNaN(tempAvgPrice) ? tempAvgPrice : null, 
                  pnl: parseFloat(p.pnl), // Consider making this robust
                  timestamp: String(p.timestamp || new Date().toISOString()),
                };
              })
            );
          } else if (positionsData && typeof positionsData === 'object') { 
            let processedPriceString = positionsData.price; 
            if (typeof positionsData.price === 'string') {
              processedPriceString = positionsData.price.replace(/,/g, '');
            }
            const tempAvgPriceSingle = typeof processedPriceString === 'string' 
                               ? parseFloat(processedPriceString) 
                               : (typeof processedPriceString === 'number' ? processedPriceString : NaN);
            
            let singleNewId = positionsData.id;
            if (singleNewId == null) {
              singleNewId = crypto.randomUUID();
              console.warn(`[TradingContext] Single Position ID from API was null/undefined, generated new UUID: ${singleNewId} for item:`, JSON.stringify(positionsData));
            } else {
              singleNewId = String(singleNewId);
            }
            if (singleNewId === 'NaN' || !singleNewId.trim()) {
                const problematicId = singleNewId;
                singleNewId = crypto.randomUUID();
                console.error(`[TradingContext] Single Position ID from API was problematic ('${problematicId}'), using fallback UUID: ${singleNewId} for item:`, JSON.stringify(positionsData));
            }

            setPositions([{
              id: singleNewId,
              accountName: String(positionsData.name || 'N/A'),
              accountNumber: String(positionsData.account || ''),
              symbol: String(positionsData.symbol),
              quantity: parseFloat(positionsData.quantity),
              avgPrice: !isNaN(tempAvgPriceSingle) ? tempAvgPriceSingle : null, 
              pnl: parseFloat(positionsData.pnl),
              timestamp: String(positionsData.timestamp || new Date().toISOString()),
            }]);
          }
        }
        
        // Fetch band data
        const bandDataResponse = await fetch("/api/band-data");
        if (bandDataResponse.ok) {
          const bandDataData = await bandDataResponse.json();
          setBandData({
            ...bandDataData,
            premium: parseFloat(bandDataData.premium),
            upperBand: parseFloat(bandDataData.upperBand),
            lowerBand: parseFloat(bandDataData.lowerBand),
          });
        }
        
        // Fetch quote data for ES2023
        const quoteResponse = await fetch("/api/quote/ES2023");
        if (quoteResponse.ok) {
          const quoteData = await quoteResponse.json();
          setQuoteData(quoteData);
        }
        
        // Fetch program state
        const programStateResponse = await fetch("/api/program-state");
        if (programStateResponse.ok) {
          const programStateData = await programStateResponse.json();
          setProgramRunning(programStateData.running);
        }
        
        // Fetch initial Global Settings and Daily Parameters from inputs.json via the new endpoint
        try {
          const inputsResponse = await fetch("/api/inputs-from-file");
          if (inputsResponse.ok) {
            const inputsData = await inputsResponse.json();
            if (inputsData.globalSettings) {
              setGlobalSettings(inputsData.globalSettings);
          } else {
              console.warn("Global settings not found in inputs file, using defaults.");
            setGlobalSettings(defaultGlobalSettings);
          }
            if (inputsData.dailyParameters) {
              setDailyParameters(inputsData.dailyParameters);
            } else {
              console.warn("Daily parameters not found in inputs file, using defaults.");
              setDailyParameters(defaultDailyParameters);
            }
          } else {
            console.warn("Failed to fetch inputs from file, status:", inputsResponse.status, ". Using default settings.");
            setGlobalSettings(defaultGlobalSettings);
            setDailyParameters(defaultDailyParameters);
          }
        } catch (error) {
          console.error("Error fetching inputs from file:", error, ". Using default settings.");
          setGlobalSettings(defaultGlobalSettings);
          setDailyParameters(defaultDailyParameters);
        }
      } catch (error) {
        console.error("Error loading initial data:", error);
        toast({
          title: "Error loading data",
          description: "Failed to load initial data. Please check your connection.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadInitialData();
  }, [toast]);

  // Setup SignalR connection
  useEffect(() => {
    const connection = connectToSignalR({
      onBandDataUpdated: (data: any) => {
        if (!data) return;
        try {
          // Parse string fields to numbers
          const parsedBandData: BandData = {
            premium: parseFloat(data.premium),
            upperBand: parseFloat(data.upperBand),
            lowerBand: parseFloat(data.lowerBand),
            timestamp: data.timestamp,
            m1Close: parseFloat(data.m1Close),
            bollingerUpperBand: parseFloat(data.bollingerUpperBand),
            bollingerLowerBand: parseFloat(data.bollingerLowerBand)
          };
          setBandData(parsedBandData);
          
          // Add to historical data
          setHistoricalBandData(prev => {
            // Check if this timestamp already exists in historical data
            const exists = prev.some(item => item.timestamp === parsedBandData.timestamp);
            if (exists) return prev; // Skip if duplicate
            
            const updated = [...prev, parsedBandData];
            // Keep last 100 entries only
            return updated.slice(-100);
          });
        } catch (error) {
          console.error("Error processing band data update:", error);
        }
      },
      onPositionsUpdated: (data: Position | Position[]) => {
        const parsePosition = (p: any): Position => {
          let newId = p.id;
          if (newId == null) { 
            newId = crypto.randomUUID();
            console.warn(`[TradingContext] Position ID from SignalR was null/undefined, generated new UUID: ${newId} for item:`, JSON.stringify(p));
          } else {
            newId = String(newId);
          }
          if (newId === 'NaN' || !newId.trim()) {
            const problematicId = newId;
            newId = crypto.randomUUID(); 
            console.error(`[TradingContext] Position ID from SignalR was problematic ('${problematicId}'), using fallback UUID: ${newId} for item:`, JSON.stringify(p));
          }

          let processedPriceString = p.price; 
          if (typeof p.price === 'string') {
            processedPriceString = p.price.replace(/,/g, '');
          }
          const tempAvgPrice = typeof processedPriceString === 'string'
                             ? parseFloat(processedPriceString)
                             : (typeof processedPriceString === 'number' ? processedPriceString : NaN);

          return {
            id: newId,
            accountName: String(p.name || 'N/A'),
            accountNumber: String(p.account || ''),
            symbol: String(p.symbol),
            quantity: parseFloat(p.quantity), 
            avgPrice: !isNaN(tempAvgPrice) ? tempAvgPrice : null,
            pnl: parseFloat(p.pnl), 
            timestamp: String(p.timestamp || new Date().toISOString()),
          };
        };

        if (Array.isArray(data)) {
          setPositions(data.map(parsePosition));
        } else if (data) {
          const newPosition = parsePosition(data);
          setPositions(prevPositions => {
            const index = prevPositions.findIndex(p => p.id === newPosition.id);
            if (index !== -1) {
              const updatedPositions = [...prevPositions];
              updatedPositions[index] = newPosition;
              return updatedPositions;
            }
            return [...prevPositions, newPosition];
          });
        }
      },
      onOrdersUpdated: (data: Order | Order[]) => {
        console.log("%%%%% TradingContext: SignalR CALLBACK 'onOrdersUpdated' (for ReceiveOrders) TRIGGERED. RAW DATA:", JSON.stringify(data, null, 2));

        const parseOrder = (o: any): Order => {
          const rawPrice = o.price; 
          const rawQuantityOrdered = o.quantityOrdered;
          const rawQuantityLeft = o.quantityLeft;
          const rawAccountIdentifier = o.account;

          let processedPriceString = rawPrice;
          if (typeof rawPrice === 'string') {
            processedPriceString = rawPrice.replace(/,/g, '');
          }
          const tempPrice = typeof processedPriceString === 'string'
                             ? parseFloat(processedPriceString)
                             : (typeof processedPriceString === 'number' ? processedPriceString : NaN);

          let processedQuantityOrderedString = rawQuantityOrdered;
          if (typeof rawQuantityOrdered === 'string') {
            processedQuantityOrderedString = rawQuantityOrdered.replace(/,/g, '');
          }
          const tempQuantityOrdered = typeof processedQuantityOrderedString === 'string'
                               ? parseFloat(processedQuantityOrderedString)
                               : (typeof processedQuantityOrderedString === 'number' ? processedQuantityOrderedString : NaN);

          let processedQuantityLeftString = rawQuantityLeft;
          if (typeof rawQuantityLeft === 'string') {
            processedQuantityLeftString = rawQuantityLeft.replace(/,/g, '');
          }
          const tempQuantityLeft = typeof processedQuantityLeftString === 'string'
                               ? parseFloat(processedQuantityLeftString)
                               : (typeof processedQuantityLeftString === 'number' ? processedQuantityLeftString : NaN);
          return {
            ...(o as Omit<Order, 'price' | 'quantity' | 'quantityLeft' | 'account'>),
            id: String(o.id),
            account: String(rawAccountIdentifier || ''),
            price: !isNaN(tempPrice) ? tempPrice : null,
            quantity: !isNaN(tempQuantityOrdered) ? tempQuantityOrdered : null,
            quantityLeft: !isNaN(tempQuantityLeft) ? tempQuantityLeft : null, 
            symbol: String(o.symbol),
            side: o.side as "Buy" | "Sell",
            type: o.type as "Market" | "Limit" | "Stop" | "StopLimit",
            status: o.status as "Working" | "Filled" | "Cancelled" | "Rejected",
            timestamp: String(o.timestamp || new Date().toISOString()),
          };
        };

        if (Array.isArray(data)) {
          setOrders(data.map(parseOrder));
        } else if (data) {
          const newOrder = parseOrder(data);
          setOrders(prevOrders => {
            const index = prevOrders.findIndex(o => o.id === newOrder.id);
            if (index !== -1) {
              const updatedOrders = [...prevOrders];
              updatedOrders[index] = newOrder;
              return updatedOrders;
            }
            return [...prevOrders, newOrder]; 
          });
        }
      },
      onOrderAdded: (data: Order) => {
        const parseOrderForAdd = (o: any): Order => {
          const rawPrice = o.price; 
          const rawQuantityOrdered = o.quantityOrdered;
          const rawQuantityLeft = o.quantityLeft;
          const rawAccountIdentifier = o.account;

          let processedPriceString = rawPrice;
          if (typeof rawPrice === 'string') {
            processedPriceString = rawPrice.replace(/,/g, '');
          }
          const tempPrice = typeof processedPriceString === 'string'
                             ? parseFloat(processedPriceString)
                             : (typeof processedPriceString === 'number' ? processedPriceString : NaN);

          let processedQuantityOrderedString = rawQuantityOrdered;
          if (typeof rawQuantityOrdered === 'string') {
            processedQuantityOrderedString = rawQuantityOrdered.replace(/,/g, '');
          }
          const tempQuantityOrdered = typeof processedQuantityOrderedString === 'string'
                               ? parseFloat(processedQuantityOrderedString)
                               : (typeof processedQuantityOrderedString === 'number' ? processedQuantityOrderedString : NaN);

          let processedQuantityLeftString = rawQuantityLeft;
          if (typeof rawQuantityLeft === 'string') {
            processedQuantityLeftString = rawQuantityLeft.replace(/,/g, '');
          }
          const tempQuantityLeft = typeof processedQuantityLeftString === 'string'
                                 ? parseFloat(processedQuantityLeftString)
                                 : (typeof processedQuantityLeftString === 'number' ? processedQuantityLeftString : NaN);

          return {
            ...(o as Omit<Order, 'price' | 'quantity' | 'quantityLeft' | 'account'>),
            id: String(o.id),
            account: String(rawAccountIdentifier || ''),
            price: !isNaN(tempPrice) ? tempPrice : null,
            quantity: !isNaN(tempQuantityOrdered) ? tempQuantityOrdered : null,
            quantityLeft: !isNaN(tempQuantityLeft) ? tempQuantityLeft : null,
            symbol: String(o.symbol),
            side: o.side,
            type: o.type,
            status: o.status,
            timestamp: String(o.timestamp || new Date().toISOString()),
          };
        };
        const newOrder = parseOrderForAdd(data);
        setOrders(prev => [...prev, newOrder]);
      },
      onOrderUpdated: (data: any) => { 
        const rawPrice = data.price; 
        const rawQuantityOrdered = data.quantityOrdered;
        const rawQuantityLeft = data.quantityLeft;
        const rawAccountIdentifier = data.account;
        
        let processedPriceString = rawPrice;
        if (typeof rawPrice === 'string') {
          processedPriceString = rawPrice.replace(/,/g, '');
        }
        const tempPrice = typeof processedPriceString === 'string'
                            ? parseFloat(processedPriceString)
                            : (typeof processedPriceString === 'number' ? processedPriceString : NaN);

        let processedQuantityOrderedString = rawQuantityOrdered;
        if (typeof rawQuantityOrdered === 'string') {
          processedQuantityOrderedString = rawQuantityOrdered.replace(/,/g, '');
        }
        const tempQuantityOrdered = typeof processedQuantityOrderedString === 'string'
                               ? parseFloat(processedQuantityOrderedString)
                               : (typeof processedQuantityOrderedString === 'number' ? processedQuantityOrderedString : NaN);

        let processedQuantityLeftString = rawQuantityLeft;
        if (typeof rawQuantityLeft === 'string') {
          processedQuantityLeftString = rawQuantityLeft.replace(/,/g, '');
        }
        const tempQuantityLeft = typeof processedQuantityLeftString === 'string'
                               ? parseFloat(processedQuantityLeftString)
                               : (typeof processedQuantityLeftString === 'number' ? processedQuantityLeftString : NaN);

        const updatedOrder: Order = {
          id: String(data.id),
          account: String(rawAccountIdentifier || ''),
          symbol: String(data.symbol),
          quantity: !isNaN(tempQuantityOrdered) ? tempQuantityOrdered : null, 
          quantityLeft: !isNaN(tempQuantityLeft) ? tempQuantityLeft : null,
          price: !isNaN(tempPrice) ? tempPrice : null,          
          side: data.side as "Buy" | "Sell",
          type: data.type as "Market" | "Limit" | "Stop" | "StopLimit",
          status: data.status as "Working" | "Filled" | "Cancelled" | "Rejected",
          timestamp: String(data.timestamp || new Date().toISOString()),
        };

        setOrders(prev => prev.map(order => order.id === updatedOrder.id ? updatedOrder : order));
      },
      onOrderDeleted: (data: { id: string }) => {
        setOrders(prev => prev.filter(order => order.id !== data.id));
      },
      onServiceStatusUpdated: (data: { source: string, message: string, timestamp: string }) => {
        console.log("[TradingContext] onServiceStatusUpdated received:", data);
        const sourceLower = data.source.toLowerCase();
        const now = new Date().toISOString();

        // Example: Assuming VIX data might come in the message field for $vix.x stream
        // This will need to be adjusted based on actual backend payload for VIX price/change
        if (sourceLower === "$vix.x stream") {
          setLastVixUpdate(now);
          // Attempt to parse VIX data from the message or a dedicated field in `data`
          // This is a placeholder - actual parsing logic depends on backend message structure
          try {
            // Option 1: If message itself is JSON like {"price": 15.5, "change": 0.2}
            // const vixInfo = JSON.parse(data.message); 
            // setVixQuoteData({ price: parseFloat(vixInfo.price), change: parseFloat(vixInfo.change), timestamp: data.timestamp });
            
            // Option 2: If price is in the message string, e.g. "Latest $VIX.X update: 15.5 (+0.2%)"
            // This is highly speculative and needs robust parsing if this is the case.
            // For now, if specific VIX data isn't directly in `data.price`, `data.change` etc.
            // we will rely on a different SignalR message for VIX quotes or update this later.
            console.warn("[TradingContext] Received $vix.x stream status, but VIX price/change parsing is not fully implemented here. Waiting for dedicated VIX quote message or more structured data.");
            // If data object contains price/change directly for VIX source:
            // if (typeof (data as any).price === 'number') {
            //   setVixQuoteData({
            //     price: (data as any).price,
            //     change: typeof (data as any).change === 'number' ? (data as any).change : null,
            //     timestamp: data.timestamp || now
            //   });
            // }
          } catch (e) {
            console.error("[TradingContext] Error parsing VIX data from service status message:", e);
          }
        } else if (sourceLower.includes("stream") && !sourceLower.includes("$vix.x")) {
          setLastAssetUpdate(now);
          console.log(`[TradingContext] Asset data timestamp updated via source '${data.source}': ${data.timestamp}`);
        }

        // Rule 3: Quote Data from source (can be independent or overlap, e.g. a VIX quote stream)
        // If a source can be both an asset stream and a quote source, this logic is fine.
        if (sourceLower.includes("quotes")) { 
          setLastQuoteFeedUpdate(data.timestamp);
          console.log(`[TradingContext] Quote Feed data timestamp updated via source '${data.source}': ${data.timestamp}`);
        }

        // Rule 4: Signal Data from source (placeholder rule)
        if (sourceLower.includes("signal")) { 
          setLastSignalUpdate(data.timestamp);
          console.log(`[TradingContext] Signal data timestamp updated via source '${data.source}': ${data.timestamp}`);
        }
      },
      onLogAdded: (receivedData) => {
        console.log("[TradingContext] onLogAdded receivedData:", receivedData);
        const logEntry = receivedData && receivedData.type === "logAdded" && receivedData.data 
          ? receivedData.data 
          : receivedData;
        console.log("[TradingContext] onLogAdded extracted logEntry:", logEntry);

        if (logEntry && typeof logEntry.message === 'string' && typeof logEntry.type === 'string') {
          setLogs(prev => {
            const newLogs = [logEntry, ...prev].slice(0, 1000);
            console.log("[TradingContext] onLogAdded newLogs state:", newLogs);
            return newLogs;
          });
        } else {
          console.warn("[TradingContext] Received malformed log data via WebSocket or non-log data for ReceiveLogs:", receivedData);
        }
      },
      onLogsUpdated: (data) => {
        setLogs(data);
      },
      onProgramStateUpdated: (data) => {
        setProgramRunning(data.running);
      },
      onQuoteUpdated: (data) => {
        if (data) {
          console.log("[TradingContext] onQuoteUpdated received data:", JSON.stringify(data));
          setQuoteData(prevQuoteData => ({
            ...prevQuoteData,
            ...data,
            price: data.price !== undefined ? parseFloat(String(data.price).replace(/,/g, '')) : (prevQuoteData?.price || 0),
            bid: data.bid !== undefined 
              ? (data.bid === null ? null : parseFloat(String(data.bid).replace(/,/g, ''))) 
              : (prevQuoteData?.bid === undefined ? null : prevQuoteData.bid),
            ask: data.ask !== undefined 
              ? (data.ask === null ? null : parseFloat(String(data.ask).replace(/,/g, ''))) 
              : (prevQuoteData?.ask === undefined ? null : prevQuoteData.ask),
            change: data.change !== undefined ? parseFloat(String(data.change).replace(/,/g, '')) : (prevQuoteData?.change || 0),
            timestamp: data.timestamp !== undefined ? String(data.timestamp) : (prevQuoteData?.timestamp || new Date().toISOString()),
            symbol: data.symbol !== undefined ? String(data.symbol) : (prevQuoteData?.symbol || 'N/A'),
            id: data.id !== undefined ? data.id : (prevQuoteData?.id || 0),
          }));
        } else {
          console.warn("[TradingContext] onQuoteUpdated received null or undefined data.");
        }
      },
      onSettingUpdated: (data) => {
        if (data.type === 'global') {
          setGlobalSettings(data.data);
        } else if (data.type === 'daily') {
          setDailyParameters(data.data);
        }
      },
      onVixQuoteUpdated: (data: VixQuoteData) => { // New handler for dedicated VIX quote updates
        console.log("[TradingContext] onVixQuoteUpdated received data:", JSON.stringify(data));
        if (data) {
          setVixQuoteData({
            price: data.price !== undefined && data.price !== null ? parseFloat(String(data.price).replace(/,/g, '')) : null,
            change: data.change !== undefined && data.change !== null ? parseFloat(String(data.change).replace(/,/g, '')) : null,
            timestamp: data.timestamp || new Date().toISOString(),
          });
        }
      },
      onHistoricalBandDataReceived: (data: any[]) => {
        if (!Array.isArray(data)) return;
        try {
          const parsedHistoricalData = data.map(item => ({
            premium: parseFloat(item.premium),
            upperBand: parseFloat(item.upperBand),
            lowerBand: parseFloat(item.lowerBand),
            timestamp: item.timestamp,
            m1Close: parseFloat(item.m1Close),
            bollingerUpperBand: parseFloat(item.bollingerUpperBand),
            bollingerLowerBand: parseFloat(item.bollingerLowerBand)
          }));
          setHistoricalBandData(parsedHistoricalData);
        } catch (error) {
          console.error("Error processing historical band data:", error);
        }
      }
    });
    
    // Cleanup connection when component unmounts
    return () => {
      disconnectFromSignalR(connection);
    };
  }, []);

  // Handler functions
  const toggleProgramState = async () => {
    try {
      await apiRequest("POST", "/api/program-state/toggle", {});
      // State will be updated via SignalR
    } catch (error) {
      console.error("Error toggling program state:", error);
      toast({
        title: "Error",
        description: "Failed to toggle program state.",
        variant: "destructive"
      });
    }
  };
  
  const saveGlobalSettings = async (settings: GlobalSettings) => {
    try {
      await apiRequest("POST", "/api/settings/global", settings);
      toast({
        title: "Success",
        description: "Global settings saved successfully."
      });
    } catch (error) {
      console.error("Error saving global settings:", error);
      toast({
        title: "Error",
        description: "Failed to save global settings.",
        variant: "destructive"
      });
    }
  };
  
  const saveDailyParameters = async (parameters: DailyParameters) => {
    try {
      await apiRequest("POST", "/api/settings/daily", parameters);
      toast({
        title: "Success",
        description: "Daily parameters saved successfully."
      });
    } catch (error) {
      console.error("Error saving daily parameters:", error);
      toast({
        title: "Error",
        description: "Failed to save daily parameters.",
        variant: "destructive"
      });
    }
  };
  
  const addAccount = async (account: Omit<Account, "id">) => {
    try {
      const res = await apiRequest("POST", "/api/accounts", account);
      const newAccount = await res.json();
      setAccounts(prev => [...prev, newAccount]);
      toast({
        title: "Success",
        description: "Account added successfully."
      });
    } catch (error) {
      console.error("Error adding account:", error);
      toast({
        title: "Error",
        description: "Failed to add account.",
        variant: "destructive"
      });
    }
  };
  
  const updateAccount = async (id: number, accountUpdate: Partial<Account>) => {
    try {
      const res = await apiRequest("PUT", `/api/accounts/${id}`, accountUpdate);
      const updatedAccount = await res.json();
      setAccounts(prev => prev.map(account => account.id === id ? updatedAccount : account));
      toast({
        title: "Success",
        description: "Account updated successfully."
      });
    } catch (error) {
      console.error("Error updating account:", error);
      toast({
        title: "Error",
        description: "Failed to update account.",
        variant: "destructive"
      });
    }
  };
  
  const deleteAccount = async (id: number) => {
    try {
      await apiRequest("DELETE", `/api/accounts/${id}`);
      setAccounts(prev => prev.filter(account => account.id !== id));
      toast({
        title: "Success",
        description: "Account deleted successfully."
      });
    } catch (error) {
      console.error("Error deleting account:", error);
      toast({
        title: "Error",
        description: "Failed to delete account.",
        variant: "destructive"
      });
    }
  };
  
  const placeOrder = async (order: Omit<Order, "id" | "createdAt">) => {
    try {
      await apiRequest("POST", "/api/orders", order);
      // Order will be added via SignalR
      toast({
        title: "Success",
        description: "Order placed successfully."
      });
    } catch (error) {
      console.error("Error placing order:", error);
      toast({
        title: "Error",
        description: "Failed to place order.",
        variant: "destructive"
      });
    }
  };
  
  const updateOrder = async (id: number, orderUpdate: Partial<Order>) => {
    try {
      await apiRequest("PUT", `/api/orders/${id}`, orderUpdate);
      // Order will be updated via SignalR
      toast({
        title: "Success",
        description: "Order updated successfully."
      });
    } catch (error) {
      console.error("Error updating order:", error);
      toast({
        title: "Error",
        description: "Failed to update order.",
        variant: "destructive"
      });
    }
  };
  
  const cancelOrder = async (id: number) => {
    try {
      await apiRequest("DELETE", `/api/orders/${id}`);
      // Order will be deleted via SignalR
      toast({
        title: "Success",
        description: "Order canceled successfully."
      });
    } catch (error) {
      console.error("Error canceling order:", error);
      toast({
        title: "Error",
        description: "Failed to cancel order.",
        variant: "destructive"
      });
    }
  };

  return (
    <TradingContext.Provider 
      value={{
        // Data
        accounts,
        orders,
        positions,
        logs,
        // serviceStatus, // Old
        serviceLogMessages, // New
        bandData,
        historicalBandData,
        quoteData,
        programRunning,
        globalSettings,
        dailyParameters,
        
        // Timestamps for specific service data updates
        lastVixUpdate,
        lastAssetUpdate,
        lastQuoteFeedUpdate,
        lastSignalUpdate,
        
        // Loading state
        isLoading,

        // Actions
        toggleProgramState,
        saveGlobalSettings,
        saveDailyParameters,
        addAccount,
        updateAccount,
        deleteAccount,
        placeOrder,
        updateOrder,
        cancelOrder,

        // Filtering
        selectedAccount,
        setSelectedAccount,
        selectedLogLevel,
        setSelectedLogLevel,

        vixQuoteData,
      }}
    >
      {children}
    </TradingContext.Provider>
  );
};

export const useTradingContext = () => useContext(TradingContext);
