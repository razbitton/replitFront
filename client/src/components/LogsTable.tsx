import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTradingContext } from "@/contexts/TradingContext";
import { Skeleton } from "@/components/ui/skeleton";

const LogsTable = () => {
  const { 
    logs, 
    selectedLogLevel,
    setSelectedLogLevel,
    isLoading
  } = useTradingContext();

  // Filter logs based on selected log level
  const filteredLogs = selectedLogLevel === "All Levels" 
    ? logs 
    : logs.filter(log => log.level === selectedLogLevel);
  
  // Format timestamp to display only time
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString([], { 
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Style badge based on log level
  const getLogLevelBadgeStyle = (level: string) => {
    switch (level) {
      case "Info":
        return "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200";
      case "Warning":
        return "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200";
      case "Error":
        return "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200";
      case "Debug":
        return "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200";
    }
  };

  return (
    <Card>
      <CardHeader className="px-6 py-4 border-b flex-row flex items-center justify-between space-y-0">
        <CardTitle className="text-lg font-medium">System Logs</CardTitle>
        <div className="flex space-x-2">
          <Select
            value={selectedLogLevel}
            onValueChange={setSelectedLogLevel}
            disabled={isLoading}
          >
            <SelectTrigger className="w-[180px] text-sm">
              <SelectValue placeholder="All Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Levels">All Levels</SelectItem>
              <SelectItem value="Error">Error</SelectItem>
              <SelectItem value="Warning">Warning</SelectItem>
              <SelectItem value="Info">Info</SelectItem>
              <SelectItem value="Debug">Debug</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto max-h-64">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Skeleton className="h-4 w-full max-w-md" />
                      <Skeleton className="h-4 w-full max-w-md" />
                      <Skeleton className="h-4 w-full max-w-md" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    No logs found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.slice(0, 100).map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap font-mono">
                      {formatTimestamp(log.timestamp)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs ${getLogLevelBadgeStyle(
                          log.level
                        )}`}
                      >
                        {log.level}
                      </span>
                    </TableCell>
                    <TableCell>{log.message}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default LogsTable;
