import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTradingContext } from "@/contexts/TradingContext";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpIcon } from "lucide-react";
import { Chart, registerables } from "chart.js";
import { 
  getBandDataHistory, 
  getQuoteHistory 
} from "@/lib/backendIntegration";
import {
  preparePremiumChartData,
  prepareAssetChartData,
  prepareBollingerBandsData,
  preparePremiumDistributionData,
  commonChartOptions
} from "@/lib/chartUtils";

// Register Chart.js components
Chart.register(...registerables);

const DetailedMetrics = () => {
  const { bandData, quoteData, isLoading } = useTradingContext();
  const [activeTab, setActiveTab] = useState("premiumMetrics");
  const [bandDataHistory, setBandDataHistory] = useState<any[]>([]);
  const [quoteHistory, setQuoteHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [inTradingWindow, setInTradingWindow] = useState(true); // In or Out of trading window
  const [vixPrice, setVixPrice] = useState(18.75); // Mock VIX price
  
  // Trading conditions for the blocks section
  const [tradingConditions, setTradingConditions] = useState([
    { title: "Threshold Condition", value: Math.random() > 0.5 },
    { title: "Premium Volatility", value: Math.random() > 0.5 },
    { title: "Band Cross Signal", value: Math.random() > 0.5 },
    { title: "Market Hours", value: Math.random() > 0.5 },
    { title: "Risk Limit", value: Math.random() > 0.5 },
    { title: "Momentum Indicator", value: Math.random() > 0.5 },
    { title: "Liquidity Condition", value: Math.random() > 0.5 },
    { title: "Position Capacity", value: Math.random() > 0.5 },
  ]);

  // Chart refs
  const premiumChartRef = useRef<HTMLCanvasElement>(null);
  const bollingerChartRef = useRef<HTMLCanvasElement>(null);
  const premiumDistChartRef = useRef<HTMLCanvasElement>(null);

  // Chart instances
  const premiumChartInstance = useRef<Chart | null>(null);
  const bollingerChartInstance = useRef<Chart | null>(null);
  const premiumDistChartInstance = useRef<Chart | null>(null);

  // Fetch historical data
  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        setHistoryLoading(true);
        const [bandHistory, quoteHistoryData] = await Promise.all([
          getBandDataHistory(100),
          getQuoteHistory("ES2023", 100)
        ]);
        
        setBandDataHistory(bandHistory);
        setQuoteHistory(quoteHistoryData);
      } catch (error) {
        console.error("Failed to fetch historical data:", error);
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchHistoricalData();
    
    // Set up interval to refresh data every minute
    const interval = setInterval(fetchHistoricalData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Initialize and update charts when data or active tab changes
  useEffect(() => {
    // Cleanup function to destroy existing chart instances
    const cleanup = () => {
      if (premiumChartInstance.current) {
        premiumChartInstance.current.destroy();
        premiumChartInstance.current = null;
      }
      if (bollingerChartInstance.current) {
        bollingerChartInstance.current.destroy();
        bollingerChartInstance.current = null;
      }
    };

    // Clean up existing charts
    cleanup();

    // Don't initialize if data isn't ready
    if (historyLoading || !bandDataHistory.length || !quoteHistory.length) {
      return;
    }

    // Wait for next tick to ensure DOM is ready
    setTimeout(() => {
      const initializeCharts = () => {
      // Premium Metrics Chart
      if (activeTab === "premiumMetrics" && premiumChartRef.current) {
        if (premiumChartInstance.current) {
          premiumChartInstance.current.destroy();
        }
        
        const ctx = premiumChartRef.current.getContext("2d");
        if (ctx) {
          const data = preparePremiumChartData(bandDataHistory);
          premiumChartInstance.current = new Chart(ctx, {
            type: "line",
            data,
            options: commonChartOptions
          });
        }
      }
      
      // Bollinger Bands Chart
      if (activeTab === "bollingerMetrics" && bollingerChartRef.current) {
        if (bollingerChartInstance.current) {
          bollingerChartInstance.current.destroy();
        }
        
        const ctx = bollingerChartRef.current.getContext("2d");
        if (ctx) {
          const data = prepareBollingerBandsData(quoteHistory);
          
          bollingerChartInstance.current = new Chart(ctx, {
            type: "line",
            data,
            options: commonChartOptions
          });
        }
      }
      
      // Premium Distribution Chart
      if (activeTab === "premiumMetrics" && premiumDistChartRef.current) {
        if (premiumDistChartInstance.current) {
          premiumDistChartInstance.current.destroy();
        }
        
        const ctx = premiumDistChartRef.current.getContext("2d");
        if (ctx) {
          const data = preparePremiumDistributionData(bandDataHistory);
          premiumDistChartInstance.current = new Chart(ctx, {
            type: "bar",
            data,
            options: {
              ...commonChartOptions,
              plugins: {
                ...commonChartOptions.plugins,
                legend: {
                  display: false
                }
              }
            }
          });
        }
      }
    };

    initializeCharts();
    }, 0);
    
    // Cleanup chart instances on unmount
    return cleanup;
  }, [activeTab, historyLoading, bandDataHistory, quoteHistory]);
  
  // Update trading conditions randomly every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTradingConditions(prev => 
        prev.map(condition => ({
          ...condition,
          value: Math.random() > 0.5
        }))
      );
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Format price with commas
  const formatPrice = (price: number) => {
    return price.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <div>
      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {/* Symbol Card */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm text-gray-500 dark:text-gray-400">Symbol</h3>
            <div className="text-2xl font-semibold mt-1">
              {isLoading ? <Skeleton className="h-8 w-20" /> : quoteData?.symbol || "ES2023"}
            </div>
            <div className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              S&P 500 E-mini Future
            </div>
          </CardContent>
        </Card>
        
        {/* Asset Price Card */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm text-gray-500 dark:text-gray-400">Asset Price</h3>
            <div className="flex items-center mt-1">
              <div className="text-2xl font-semibold font-mono">
                {isLoading ? (
                  <Skeleton className="h-8 w-28" />
                ) : (
                  formatPrice(quoteData?.price || 0)
                )}
              </div>
              {!isLoading && quoteData && (
                <span className={`flex items-center ${quoteData.change >= 0 ? 'text-green-500' : 'text-red-500'} ml-2 text-sm`}>
                  {quoteData.change >= 0 ? (
                    <ArrowUpIcon className="w-4 h-4 mr-1" />
                  ) : (
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7-7-7"></path>
                    </svg>
                  )}
                  {Math.abs(quoteData.change).toFixed(2)}%
                </span>
              )}
            </div>
            <div className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Last updated: {isLoading ? <Skeleton className="h-4 w-24 inline-block" /> : 
                quoteData ? new Date(quoteData.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'}) : ''}
            </div>
          </CardContent>
        </Card>
        
        {/* VIX Price Card */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm text-gray-500 dark:text-gray-400">VIX Price</h3>
            <div className="flex items-center mt-1">
              <div className="text-2xl font-semibold font-mono">
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  vixPrice.toFixed(2)
                )}
              </div>
              <span className="flex items-center text-red-500 ml-2 text-sm">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7-7-7"></path>
                </svg>
                0.35%
              </span>
            </div>
            <div className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              CBOE Volatility Index
            </div>
          </CardContent>
        </Card>
        
        {/* Trading Window Card */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm text-gray-500 dark:text-gray-400">Trading Window</h3>
            <div className="text-2xl font-semibold mt-1">
              {isLoading ? <Skeleton className="h-8 w-24" /> : inTradingWindow ? (
                <span className="text-green-500">In Window</span>
              ) : (
                <span className="text-red-500">Out of Window</span>
              )}
            </div>
            <div className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              {isLoading ? <Skeleton className="h-4 w-32" /> : "Next window: 09:30 ET"}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Tab Navigation */}
      <Card>
        <Tabs defaultValue="premiumMetrics" value={activeTab} onValueChange={setActiveTab}>
          <CardHeader className="border-b px-6 py-0">
            <TabsList className="justify-start w-full border-b-0">
              <TabsTrigger className="data-[state=active]:border-primary-500 py-4 px-6" value="premiumMetrics">Premium Metrics</TabsTrigger>
              <TabsTrigger className="data-[state=active]:border-primary-500 py-4 px-6" value="bollingerMetrics">Bollinger Metrics</TabsTrigger>
            </TabsList>
          </CardHeader>
          
          {/* Tab Contents */}
          <CardContent className="p-6">
            {/* Premium Metrics Tab */}
            <TabsContent value="premiumMetrics">
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">Premium Analysis</h3>
                <div className={`bg-gray-50 dark:bg-gray-700 p-6 rounded-lg ${historyLoading ? 'h-[300px] flex items-center justify-center' : ''}`}>
                  {historyLoading ? (
                    <Skeleton className="h-[260px] w-full" />
                  ) : (
                    <canvas id="premiumChart" height="300" ref={premiumChartRef}></canvas>
                  )}
                </div>
              </div>
            </TabsContent>
            
            {/* Bollinger Metrics Tab */}
            <TabsContent value="bollingerMetrics">
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">Asset Price with Bollinger Bands</h3>
                <div className={`bg-gray-50 dark:bg-gray-700 p-6 rounded-lg ${historyLoading ? 'h-[300px] flex items-center justify-center' : ''}`}>
                  {historyLoading ? (
                    <Skeleton className="h-[260px] w-full" />
                  ) : (
                    <canvas id="bollingerChart" height="300" ref={bollingerChartRef}></canvas>
                  )}
                </div>
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
      
      {/* Trading Condition Blocks */}
      <div className="mt-6">
        <h3 className="text-lg font-medium mb-4">Trading Conditions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {tradingConditions.map((condition, index) => (
            <div 
              key={index} 
              className={`p-4 rounded-lg ${condition.value ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}
            >
              <h4 className="text-sm font-medium mb-1">{condition.title}</h4>
              <p className={`text-lg font-semibold ${condition.value ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                {condition.value ? 'TRUE' : 'FALSE'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DetailedMetrics;