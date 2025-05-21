import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTradingContext } from "@/contexts/TradingContext";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckIcon, WifiOffIcon, AlertTriangleIcon } from "lucide-react";
import { useEffect, useState } from "react";

const DISCONNECT_TIMEOUT = 60 * 1000; // 1 minute in milliseconds
const SIGNAL_DISCONNECT_TIMEOUT = 6 * 60 * 1000; // 6 minutes in milliseconds

interface MonitoredService {
  key: string; // Unique key for React iteration
  name: string;
  lastUpdateTimestamp: string | null;
}

interface DisplayServiceStatus extends MonitoredService {
  currentStatus: string;
}

// Define the services to monitor at the component level
// so it can be used by the skeleton loader as well.
// The `lastUpdateTimestamp` will be updated via useEffect dependencies.
const MONITORED_SERVICES_CONFIG = [
  { key: "vixData", name: "VIX Data" },
  { key: "assetData", name: "Asset Data" },
  { key: "quoteFeedData", name: "Quote Feed Data" },
  { key: "signalsData", name: "Signals Data" },
];

const ServiceStatus = () => {
  const {
    // serviceLogMessages, // Removed as it's unused
    lastVixUpdate,
    lastAssetUpdate,
    lastQuoteFeedUpdate,
    lastSignalUpdate,
    isLoading: contextIsLoading, // Renamed for clarity
  } = useTradingContext();

  // const [componentIsLoading, setComponentIsLoading] = useState(true); // Removed
  const [serviceStatuses, setServiceStatuses] = useState<DisplayServiceStatus[]>([]);

  useEffect(() => {
    // Define the services to monitor along with their specific timestamp sources
    // This is defined inside useEffect as it depends on props from context
    const monitoredServicesSetup: MonitoredService[] = MONITORED_SERVICES_CONFIG.map(service => ({
      ...service,
      // Dynamically assign the latest timestamp from context
      lastUpdateTimestamp: 
        service.key === "vixData" ? lastVixUpdate :
        service.key === "assetData" ? lastAssetUpdate :
        service.key === "quoteFeedData" ? lastQuoteFeedUpdate :
        service.key === "signalsData" ? lastSignalUpdate :
        null,
    }));

    const calculateAndUpdateStatuses = () => {
      const now = Date.now();
      const updatedStatuses = monitoredServicesSetup.map(service => {
        let currentStatus: string;

        if (contextIsLoading) {
          currentStatus = "Initializing";
        } else if (service.lastUpdateTimestamp) {
            const lastUpdateTime = new Date(service.lastUpdateTimestamp).getTime();
            const timeout = service.key === "signalsData" ? SIGNAL_DISCONNECT_TIMEOUT : DISCONNECT_TIMEOUT;
            currentStatus = (now - lastUpdateTime < timeout) ? "Connected" : "Disconnected";
        } else {
          currentStatus = "No Data"; // If context is not loading, but we have no timestamp
        }
        return { ...service, currentStatus };
      });
      setServiceStatuses(updatedStatuses);
    };

    // Calculate statuses immediately on mount or when dependencies change
    calculateAndUpdateStatuses();

    // Then set up interval for periodic updates
    const intervalId = setInterval(calculateAndUpdateStatuses, 1000); // Check every second

    return () => clearInterval(intervalId); // Cleanup interval
  }, [
    // serviceLogMessages, // Removed
    lastVixUpdate,
    lastAssetUpdate,
    lastQuoteFeedUpdate,
    lastSignalUpdate,
    contextIsLoading, // Changed from initialLoading and now a direct dependency
  ]);

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Connected":
        return "text-green-600 dark:text-green-300";
      case "Disconnected":
      case "Error":
      case "No Data":
        return "text-red-600 dark:text-red-300";
      case "Initializing":
      default:
        return "text-gray-600 dark:text-gray-300";
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case "Connected":
        return "bg-green-100 dark:bg-green-900";
      case "Disconnected":
      case "Error":
      case "No Data":
        return "bg-red-100 dark:bg-red-900";
      case "Initializing":
      default:
        return "bg-gray-100 dark:bg-gray-700";
    }
  };

  const getStatusIcon = (status: string) => {
    const iconClass = `h-5 w-5 ${getStatusColor(status)}`;
    if (status === "Connected") {
      return <CheckIcon className={iconClass} />;
    }
    if (status === "Disconnected" || status === "No Data" || status === "Error") {
      return <WifiOffIcon className={iconClass} />;
    }
    return <AlertTriangleIcon className={iconClass} />;
  };

  return (
    <Card>
      <CardHeader className="px-6 py-4 border-b">
        <CardTitle className="text-lg font-medium">Service Status</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {contextIsLoading ? ( // Show skeletons if context is loading
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(MONITORED_SERVICES_CONFIG.length)].map((_, i) => ( 
              <Skeleton key={i} className="h-[70px] rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {serviceStatuses.map((service) => (
              <div key={service.key} className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-sm">
                <div className={`flex-shrink-0 h-10 w-10 rounded-lg ${getStatusBgColor(service.currentStatus)} flex items-center justify-center`}>
                  {getStatusIcon(service.currentStatus)}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{service.name}</p>
                  <p className={`text-xs ${getStatusColor(service.currentStatus)}`}>{service.currentStatus}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate" title={service.lastUpdateTimestamp ? formatTime(service.lastUpdateTimestamp) : 'N/A'}>
                    Update: {formatTime(service.lastUpdateTimestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ServiceStatus;
