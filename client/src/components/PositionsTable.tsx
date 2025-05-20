import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
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

const PositionsTable = () => {
  const { 
    positions, 
    accounts, 
    selectedAccount,
    setSelectedAccount,
    isLoading
  } = useTradingContext();

  const filteredPositions = selectedAccount === "All Accounts" 
    ? positions 
    : positions.filter((position) => {
        const account = accounts.find(a => a.id === position.accountId);
        return account?.name === selectedAccount;
      });

  const getAccountName = (accountId: number) => {
    const account = accounts.find(a => a.id === accountId);
    return account?.name || `Account ${accountId}`;
  };

  return (
    <Card>
      <CardHeader className="px-6 py-4 border-b flex-row flex items-center justify-between space-y-0">
        <CardTitle className="text-lg font-medium">Positions</CardTitle>
        <div className="flex space-x-2">
          <Select
            value={selectedAccount}
            onValueChange={setSelectedAccount}
            disabled={isLoading}
          >
            <SelectTrigger className="w-[180px] text-sm">
              <SelectValue placeholder="All Accounts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Accounts">All Accounts</SelectItem>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.name}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Skeleton className="h-4 w-full max-w-md" />
                      <Skeleton className="h-4 w-full max-w-md" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredPositions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No positions found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPositions.map((position) => (
                  <TableRow key={position.id}>
                    <TableCell>{getAccountName(position.accountId)}</TableCell>
                    <TableCell>{position.symbol}</TableCell>
                    <TableCell className="font-mono">{position.quantity}</TableCell>
                    <TableCell className="font-mono">
                      ${position.avgPrice.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="font-mono">
                      {new Date().toLocaleTimeString()}
                    </TableCell>
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

export default PositionsTable;