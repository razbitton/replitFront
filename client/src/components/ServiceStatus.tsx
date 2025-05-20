import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTradingContext } from "@/contexts/TradingContext";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckIcon } from "lucide-react";

const ServiceStatus = () => {
  const { serviceStatus, isLoading } = useTradingContext();

  // Get icon color based on status
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Connected":
      case "Active":
        return "text-green-600 dark:text-green-300";
      case "Warning":
        return "text-yellow-600 dark:text-yellow-300";
      case "Disconnected":
      case "Error":
        return "text-red-600 dark:text-red-300";
      default:
        return "text-gray-600 dark:text-gray-300";
    }
  };

  // Get background color based on status
  const getStatusBgColor = (status: string) => {
    switch (status) {
      case "Connected":
      case "Active":
        return "bg-green-100 dark:bg-green-900";
      case "Warning":
        return "bg-yellow-100 dark:bg-yellow-900";
      case "Disconnected":
      case "Error":
        return "bg-red-100 dark:bg-red-900";
      default:
        return "bg-gray-100 dark:bg-gray-700";
    }
  };

  // Get icon based on status
  const getStatusIcon = (status: string) => {
    if (status === "Connected" || status === "Active") {
      return (
        <CheckIcon className={`h-6 w-6 ${getStatusColor(status)}`} />
      );
    } else if (status === "Warning") {
      return (
        <svg className={`h-6 w-6 ${getStatusColor(status)}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
        </svg>
      );
    } else {
      return (
        <svg className={`h-6 w-6 ${getStatusColor(status)}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      );
    }
  };

  return (
    <Card>
      <CardHeader className="px-6 py-4 border-b">
        <CardTitle className="text-lg font-medium">Service Status</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-[76px] rounded-lg" />
            <Skeleton className="h-[76px] rounded-lg" />
            <Skeleton className="h-[76px] rounded-lg" />
            <Skeleton className="h-[76px] rounded-lg" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {serviceStatus.map((service) => (
              <div key={service.id} className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className={`flex-shrink-0 h-10 w-10 rounded-lg ${getStatusBgColor(service.status)} flex items-center justify-center`}>
                  {getStatusIcon(service.status)}
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium">{service.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{service.status}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {new Date(service.updatedAt).toLocaleString()}
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
