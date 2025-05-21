import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTradingContext } from "@/contexts/TradingContext";

const BandDataCards = () => {
  const { bandData, quoteData, globalSettings, isLoading } = useTradingContext();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      {/* Symbol Card (formerly Premium Card) */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Symbol</h3>
            <span className="text-gray-500 dark:text-gray-400">&mdash;</span>
          </div>
          <div className="font-mono text-3xl font-semibold">
            {isLoading || !globalSettings ? (
              <Skeleton className="h-9 w-32" />
            ) : (
              globalSettings.futureSymbol || "N/A"
            )}
          </div>
          <div className="text-gray-500 dark:text-gray-400 mt-1">
            Monitored Futures Symbol
          </div>
        </CardContent>
      </Card>

      {/* Price Card (formerly Upper Band Card) */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Price</h3>
            <span className="text-gray-500 dark:text-gray-400">&mdash;</span>
          </div>
          <div className="font-mono text-3xl font-semibold">
            {isLoading || !quoteData ? (
              <Skeleton className="h-9 w-24" />
            ) : (
              typeof quoteData.price === 'number' ? quoteData.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"
            )}
          </div>
          <div className="text-gray-500 dark:text-gray-400 mt-1">
            Current Asset Price
          </div>
        </CardContent>
      </Card>

      {/* Position Signal Card (formerly Lower Band Card) */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Position Signal</h3>
            <span className="text-gray-500 dark:text-gray-400">&mdash;</span>
          </div>
          <div className="font-mono text-3xl font-semibold">
            {isLoading ? (
              <Skeleton className="h-9 w-24" />
            ) : (
              "N/A"
            )}
          </div>
          <div className="text-gray-500 dark:text-gray-400 mt-1">
            Trading Signal Status
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BandDataCards;
