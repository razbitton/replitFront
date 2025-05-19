import { useEffect, useState } from "react";
import BandDataCards from "@/components/BandDataCards";
import PositionsTable from "@/components/PositionsTable";
import OrdersTable from "@/components/OrdersTable";
import ServiceStatus from "@/components/ServiceStatus";
import LogsTable from "@/components/LogsTable";
import { useTradingContext } from "@/contexts/TradingContext";
import { getBandDataHistory, getQuoteHistory } from "@/lib/backendIntegration";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard = () => {
  const { isLoading } = useTradingContext();
  const [bandDataHistory, setBandDataHistory] = useState<any[]>([]);
  const [quoteHistory, setQuoteHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Fetch historical data for charts
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
    
    // Set up interval to refresh data every 2 minutes
    const interval = setInterval(fetchHistoricalData, 120000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-[160px] rounded-lg" />
            <Skeleton className="h-[160px] rounded-lg" />
            <Skeleton className="h-[160px] rounded-lg" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-[300px] rounded-lg" />
            <Skeleton className="h-[300px] rounded-lg" />
            <Skeleton className="h-[300px] rounded-lg" />
            <Skeleton className="h-[300px] rounded-lg" />
          </div>
        </div>
      ) : (
        <>
          {/* Band Data Cards */}
          <BandDataCards />
          
          {/* Tables Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Positions Table */}
            <PositionsTable />
            
            {/* Orders Table */}
            <OrdersTable />
            
            {/* Service Status */}
            <ServiceStatus />
            
            {/* Logs Table */}
            <LogsTable />
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
