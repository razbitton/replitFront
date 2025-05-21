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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMemo } from "react";

interface PositionsTableProps {
  externallyFilteredAccount?: string | null; // accountNumber or null for all
}

const PositionsTable: React.FC<PositionsTableProps> = ({ externallyFilteredAccount }) => {
  const { 
    positions, 
    accounts, 
    selectedAccount: contextSelectedAccount, // Renamed to avoid conflict
    setSelectedAccount: contextSetSelectedAccount, // Renamed
    isLoading
  } = useTradingContext();

  // Determine the active filter: external prop takes precedence
  const activeFilterAccount = externallyFilteredAccount !== undefined 
    ? externallyFilteredAccount 
    : contextSelectedAccount;
  
  // If external filter is active, the local select should effectively be "All" or the specific account.
  // However, we filter directly by `activeFilterAccount`'s accountNumber.
  // For context's selectedAccount (used by dropdown), it expects account *name*.
  // We need to find the account name if externallyFilteredAccount is an accountNumber.
  const selectedAccountForDropdown = useMemo(() => {
    if (externallyFilteredAccount === null) return "All Accounts";
    if (externallyFilteredAccount) {
      const acc = accounts.find(a => a.accountNumber === externallyFilteredAccount);
      return acc?.name || "All Accounts"; // Fallback if not found, though unlikely
    }
    return contextSelectedAccount;
  }, [externallyFilteredAccount, accounts, contextSelectedAccount]);


  const filteredPositions = useMemo(() => {
    if (activeFilterAccount === "All Accounts" || activeFilterAccount === null) {
      return positions;
    }
    // If activeFilterAccount is an account name (from context) or accountNumber (from prop)
    return positions.filter((position) => {
      if (externallyFilteredAccount !== undefined) { // External filter is by accountNumber
        return position.accountNumber === activeFilterAccount;
      }
      // Internal filter is by accountName (as contextSelectedAccount stores names)
      return position.accountName === activeFilterAccount; 
    });
  }, [positions, activeFilterAccount, externallyFilteredAccount]);

  const accountsWithPositionsCount = useMemo(() => {
    // Count based on the actually filtered positions
    const uniqueAccountNumbersInFiltered = new Set(filteredPositions.map(pos => pos.accountNumber));
    return uniqueAccountNumbersInFiltered.size;
  }, [filteredPositions]);

  // Total accounts to display in (X/Y) depends on whether an external filter is active
  const totalAccountsForDisplay = useMemo(() => {
    if (externallyFilteredAccount && externallyFilteredAccount !== "All Accounts" && externallyFilteredAccount !== null) {
      // If filtered to a single account externally, Y should be 1
      return 1;
    }
    return accounts.length; // Otherwise, it's all accounts in the system
  }, [externallyFilteredAccount, accounts.length]);

  const accountsWithoutPositionsNames = useMemo(() => {
    // This tooltip might be less relevant or need adjustment if externally filtered to one account.
    // For now, it will show accounts that don't have positions *within the current filter context*.
    const accountNumbersWithPositionsInFiltered = new Set(filteredPositions.map(pos => pos.accountNumber));
    
    let relevantAccounts = accounts;
    if (externallyFilteredAccount && externallyFilteredAccount !== null && externallyFilteredAccount !== "All Accounts") {
      relevantAccounts = accounts.filter(acc => acc.accountNumber === externallyFilteredAccount);
    }

    return relevantAccounts
      .filter(acc => !accountNumbersWithPositionsInFiltered.has(acc.accountNumber || ""))
      .map(acc => acc.name)
      .join(", ");
  }, [filteredPositions, accounts, externallyFilteredAccount]);

  return (
    <Card>
      <CardHeader className="px-6 py-4 border-b flex-row flex items-center justify-between space-y-0">
        <div className="flex items-center">
          <CardTitle className="text-lg font-medium">Positions</CardTitle>
          {/* Adjust (X/Y) display based on external filter */}
          {(totalAccountsForDisplay > 0 || externallyFilteredAccount) && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="ml-2 text-sm font-normal text-gray-500 cursor-default">
                    ({accountsWithPositionsCount}/{totalAccountsForDisplay})
                  </span>
                </TooltipTrigger>
                {accountsWithoutPositionsNames && totalAccountsForDisplay > 1 && ( // Only show tooltip if more than one account is in scope
                  <TooltipContent>
                    <p>Accounts without positions: {accountsWithoutPositionsNames}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {/* Hide Select dropdown if externallyFilteredAccount prop is in use */}
        {externallyFilteredAccount === undefined && (
          <div className="flex space-x-2">
            <Select
              value={selectedAccountForDropdown} // Use the derived value for dropdown
              onValueChange={contextSetSelectedAccount} // Context setter for internal changes
              disabled={isLoading}
            >
              <SelectTrigger className="w-[180px] text-sm">
                <SelectValue placeholder="All Accounts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Accounts">All Accounts</SelectItem>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.name}> {/* Ensure value is account name */}
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
                    <TableCell>{position.accountName || 'N/A'}</TableCell>
                    <TableCell>{position.symbol}</TableCell>
                    <TableCell className="font-mono">{position.quantity}</TableCell>
                    <TableCell className="font-mono">
                      {typeof position.avgPrice === 'number' 
                        ? `$${position.avgPrice.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="font-mono">
                      {position.timestamp ? new Date(position.timestamp).toLocaleTimeString() : 'N/A'}
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