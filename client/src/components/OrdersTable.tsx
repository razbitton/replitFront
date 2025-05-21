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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMemo } from "react";

interface OrdersTableProps {
  externallyFilteredAccount?: string | null; // accountNumber or null for all
}

const OrdersTable: React.FC<OrdersTableProps> = ({ externallyFilteredAccount }) => {
  const { 
    orders, 
    accounts, 
    selectedAccount: contextSelectedAccount, // Renamed
    setSelectedAccount: contextSetSelectedAccount, // Renamed
    isLoading
  } = useTradingContext();

  // Determine the active filter: external prop takes precedence
  const activeFilterAccount = externallyFilteredAccount !== undefined 
    ? externallyFilteredAccount 
    : contextSelectedAccount;

  // Similar to PositionsTable, derive the value for the dropdown
  const selectedAccountForDropdown = useMemo(() => {
    if (externallyFilteredAccount === null) return "All Accounts";
    if (externallyFilteredAccount) {
      const acc = accounts.find(a => a.accountNumber === externallyFilteredAccount);
      return acc?.name || "All Accounts";
    }
    return contextSelectedAccount;
  }, [externallyFilteredAccount, accounts, contextSelectedAccount]);

  const filteredOrders = useMemo(() => {
    if (activeFilterAccount === "All Accounts" || activeFilterAccount === null) {
      return orders;
    }
    // If activeFilterAccount is an account name (from context) or accountNumber (from prop)
    return orders.filter((order) => {
      if (externallyFilteredAccount !== undefined) { // External filter is by accountNumber
        return order.account === activeFilterAccount;
      } 
      // Internal filter is by accountName. We need to find the account number for the given name.
      const accountForFilter = accounts.find(acc => acc.name === activeFilterAccount);
      return order.account === accountForFilter?.accountNumber;
    });
  }, [orders, accounts, activeFilterAccount, externallyFilteredAccount]);

  const getAccountName = (orderAccountIdentifier: string) => {
    const account = accounts.find(acc => acc.accountNumber === orderAccountIdentifier);
    return account?.name || 'N/A';
  };

  const accountsWithOrdersCount = useMemo(() => {
    // Count based on the actually filtered orders
    const uniqueAccountIdentifiersInFiltered = new Set(filteredOrders.map(order => order.account));
    return uniqueAccountIdentifiersInFiltered.size;
  }, [filteredOrders]);

  // Total accounts to display in (X/Y) depends on whether an external filter is active
  const totalAccountsForDisplay = useMemo(() => {
    if (externallyFilteredAccount && externallyFilteredAccount !== "All Accounts" && externallyFilteredAccount !== null) {
      // If filtered to a single account externally, Y should be 1
      return 1;
    }
    return accounts.length; // Otherwise, it's all accounts in the system
  }, [externallyFilteredAccount, accounts.length]);

  const accountsWithoutOrdersNames = useMemo(() => {
    const accountIdentifiersWithOrdersInFiltered = new Set(filteredOrders.map(order => order.account));
    
    let relevantAccounts = accounts;
    if (externallyFilteredAccount && externallyFilteredAccount !== null && externallyFilteredAccount !== "All Accounts") {
      relevantAccounts = accounts.filter(acc => acc.accountNumber === externallyFilteredAccount);
    }
    
    return relevantAccounts
      .filter(acc => !accountIdentifiersWithOrdersInFiltered.has(acc.accountNumber || ""))
      .map(acc => acc.name)
      .join(", ");
  }, [filteredOrders, accounts, externallyFilteredAccount]);

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
        <div className="flex items-center">
          <CardTitle className="text-lg font-medium">Orders</CardTitle>
          {(totalAccountsForDisplay > 0 || externallyFilteredAccount) && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="ml-2 text-sm font-normal text-gray-500 cursor-default">
                    ({accountsWithOrdersCount}/{totalAccountsForDisplay})
                  </span>
                </TooltipTrigger>
                {accountsWithoutOrdersNames && totalAccountsForDisplay > 1 && (
                  <TooltipContent>
                    <p>Accounts without orders: {accountsWithoutOrdersNames}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {externallyFilteredAccount === undefined && (
          <div className="flex space-x-2">
            <Select
              value={selectedAccountForDropdown}
              onValueChange={contextSetSelectedAccount}
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
        )}
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
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
                    <TableCell>{getAccountName(order.account)}</TableCell>
                    <TableCell>{order.symbol}</TableCell>
                    <TableCell className="font-mono">
                      {typeof order.quantity === 'number' ? order.quantity.toLocaleString() : 'N/A'}
                    </TableCell>
                    <TableCell className="font-mono">
                      {typeof order.quantityLeft === 'number' ? order.quantityLeft.toLocaleString() : 'N/A'}
                    </TableCell>
                    <TableCell className="font-mono">
                      {typeof order.price === 'number'
                        ? `$${order.price.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="font-mono">{formatTime(order.timestamp)}</TableCell>
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
