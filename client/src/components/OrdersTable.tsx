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

const OrdersTable = () => {
  const { 
    orders, 
    accounts, 
    selectedAccount,
    setSelectedAccount,
    isLoading
  } = useTradingContext();

  const filteredOrders = selectedAccount === "All Accounts" 
    ? orders 
    : orders.filter((order) => {
        const account = accounts.find(a => a.id === order.accountId);
        return account?.name === selectedAccount;
      });

  const getAccountName = (accountId: number) => {
    const account = accounts.find(a => a.id === accountId);
    return account?.name || `Account ${accountId}`;
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  return (
    <Card>
      <CardHeader className="px-6 py-4 border-b flex-row flex items-center justify-between space-y-0">
        <CardTitle className="text-lg font-medium">Orders</CardTitle>
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
                <TableHead>Qty Ord</TableHead>
                <TableHead>Qty Lft</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Skeleton className="h-4 w-full max-w-md" />
                      <Skeleton className="h-4 w-full max-w-md" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No orders found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{getAccountName(order.accountId)}</TableCell>
                    <TableCell>{order.symbol}</TableCell>
                    <TableCell className="font-mono">{order.quantity}</TableCell>
                    <TableCell className="font-mono">{order.quantity}</TableCell>
                    <TableCell className="font-mono">
                      ${order.price.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="font-mono">{formatTime(order.createdAt)}</TableCell>
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

export default OrdersTable;
