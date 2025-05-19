import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTradingContext } from "@/contexts/TradingContext";
import { ArrowUpIcon } from "lucide-react";

const BandDataCards = () => {
  const { bandData, quoteData, isLoading } = useTradingContext();

  // Calculate premium percent change (simplified since we don't have historical data in the context)
  // In a real app, we'd compare with historical data
  const premiumChange = 0.82; // Placeholder value matching the design
  const isPremiumIncreasing = premiumChange > 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      {/* Premium Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Premium</h3>
            {isLoading ? (
              <Skeleton className="h-5 w-16" />
            ) : (
              <span className="flex items-center text-green-500">
                <ArrowUpIcon className="w-5 h-5 mr-1" />
                {premiumChange}%
              </span>
            )}
          </div>
          <div className="font-mono text-3xl font-semibold">
            {isLoading ? (
              <Skeleton className="h-9 w-24" />
            ) : (
              `$${bandData?.premium.toFixed(2) || "0.00"}`
            )}
          </div>
          <div className="text-gray-500 dark:text-gray-400 mt-1">
            Current premium value
          </div>
        </CardContent>
      </Card>

      {/* Upper Band Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Upper Band</h3>
            <span className="text-gray-500 dark:text-gray-400">&mdash;</span>
          </div>
          <div className="font-mono text-3xl font-semibold">
            {isLoading ? (
              <Skeleton className="h-9 w-24" />
            ) : (
              `$${bandData?.upperBand.toFixed(2) || "0.00"}`
            )}
          </div>
          <div className="text-gray-500 dark:text-gray-400 mt-1">
            Current upper band limit
          </div>
        </CardContent>
      </Card>

      {/* Lower Band Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Lower Band</h3>
            <span className="text-gray-500 dark:text-gray-400">&mdash;</span>
          </div>
          <div className="font-mono text-3xl font-semibold">
            {isLoading ? (
              <Skeleton className="h-9 w-24" />
            ) : (
              `$${bandData?.lowerBand.toFixed(2) || "0.00"}`
            )}
          </div>
          <div className="text-gray-500 dark:text-gray-400 mt-1">
            Current lower band limit
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BandDataCards;
