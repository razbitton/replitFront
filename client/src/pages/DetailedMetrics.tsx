import { useEffect, useState, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTradingContext } from "@/contexts/TradingContext";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpIcon } from "lucide-react";
import { Chart, registerables } from "chart.js";
import {
  preparePremiumMetricsData,
  prepareBollingerMetricsData,
  commonChartOptions
} from "@/lib/chartUtils";

// Register Chart.js components
Chart.register(...registerables);

const DetailedMetrics = () => {
  const { 
    bandData, 
    historicalBandData,
    quoteData, 
    globalSettings,
    dailyParameters,
    vixQuoteData,
    isLoading 
  } = useTradingContext();
  const [activeTab, setActiveTab] = useState("premiumMetrics");

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

  // Chart instances
  const premiumChartInstance = useRef<Chart | null>(null);
  const bollingerChartInstance = useRef<Chart | null>(null);

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
    if (isLoading || historicalBandData.length === 0) {
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
            const data = preparePremiumMetricsData(historicalBandData);
            premiumChartInstance.current = new Chart(ctx, {
              type: "line",
              data,
              options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                  mode: 'index' as const,
                  intersect: false,
                },
                plugins: {
                  zoom: {
                    pan: {
                      enabled: true,
                      mode: 'x',
                      modifierKey: 'ctrl',
                    },
                    zoom: {
                      wheel: {
                        enabled: true,
                      },
                      pinch: {
                        enabled: true,
                      },
                      mode: 'x',
                    }
                  }
                },
              }
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
            const data = prepareBollingerMetricsData(historicalBandData);

            bollingerChartInstance.current = new Chart(ctx, {
              type: "line",
              data,
              options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                  mode: 'index' as const,
                  intersect: false,
                },
                plugins: {
                  zoom: {
                    pan: {
                      enabled: true,
                      mode: 'x',
                      modifierKey: 'ctrl',
                    },
                    zoom: {
                      wheel: {
                        enabled: true,
                      },
                      pinch: {
                        enabled: true,
                      },
                      mode: 'x',
                    }
                  }
                },
              }
            });
          }
        }
      };

      initializeCharts();
    }, 0);

    // Cleanup chart instances on unmount
    return cleanup;
  }, [activeTab, isLoading, historicalBandData]);

  // Update charts when new band data arrives
  useEffect(() => {
    if (!bandData || isLoading) return;

    // Update Premium Metrics chart
    if (premiumChartInstance.current && activeTab === "premiumMetrics") {
      const chart = premiumChartInstance.current;

      // Add new data point
      if (chart.data.labels && chart.data.datasets && chart.data.datasets.length >= 3) {
        const timeLabel = new Date(bandData.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Add new label
        chart.data.labels.push(timeLabel);
        if (chart.data.labels.length > 100) {
          chart.data.labels.shift(); // Remove oldest if we have more than 100 points
        }

        // Add new data points
        chart.data.datasets[0].data.push(bandData.premium);
        chart.data.datasets[1].data.push(bandData.upperBand);
        chart.data.datasets[2].data.push(bandData.lowerBand);

        // Remove oldest data points if we have more than 100
        if (chart.data.datasets[0].data.length > 100) {
          chart.data.datasets[0].data.shift();
          chart.data.datasets[1].data.shift();
          chart.data.datasets[2].data.shift();
        }

        chart.update();
      }
    }

    // Update Bollinger Bands chart
    if (bollingerChartInstance.current && activeTab === "bollingerMetrics") {
      const chart = bollingerChartInstance.current;

      // Add new data point
      if (chart.data.labels && chart.data.datasets && chart.data.datasets.length >= 3) {
        const timeLabel = new Date(bandData.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Add new label
        chart.data.labels.push(timeLabel);
        if (chart.data.labels.length > 100) {
          chart.data.labels.shift(); // Remove oldest if we have more than 100 points
        }

        // Add new data points
        chart.data.datasets[0].data.push(bandData.m1Close);
        chart.data.datasets[1].data.push(bandData.bollingerUpperBand);
        chart.data.datasets[2].data.push(bandData.bollingerLowerBand);

        // Remove oldest data points if we have more than 100
        if (chart.data.datasets[0].data.length > 100) {
          chart.data.datasets[0].data.shift();
          chart.data.datasets[1].data.shift();
          chart.data.datasets[2].data.shift();
        }

        chart.update();
      }
    }
  }, [bandData, isLoading, activeTab]);

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

  // Determine if currently in trading window
  const inTradingWindow = useMemo(() => {
    if (!dailyParameters || !globalSettings || !dailyParameters.length) return false;

    // For simplicity, using the first day's parameters or a general setting
    // A more robust solution would find today's specific parameters
    const todayParams = dailyParameters[0]; // Or find based on current day
    const tradingStartStr = globalSettings.tradingStartTime; // e.g., "09:30"
    const tradingEndStr = globalSettings.globalEndTime;     // e.g., "16:00"

    if (!tradingStartStr || !tradingEndStr) return false;

    const now = new Date();
    const [startHours, startMinutes] = tradingStartStr.split(':').map(Number);
    const [endHours, endMinutes] = tradingEndStr.split(':').map(Number);

    const startTime = new Date(now);
    startTime.setHours(startHours, startMinutes, 0, 0);

    const endTime = new Date(now);
    endTime.setHours(endHours, endMinutes, 0, 0);

    return now >= startTime && now <= endTime;
  }, [dailyParameters, globalSettings]);

  const nextWindowTime = useMemo(() => {
    if (!globalSettings || !globalSettings.tradingStartTime) return "N/A";
    if (inTradingWindow) return "Currently Open";

    const now = new Date();
    const [startHours, startMinutes] = globalSettings.tradingStartTime.split(':').map(Number);

    const nextStartTime = new Date(now);
    nextStartTime.setHours(startHours, startMinutes, 0, 0);

    if (now > nextStartTime) { // If past today's start time, it means next window is tomorrow
      nextStartTime.setDate(nextStartTime.getDate() + 1);
    }
    return nextStartTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
  }, [globalSettings, inTradingWindow]);

  // Format price with commas
  const formatPrice = (price: number) => {
    return price.toLocaleString(undefined, {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4
    });
  };

  return (
    <div>
      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {/* Symbol Card */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm text-gray-500 dark:text-gray-400 font-semibold">Symbol</h3>
            <div className="text-2xl font-semibold mt-1">
              {isLoading || !globalSettings ? <Skeleton className="h-8 w-24" /> : globalSettings.futureSymbol || "N/A"}
            </div>
            <div className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Monitored Futures Symbol
            </div>
          </CardContent>
        </Card>

        {/* Asset Price Card */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm text-gray-500 dark:text-gray-400 font-semibold">Asset Price</h3>
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
            <h3 className="text-sm text-gray-500 dark:text-gray-400 font-semibold">VIX Price</h3>
            <div className="flex items-center mt-1">
              <div className="text-2xl font-semibold font-mono">
                {isLoading || !vixQuoteData || vixQuoteData.price === null ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  vixQuoteData.price.toFixed(2)
                )}
              </div>
              {!isLoading && vixQuoteData && vixQuoteData.change !== null && (
                <span className={`flex items-center ${vixQuoteData.change >= 0 ? 'text-green-500' : 'text-red-500'} ml-2 text-sm`}>
                  {vixQuoteData.change >= 0 ? (
                    <ArrowUpIcon className="w-4 h-4 mr-1" />
                  ) : (
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7-7-7"></path>
                    </svg>
                  )}
                  {Math.abs(vixQuoteData.change).toFixed(2)}%
                </span>
              )}
            </div>
            <div className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              CBOE Volatility Index {vixQuoteData?.timestamp ? `(${new Date(vixQuoteData.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})` : ''}
            </div>
          </CardContent>
        </Card>

        {/* Trading Window Card */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm text-gray-500 dark:text-gray-400 font-semibold">Trading Window</h3>
            <div className="text-2xl font-semibold mt-1">
              {isLoading || !globalSettings ? <Skeleton className="h-8 w-24" /> : inTradingWindow ? (
                <span className="text-green-500">In Window</span>
              ) : (
                <span className="text-red-500">Out of Window</span>
              )}
            </div>
            <div className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              {isLoading || !globalSettings ? <Skeleton className="h-4 w-32" /> : `Next window: ${nextWindowTime}`}
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
                <div className={`bg-gray-50 dark:bg-gray-700 p-6 rounded-lg ${isLoading ? 'h-[300px] flex items-center justify-center' : ''}`}>
                  {isLoading ? (
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
                <div className={`bg-gray-50 dark:bg-gray-700 p-6 rounded-lg ${isLoading ? 'h-[300px] flex items-center justify-center' : ''}`}>
                  {isLoading ? (
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