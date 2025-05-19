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
  preparePremiumDistributionData,
  preparePriceActivityHeatmap,
  commonChartOptions
} from "@/lib/chartUtils";

// Register Chart.js components
Chart.register(...registerables);

const DetailedMetrics = () => {
  const { bandData, quoteData, isLoading } = useTradingContext();
  const [activeTab, setActiveTab] = useState("overview");
  const [bandDataHistory, setBandDataHistory] = useState<any[]>([]);
  const [quoteHistory, setQuoteHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Chart refs
  const overviewChartRef = useRef<HTMLCanvasElement>(null);
  const premiumChartRef = useRef<HTMLCanvasElement>(null);
  const assetChartRef = useRef<HTMLCanvasElement>(null);
  const premiumDistChartRef = useRef<HTMLCanvasElement>(null);
  const heatmapChartRef = useRef<HTMLCanvasElement>(null);

  // Chart instances
  const overviewChartInstance = useRef<Chart | null>(null);
  const premiumChartInstance = useRef<Chart | null>(null);
  const assetChartInstance = useRef<Chart | null>(null);
  const premiumDistChartInstance = useRef<Chart | null>(null);
  const heatmapChartInstance = useRef<Chart | null>(null);

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
    if (historyLoading || !bandDataHistory.length || !quoteHistory.length) return;

    const initializeCharts = () => {
      // Overview Chart (Premium with bands)
      if (activeTab === "overview" && overviewChartRef.current) {
        if (overviewChartInstance.current) {
          overviewChartInstance.current.destroy();
        }
        
        const ctx = overviewChartRef.current.getContext("2d");
        if (ctx) {
          const data = preparePremiumChartData(bandDataHistory);
          overviewChartInstance.current = new Chart(ctx, {
            type: "line",
            data,
            options: commonChartOptions
          });
        }
      }
      
      // Premium Chart
      if (activeTab === "premium" && premiumChartRef.current) {
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
      
      // Asset Chart
      if (activeTab === "asset" && assetChartRef.current) {
        if (assetChartInstance.current) {
          assetChartInstance.current.destroy();
        }
        
        const ctx = assetChartRef.current.getContext("2d");
        if (ctx) {
          const data = prepareAssetChartData(quoteHistory);
          assetChartInstance.current = new Chart(ctx, {
            type: "line",
            data,
            options: commonChartOptions
          });
        }
      }
      
      // Premium Distribution Chart
      if (activeTab === "premium" && premiumDistChartRef.current) {
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
      
      // Price Activity Heatmap Chart
      if (activeTab === "asset" && heatmapChartRef.current) {
        if (heatmapChartInstance.current) {
          heatmapChartInstance.current.destroy();
        }
        
        const ctx = heatmapChartRef.current.getContext("2d");
        if (ctx) {
          const data = preparePriceActivityHeatmap(quoteHistory);
          heatmapChartInstance.current = new Chart(ctx, {
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
    
    // Cleanup chart instances on unmount
    return () => {
      if (overviewChartInstance.current) {
        overviewChartInstance.current.destroy();
        overviewChartInstance.current = null;
      }
      if (premiumChartInstance.current) {
        premiumChartInstance.current.destroy();
        premiumChartInstance.current = null;
      }
      if (assetChartInstance.current) {
        assetChartInstance.current.destroy();
        assetChartInstance.current = null;
      }
      if (premiumDistChartInstance.current) {
        premiumDistChartInstance.current.destroy();
        premiumDistChartInstance.current = null;
      }
      if (heatmapChartInstance.current) {
        heatmapChartInstance.current.destroy();
        heatmapChartInstance.current = null;
      }
    };
  }, [activeTab, historyLoading, bandDataHistory, quoteHistory]);

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
        
        {/* Premium Card */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm text-gray-500 dark:text-gray-400">Premium</h3>
            <div className="flex items-center mt-1">
              <div className="text-2xl font-semibold font-mono">
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  `$${bandData?.premium.toFixed(2) || "0.00"}`
                )}
              </div>
              <span className="flex items-center text-green-500 ml-2 text-sm">
                <ArrowUpIcon className="w-4 h-4 mr-1" />
                0.82%
              </span>
            </div>
            <div className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Current premium value
            </div>
          </CardContent>
        </Card>
        
        {/* Position Card */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm text-gray-500 dark:text-gray-400">Net Position</h3>
            <div className="text-2xl font-semibold font-mono mt-1">
              {isLoading ? <Skeleton className="h-8 w-10" /> : "+1"}
            </div>
            <div className="text-green-500 dark:text-green-400 text-sm mt-1">
              {isLoading ? <Skeleton className="h-4 w-32" /> : "P/L: +$900.00 (0.21%)"}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Tab Navigation */}
      <Card>
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <CardHeader className="border-b px-6 py-0">
            <TabsList className="justify-start w-full border-b-0">
              <TabsTrigger className="data-[state=active]:border-primary-500 py-4 px-6" value="overview">Overview</TabsTrigger>
              <TabsTrigger className="data-[state=active]:border-primary-500 py-4 px-6" value="premium">Premium Metrics</TabsTrigger>
              <TabsTrigger className="data-[state=active]:border-primary-500 py-4 px-6" value="asset">Asset Metrics</TabsTrigger>
            </TabsList>
          </CardHeader>
          
          {/* Tab Contents */}
          <CardContent className="p-6">
            {/* Overview Tab */}
            <TabsContent value="overview">
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">Performance Summary</h3>
                <div className={`bg-gray-50 dark:bg-gray-700 p-6 rounded-lg ${historyLoading ? 'h-[300px] flex items-center justify-center' : ''}`}>
                  {historyLoading ? (
                    <Skeleton className="h-[260px] w-full" />
                  ) : (
                    <canvas id="overviewChart" height="300" ref={overviewChartRef}></canvas>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-sm font-medium mb-2">Premium Condition</h4>
                  <div className="flex items-center">
                    <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                      <svg className="h-6 w-6 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-lg font-semibold">Normal</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Within expected range</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-sm font-medium mb-2">Volatility</h4>
                  <div className="flex items-center">
                    <div className="h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                      <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-lg font-semibold">Elevated</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Higher than 30-day avg</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-sm font-medium mb-2">Band Proximity</h4>
                  <div className="flex items-center">
                    <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <svg className="h-6 w-6 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-lg font-semibold">48%</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">From upper band</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Premium Metrics Tab */}
            <TabsContent value="premium">
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-sm font-medium mb-2">Premium Statistics</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Daily High</p>
                      <p className="text-lg font-mono font-semibold">$3.12</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Daily Low</p>
                      <p className="text-lg font-mono font-semibold">$1.98</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">30-Day Avg</p>
                      <p className="text-lg font-mono font-semibold">$2.54</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Std Deviation</p>
                      <p className="text-lg font-mono font-semibold">$0.42</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-sm font-medium mb-2">Premium Distribution</h4>
                  <div className="h-40">
                    {historyLoading ? (
                      <Skeleton className="h-full w-full" />
                    ) : (
                      <canvas id="premiumDistChart" ref={premiumDistChartRef}></canvas>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Asset Metrics Tab */}
            <TabsContent value="asset">
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">Asset Price History</h3>
                <div className={`bg-gray-50 dark:bg-gray-700 p-6 rounded-lg ${historyLoading ? 'h-[300px] flex items-center justify-center' : ''}`}>
                  {historyLoading ? (
                    <Skeleton className="h-[260px] w-full" />
                  ) : (
                    <canvas id="assetChart" height="300" ref={assetChartRef}></canvas>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-sm font-medium mb-2">Market Statistics</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Day Range</p>
                      <p className="text-lg font-mono font-semibold">4,275 - 4,298</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Volume</p>
                      <p className="text-lg font-mono font-semibold">1.45M</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Open Interest</p>
                      <p className="text-lg font-mono font-semibold">2.87M</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Implied Vol</p>
                      <p className="text-lg font-mono font-semibold">15.4%</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-sm font-medium mb-2">Price Action Heatmap</h4>
                  <div className="h-40">
                    {historyLoading ? (
                      <Skeleton className="h-full w-full" />
                    ) : (
                      <canvas id="heatmapChart" ref={heatmapChartRef}></canvas>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default DetailedMetrics;
