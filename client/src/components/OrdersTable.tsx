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

  // Filter orders based on selected account
  const filteredOrders = selectedAccount === "All Accounts" 
    ? orders 
    : orders.filter((order) => {
        const account = accounts.find(a => a.id === order.accountId);
        return account?.name === selectedAccount;
      });

  // Get account name from accountId
  const getAccountName = (accountId: number) => {
    const account = accounts.find(a => a.id === accountId);
    return account?.name || `Account ${accountId}`;
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
                <TableHead>Account</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead>Side</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
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
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                          order.side === "Buy"
                            ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                            : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                        }`}
                      >
                        {order.side}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono">{order.quantity}</TableCell>
                    <TableCell className="font-mono">
                      {order.price.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                          order.status === "Working"
                            ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                            : order.status === "Pending"
                            ? "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                            : "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
                        }`}
                      >
                        {order.status}
                      </span>
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

export default OrdersTable;
