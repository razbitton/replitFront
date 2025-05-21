import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTradingContext, Order as ContextOrderType, Account as ContextAccountType, Position as ContextPositionType } from "@/contexts/TradingContext";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BadgeCheck, Plus } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Import the components from the dashboard
import PositionsTable from "@/components/PositionsTable";
import OrdersTable from "@/components/OrdersTable";

const ALL_ACCOUNTS_SENTINEL = "__ALL_ACCOUNTS__"; // Define a sentinel value

// Order form type
interface ManualOrderFormState {
  account: string; // Can be an accountNumber or ALL_ACCOUNTS_SENTINEL
  symbol: string;
  side: "Buy" | "Sell";
  quantity: string; // Store as string for input, parse before use
  price: string;    // Store as string for input, parse before use
  type: ContextOrderType["type"];
  timeInForce: "Day" | "GTC" | "IOC";
  // status: ContextOrderType["status"]; // Default to "Working" when submitting
}

// Keep this type for what placeOrder expects, 
// explicitly allowing string for quantity for "All" case.
type PlaceOrderPayload = Omit<ContextOrderType, "id" | "timestamp" | "quantityLeft" | "createdAt" | "quantity"> & {
  quantity: string | number | null;
};

const ManualOrders = () => {
  const { 
    accounts, 
    orders, 
    positions, 
    placeOrder, 
    updateOrder, 
    cancelOrder, 
    isLoading: contextIsLoading,
    quoteData,
    globalSettings
  } = useTradingContext();

  // Form state - Default account to ALL_ACCOUNTS_SENTINEL
  const [orderForm, setOrderForm] = useState<ManualOrderFormState>({
    account: ALL_ACCOUNTS_SENTINEL, 
    symbol: "ES2023", // Placeholder, will be updated by useEffect
    side: "Buy",
    quantity: "1",
    price: "0", // Default price to "0"
    type: "Limit",
    timeInForce: "Day",
    // status: "Working", // Not part of form state, added when submitting
  });

  const [isSymbolInitializedFromGlobal, setIsSymbolInitializedFromGlobal] = useState(false);

  // Local loading state for this page, you might want to refine this
  const [isPageLoading, setIsPageLoading] = useState(true); 

  // Determine the account filter to pass to child tables
  const selectedAccountForFilter = useMemo(() => {
    if (orderForm.account === ALL_ACCOUNTS_SENTINEL) {
      return null; // Signal to show all accounts in child tables
    }
    return orderForm.account; // Pass the specific accountNumber
  }, [orderForm.account]);

  // Edit order dialog state
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ContextOrderType | null>(null);

  // Effect to initialize symbol from globalSettings once
  useEffect(() => {
    if (globalSettings?.futureSymbol && !isSymbolInitializedFromGlobal) {
      setOrderForm(prev => ({
        ...prev,
        symbol: globalSettings.futureSymbol,
      }));
      setIsSymbolInitializedFromGlobal(true);
    }
    // Potentially set isPageLoading to false once critical data like globalSettings is loaded
    if (globalSettings) {
        // setIsPageLoading(false); // Example: consider contextIsLoading as well
    }
  }, [globalSettings, isSymbolInitializedFromGlobal]);

  // Combine context loading state with page-specific loading if needed
  useEffect(() => {
    setIsPageLoading(contextIsLoading);
  }, [contextIsLoading]);

  // Handle form changes
  const handleFormChange = (field: keyof ManualOrderFormState, value: any) => {
    setOrderForm(prev => ({ ...prev, [field]: value }));
  };

  // Handle order placement - Modified for "All Accounts" logic
  const handlePlaceOrder = async (side: "Buy" | "Sell") => {
    // const quantityAsNumber = parseInt(orderForm.quantity); // Old parsing
    const priceAsNumber = parseFloat(orderForm.price);

    let quantityToSend: string | number | null;

    if (orderForm.quantity.toLowerCase() === "all") {
      quantityToSend = "All"; // Use the string "All"
    } else {
      const parsedQuantity = parseInt(orderForm.quantity);
      if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
        console.error("Invalid quantity. Must be a positive number or 'All'.");
        // Consider user feedback, e.g., toast
        return;
      }
      quantityToSend = parsedQuantity;
    }

    // Price validation remains the same
    if (orderForm.type !== "Market" && isNaN(priceAsNumber)) {
      console.error("Invalid price.");
      // Consider user feedback
      return;
    }

    const commonOrderDetails: Omit<PlaceOrderPayload, "account" | "quantity"> & { quantity: string | number | null } = {
      symbol: orderForm.symbol,
      side: side,
      quantity: quantityToSend, // Use the processed quantity
      price: orderForm.type === "Market" ? null : priceAsNumber,
      type: orderForm.type,
      status: "Working",
    };

    try {
      if (orderForm.account === ALL_ACCOUNTS_SENTINEL) {
        // --- Place order for ALL ACCOUNTS ---
        if (accounts.length === 0) {
          console.error("No accounts available to place orders for.");
          // Consider user feedback
          return;
        }
        console.log(`Placing order for ALL ${accounts.length} accounts:`, commonOrderDetails);
        // You might want to add a confirmation step here for the user
        // For example, a dialog saying "This will place X orders. Continue?"

        for (const acc of accounts) {
          if (acc.accountNumber) { // Ensure account has a valid identifier
            const individualPayload: PlaceOrderPayload = {
              ...commonOrderDetails,
              account: acc.accountNumber,
            };
            try {
              await placeOrder(individualPayload as any); // Casting as context might have slightly different Order type
              console.log(`Order placed for account: ${acc.name} (${acc.accountNumber})`);
              // Optionally, provide feedback per order, or a summary at the end
            } catch (error) {
              console.error(`Failed to place order for account: ${acc.name} (${acc.accountNumber})`, error);
              // Collect errors and show a summary to the user?
            }
          }
        }
        // Consider a summary toast: "Attempted to place orders for X accounts. Y succeeded, Z failed."
      } else {
        // --- Place order for a SINGLE SELECTED ACCOUNT ---
        const currentAccount = orderForm.account;
        if (!currentAccount) {
          console.error("No account selected for placing order.");
          return;
        }
        const singlePayload: PlaceOrderPayload = {
          ...commonOrderDetails,
          account: currentAccount,
        };
        await placeOrder(singlePayload as any);
        console.log(`Order placed for account: ${currentAccount}`);
      }

      // Reset quantity after successful order placement(s)
      setOrderForm(prev => ({ ...prev, quantity: "1" }));

    } catch (error) {
      // This catch block will now primarily catch errors from the single order placement path
      // or if an error occurs outside the loop in the all accounts path before any order is sent.
      console.error("Failed to place order(s):", error);
      // General error feedback to user
    }
  };

  // Edit an order
  const handleEditOrder = (order: ContextOrderType) => {
    setEditingOrder(order);
    setShowEditDialog(true);
  };

  // Save edited order
  const handleSaveEditedOrder = async () => {
    if (!editingOrder) return;
    
    try {
      // Assuming updateOrder expects a numeric ID based on prior linter errors. This is a mismatch with Order.id being string.
      // This needs to be definitively resolved by checking TradingContext.updateOrder signature.
      // For now, attempting parseInt as a workaround for the linter hint.
      await updateOrder(parseInt(editingOrder.id), editingOrder); 
      setShowEditDialog(false);
    } catch (error) {
      console.error("Failed to update order:", error);
    }
  };

  // Cancel an order
  const handleCancelOrder = async (orderId: string) => { // Changed to accept string ID
    try {
      // Assuming cancelOrder also expects a numeric ID based on prior linter hints.
      await cancelOrder(parseInt(orderId));
    } catch (error) {
      console.error("Failed to cancel order:", error);
    }
  };

  // Get account name from account STRING IDENTIFIER (accountNumber)
  const getAccountName = (accountIdentifier: string | undefined) => {
    if (!accountIdentifier) return 'N/A';
    const account = accounts.find(a => a.accountNumber === accountIdentifier);
    return account?.name || `Acc: ${accountIdentifier.substring(0,6)}...`; // Shortened fallback
  };

  // Style for order status badges
  const getOrderStatusBadgeStyle = (status: ContextOrderType['status']) => {
    switch (status) {
      case "Working":
        return "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200";
      case "Filled":
        return "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200";
      case "Cancelled":
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200";
      case "Rejected":
        return "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"; // Or orange
      default:
        return "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"; // Fallback for any unexpected status
    }
  };

  // Calculate counts and names for Positions Table header
  const accountsWithManualPositionsCount = useMemo(() => {
    const uniqueAccountNumbers = new Set(positions.map(pos => pos.accountNumber));
    return uniqueAccountNumbers.size;
  }, [positions]);

  const accountsWithoutManualPositionsNames = useMemo(() => {
    const accountNumbersWithPositions = new Set(positions.map(pos => pos.accountNumber));
    return accounts
      .filter(acc => !accountNumbersWithPositions.has(acc.accountNumber || ""))
      .map(acc => acc.name)
      .join(", ");
  }, [positions, accounts]);

  // Calculate counts and names for Orders Table header
  const accountsWithManualOrdersCount = useMemo(() => {
    const uniqueAccountIdentifiers = new Set(orders.map(order => order.account));
    return uniqueAccountIdentifiers.size;
  }, [orders]);

  const accountsWithoutManualOrdersNames = useMemo(() => {
    const accountIdentifiersWithOrders = new Set(orders.map(order => order.account));
    return accounts
      .filter(acc => !accountIdentifiersWithOrders.has(acc.accountNumber || ""))
      .map(acc => acc.name)
      .join(", ");
  }, [orders, accounts]);

  if (isPageLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-[400px] rounded-lg" />
        <Skeleton className="h-[400px] rounded-lg" />
        <Skeleton className="h-[400px] rounded-lg lg:col-span-2" />
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6"> {/* Added mb-6 for spacing before full-width orders table */}
        {/* Order Placement Form */}
        <Card>
          <CardHeader className="px-6 py-4 border-b">
            <CardTitle className="text-lg font-medium">Place New Order</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="account">Account</Label>
                  <Select
                    value={orderForm.account} 
                    onValueChange={(value) => handleFormChange("account", value)}
                  >
                    <SelectTrigger id="account" className="mt-1">
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_ACCOUNTS_SENTINEL}>All Accounts</SelectItem>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.accountNumber || ""}>
                          {account.name} ({account.accountNumber})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="symbol">Symbol</Label>
                  <Input
                    id="symbol"
                    value={orderForm.symbol}
                    onChange={(e) => handleFormChange("symbol", e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="text" // Changed to text to allow "All"
                    min="1" // Min attribute might not be strictly enforced for "text" but good for semantics
                    value={orderForm.quantity}
                    onChange={(e) => handleFormChange("quantity", e.target.value)}
                    className="mt-1"
                  />
                  <div className="w-full flex justify-center mt-1"> {/* Wrapper div for centering the button content itself */}
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="p-0 h-auto text-xs underline font-normal hover:no-underline hover:text-primary/80 dark:hover:text-primary/70"
                      onClick={() => handleFormChange("quantity", "All")}
                    >
                      All
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    value={orderForm.price}
                    onChange={(e) => handleFormChange("price", e.target.value)}
                    disabled={orderForm.type === "Market"}
                  />
                  {quoteData && (quoteData.bid || quoteData.ask) && (
                    <div className="text-xs mt-1 flex justify-center space-x-4 items-center">
                      {quoteData.bid !== null && quoteData.bid !== undefined && (
                        <div className="flex items-center">
                          <span className="text-muted-foreground mr-1">Bid:</span>
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="p-0 h-auto underline font-normal hover:no-underline hover:text-primary/80 dark:hover:text-primary/70"
                            onClick={() => handleFormChange("price", String(quoteData.bid))}
                          >
                            {quoteData.bid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </Button>
                        </div>
                      )}
                      {quoteData.ask !== null && quoteData.ask !== undefined && (
                        <div className="flex items-center">
                          <span className="text-muted-foreground mr-1">Ask:</span>
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="p-0 h-auto underline font-normal hover:no-underline hover:text-primary/80 dark:hover:text-primary/70"
                            onClick={() => handleFormChange("price", String(quoteData.ask))}
                          >
                            {quoteData.ask.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                </div>
                
              {/* Order Type Field - Commented out
                <div>
                  <Label htmlFor="orderType">Order Type</Label>
                  <Select
                  value={orderForm.type}
                  onValueChange={(value) => handleFormChange("type", value as ContextOrderType["type"])}
                  >
                    <SelectTrigger id="orderType" className="mt-1">
                      <SelectValue placeholder="Select order type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Limit">Limit</SelectItem>
                      <SelectItem value="Market">Market</SelectItem>
                      <SelectItem value="Stop">Stop</SelectItem>
                      <SelectItem value="Stop Limit">Stop Limit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              */}
                
              {/* Time in Force Field - Commented out
                <div>
                  <Label htmlFor="timeInForce">Time in Force</Label>
                  <Select
                    value={orderForm.timeInForce}
                  onValueChange={(value) => handleFormChange("timeInForce", value as ManualOrderFormState["timeInForce"])}
                  >
                    <SelectTrigger id="timeInForce" className="mt-1">
                      <SelectValue placeholder="Select time in force" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Day">Day</SelectItem>
                      <SelectItem value="GTC">GTC (Good Till Cancel)</SelectItem>
                      <SelectItem value="IOC">IOC (Immediate or Cancel)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              */}
              
              <div className="flex justify-end space-x-3 mt-6"> {/* Added mt-6 for spacing */}
                <Button 
                  type="button" 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handlePlaceOrder("Buy")}
                >
                  Buy
                </Button>
                <Button 
                  type="button" 
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => handlePlaceOrder("Sell")}
                >
                  Sell
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        
        {/* Positions Table - Now using the imported component */}
        {/* It stays in the 2-column layout, but now respects the filter from the form */}
        {/* <Card> */}
          <PositionsTable externallyFilteredAccount={selectedAccountForFilter} />
        {/* </Card> */}       
            </div>
      
      {/* Orders Table - Now using the imported component, placed outside the 2-col grid to span full width */}
      {/* Card wrapper is removed for OrdersTable to allow it to be styled directly or via its own Card if needed for consistency */}
      <div className="mt-6"> {/* Added mt-6 for spacing */}
        <OrdersTable externallyFilteredAccount={selectedAccountForFilter} />
      </div>
      
      {/* Edit Order Dialog */}
      {editingOrder && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Order</DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="col-span-2">
                <Label htmlFor="edit-account">Account</Label>
                <Select
                  value={editingOrder.account}
                  onValueChange={(value) => 
                    setEditingOrder((prev) => 
                      prev ? { ...prev, account: value } : null
                    )
                  }
                >
                  <SelectTrigger id="edit-account">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.accountNumber || ""}>
                        {account.name} ({account.accountNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="edit-symbol">Symbol</Label>
                <Input
                  id="edit-symbol"
                  value={editingOrder.symbol}
                  onChange={(e) => 
                    setEditingOrder((prev) => 
                      prev ? { ...prev, symbol: e.target.value } : null
                    )
                  }
                />
              </div>
              
              <div>
                <Label htmlFor="edit-side">Side</Label>
                <Select
                  value={editingOrder.side}
                  onValueChange={(value) => 
                    setEditingOrder((prev) => 
                      prev ? { ...prev, side: value as "Buy" | "Sell" } : null
                    )
                  }
                >
                  <SelectTrigger id="edit-side">
                    <SelectValue placeholder="Select side" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Buy">Buy</SelectItem>
                    <SelectItem value="Sell">Sell</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="edit-quantity">Quantity</Label>
                <Input
                  id="edit-quantity"
                  type="number"
                  min="1"
                  value={editingOrder.quantity?.toString() ?? ""}
                  onChange={(e) => 
                    setEditingOrder((prev) => 
                      prev ? { ...prev, quantity: parseInt(e.target.value) || null } : null
                    )
                  }
                />
              </div>
              
              <div>
                <Label htmlFor="edit-price">Price</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.25"
                  value={editingOrder.price?.toString() ?? ""}
                  onChange={(e) => 
                    setEditingOrder((prev) => 
                      prev ? { ...prev, price: parseFloat(e.target.value) || null } : null
                    )
                  }
                />
              </div>
            </div>
            
            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEditedOrder}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ManualOrders;
