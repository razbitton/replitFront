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
  id: number;
  accountId: number;
  symbol: string;
  side: "Buy" | "Sell";
  quantity: number;
  price: number;
  orderType: string;
  timeInForce: string;
  status: string;
  createdAt: string;
};

export type Position = {
  id: number;
  accountId: number;
  symbol: string;
  quantity: number;
  avgPrice: number;
  pnl: number;
};

export type Log = {
  id: number;
  timestamp: string;
  level: string;
  message: string;
};

export type ServiceStatus = {
  id: number;
  name: string;
  status: string;
  details: string | null;
  updatedAt: string;
};

export type BandData = {
  id: number;
  premium: number;
  upperBand: number;
  lowerBand: number;
  timestamp: string;
};

export type QuoteData = {
  id: number;
  symbol: string;
  price: number;
  change: number;
  timestamp: string;
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
};

export type DayParameter = {
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

export type DailyParameters = DayParameter[];

// Context value type
type TradingContextType = {
  // Data
  accounts: Account[];
  orders: Order[];
  positions: Position[];
  logs: Log[];
  serviceStatus: ServiceStatus[];
  bandData: BandData | null;
  quoteData: QuoteData | null;
  programRunning: boolean;
  globalSettings: GlobalSettings | null;
  dailyParameters: DailyParameters | null;
  
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
};

// Default global settings
const defaultGlobalSettings: GlobalSettings = {
  futureSymbol: "ES",
  expirationDate: new Date().toISOString().split("T")[0],
  initialMargin: 12000,
  maintenanceMargin: 10000,
  contractSize: 50,
  tickValue: 12.5,
  tradingHoursStart: "09:30",
  tradingHoursEnd: "16:00",
  maxPositionSize: 5,
  maxDailyLoss: 2000,
  targetProfit: 4000
};

// Default daily parameters
const defaultDailyParameters: DailyParameters = [
  {
    day: "Monday",
    upperBandThreshold: 4.62,
    lowerBandThreshold: 1.24,
    maxTradeQuantity: 3,
    premiumVolatilityFactor: 15,
    tradingStrategy: "Mean Reversion",
    timeAdjustments: {
      marketOpen: 0.2,
      midDay: -0.1,
      marketClose: 0.3
    }
  },
  {
    day: "Tuesday",
    upperBandThreshold: 4.62,
    lowerBandThreshold: 1.24,
    maxTradeQuantity: 3,
    premiumVolatilityFactor: 15,
    tradingStrategy: "Mean Reversion",
    timeAdjustments: {
      marketOpen: 0.2,
      midDay: -0.1,
      marketClose: 0.3
    }
  },
  {
    day: "Wednesday",
    upperBandThreshold: 4.62,
    lowerBandThreshold: 1.24,
    maxTradeQuantity: 3,
    premiumVolatilityFactor: 15,
    tradingStrategy: "Mean Reversion",
    timeAdjustments: {
      marketOpen: 0.2,
      midDay: -0.1,
      marketClose: 0.3
    }
  },
  {
    day: "Thursday",
    upperBandThreshold: 4.62,
    lowerBandThreshold: 1.24,
    maxTradeQuantity: 3,
    premiumVolatilityFactor: 15,
    tradingStrategy: "Mean Reversion",
    timeAdjustments: {
      marketOpen: 0.2,
      midDay: -0.1,
      marketClose: 0.3
    }
  },
  {
    day: "Friday",
    upperBandThreshold: 4.62,
    lowerBandThreshold: 1.24,
    maxTradeQuantity: 3,
    premiumVolatilityFactor: 15,
    tradingStrategy: "Mean Reversion",
    timeAdjustments: {
      marketOpen: 0.2,
      midDay: -0.1,
      marketClose: 0.3
    }
  }
];

// Create context with default values
const TradingContext = createContext<TradingContextType>({
  // Data
  accounts: [],
  orders: [],
  positions: [],
  logs: [],
  serviceStatus: [],
  bandData: null,
  quoteData: null,
  programRunning: false,
  globalSettings: null,
  dailyParameters: null,
  
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
});

export const TradingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State for all data
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus[]>([]);
  const [bandData, setBandData] = useState<BandData | null>(null);
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const [programRunning, setProgramRunning] = useState<boolean>(false);
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings | null>(null);
  const [dailyParameters, setDailyParameters] = useState<DailyParameters | null>(null);
  
  // Loading state
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Filtering state
  const [selectedAccount, setSelectedAccount] = useState<string>("All Accounts");
  const [selectedLogLevel, setSelectedLogLevel] = useState<string>("All Levels");
  
  const { toast } = useToast();

  // Load initial data
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
          setOrders(ordersData);
        }
        
        // Fetch positions
        const positionsResponse = await fetch("/api/positions");
        if (positionsResponse.ok) {
          const positionsData = await positionsResponse.json();
          setPositions(positionsData);
        }
        
        // Fetch logs
        const logsResponse = await fetch("/api/logs");
        if (logsResponse.ok) {
          const logsData = await logsResponse.json();
          setLogs(logsData);
        }
        
        // Fetch service status
        const serviceStatusResponse = await fetch("/api/service-status");
        if (serviceStatusResponse.ok) {
          const serviceStatusData = await serviceStatusResponse.json();
          setServiceStatus(serviceStatusData);
        }
        
        // Fetch band data
        const bandDataResponse = await fetch("/api/band-data");
        if (bandDataResponse.ok) {
          const bandDataData = await bandDataResponse.json();
          setBandData(bandDataData);
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
        
        // Fetch global settings
        try {
          const globalSettingsResponse = await fetch("/api/settings/global");
          if (globalSettingsResponse.ok) {
            const globalSettingsData = await globalSettingsResponse.json();
            setGlobalSettings(globalSettingsData);
          } else {
            // If not found, use defaults
            setGlobalSettings(defaultGlobalSettings);
          }
        } catch (error) {
          // If error, use defaults
          setGlobalSettings(defaultGlobalSettings);
        }
        
        // Fetch daily parameters
        try {
          const dailyParametersResponse = await fetch("/api/settings/daily");
          if (dailyParametersResponse.ok) {
            const dailyParametersData = await dailyParametersResponse.json();
            setDailyParameters(dailyParametersData);
          } else {
            // If not found, use defaults
            setDailyParameters(defaultDailyParameters);
          }
        } catch (error) {
          // If error, use defaults
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
      onBandDataUpdated: (data) => {
        setBandData(data);
      },
      onPositionsUpdated: (data) => {
        setPositions(data);
      },
      onOrdersUpdated: (data) => {
        setOrders(data);
      },
      onOrderAdded: (data) => {
        setOrders(prev => [...prev, data]);
      },
      onOrderUpdated: (data) => {
        setOrders(prev => prev.map(order => order.id === data.id ? data : order));
      },
      onOrderDeleted: (data) => {
        setOrders(prev => prev.filter(order => order.id !== data.id));
      },
      onServiceStatusUpdated: (data) => {
        setServiceStatus(data);
      },
      onLogAdded: (data) => {
        setLogs(prev => [data, ...prev].slice(0, 1000)); // Keep only last 1000 logs
      },
      onLogsUpdated: (data) => {
        setLogs(data);
      },
      onProgramStateUpdated: (data) => {
        setProgramRunning(data.running);
      },
      onQuoteUpdated: (data) => {
        setQuoteData(data);
      },
      onSettingUpdated: (data) => {
        if (data.type === 'global') {
          setGlobalSettings(data.data);
        } else if (data.type === 'daily') {
          setDailyParameters(data.data);
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
        serviceStatus,
        bandData,
        quoteData,
        programRunning,
        globalSettings,
        dailyParameters,
        
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
      }}
    >
      {children}
    </TradingContext.Provider>
  );
};

export const useTradingContext = () => useContext(TradingContext);
