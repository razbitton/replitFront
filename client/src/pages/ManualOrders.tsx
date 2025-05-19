import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTradingContext } from "@/contexts/TradingContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Order } from "@/contexts/TradingContext";
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

// Order form type (excluding id and createdAt which will be set by the server)
type NewOrder = Omit<Order, "id" | "createdAt">;

const ManualOrders = () => {
  const { 
    accounts, 
    orders, 
    positions, 
    placeOrder, 
    updateOrder, 
    cancelOrder, 
    isLoading, 
    quoteData,
  } = useTradingContext();

  // Form state
  const [orderForm, setOrderForm] = useState<NewOrder>({
    accountId: 0,
    symbol: "ES2023",
    side: "Buy",
    quantity: 1,
    price: quoteData?.price || 4287.25,
    orderType: "Limit",
    timeInForce: "Day",
    status: "Working",
  });

  // Edit order dialog state
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  // Update form when quote data changes
  // This will update the default price field with latest market price
  useState(() => {
    if (quoteData) {
      setOrderForm(prev => ({
        ...prev,
        price: quoteData.price
      }));
    }
  });

  // Handle form changes
  const handleFormChange = (field: keyof NewOrder, value: any) => {
    setOrderForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle order placement
  const handlePlaceOrder = async (side: "Buy" | "Sell") => {
    try {
      // Ensure we have a valid account selected
      if (orderForm.accountId === 0 && accounts.length > 0) {
        handleFormChange("accountId", accounts[0].id);
      }

      await placeOrder({
        ...orderForm,
        side
      });

      // Reset quantity after order placement
      setOrderForm(prev => ({
        ...prev,
        quantity: 1
      }));
    } catch (error) {
      console.error("Failed to place order:", error);
    }
  };

  // Edit an order
  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    setShowEditDialog(true);
  };

  // Save edited order
  const handleSaveEditedOrder = async () => {
    if (!editingOrder) return;
    
    try {
      await updateOrder(editingOrder.id, editingOrder);
      setShowEditDialog(false);
    } catch (error) {
      console.error("Failed to update order:", error);
    }
  };

  // Cancel an order
  const handleCancelOrder = async (id: number) => {
    try {
      await cancelOrder(id);
    } catch (error) {
      console.error("Failed to cancel order:", error);
    }
  };

  // Get account name from accountId
  const getAccountName = (accountId: number) => {
    const account = accounts.find(a => a.id === accountId);
    return account?.name || `Account ${accountId}`;
  };

  if (isLoading) {
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    value={orderForm.accountId.toString()}
                    onValueChange={(value) => handleFormChange("accountId", parseInt(value))}
                  >
                    <SelectTrigger id="account" className="mt-1">
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id.toString()}>
                          {account.name}
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
                    type="number"
                    min="1"
                    value={orderForm.quantity}
                    onChange={(e) => handleFormChange("quantity", parseInt(e.target.value))}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.25"
                    value={orderForm.price}
                    onChange={(e) => handleFormChange("price", parseFloat(e.target.value))}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="orderType">Order Type</Label>
                  <Select
                    value={orderForm.orderType}
                    onValueChange={(value) => handleFormChange("orderType", value)}
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
                
                <div>
                  <Label htmlFor="timeInForce">Time in Force</Label>
                  <Select
                    value={orderForm.timeInForce}
                    onValueChange={(value) => handleFormChange("timeInForce", value)}
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
              </div>
              
              <div className="flex justify-end space-x-3">
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
        
        {/* Positions Table */}
        <Card>
          <CardHeader className="px-6 py-4 border-b">
            <CardTitle className="text-lg font-medium">Current Positions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Avg Price</TableHead>
                    <TableHead>P/L</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {positions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No positions found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    positions.map((position) => (
                      <TableRow key={position.id}>
                        <TableCell>{getAccountName(position.accountId)}</TableCell>
                        <TableCell>{position.symbol}</TableCell>
                        <TableCell className="font-mono">{position.quantity}</TableCell>
                        <TableCell className="font-mono">
                          {position.avgPrice.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell
                          className={`font-mono ${
                            position.pnl >= 0 ? "text-green-500" : "text-red-500"
                          }`}
                        >
                          {position.pnl >= 0 ? "+" : ""}$
                          {position.pnl.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        
        {/* Orders Table */}
        <Card className="lg:col-span-2">
          <CardHeader className="px-6 py-4 border-b">
            <CardTitle className="text-lg font-medium">Active Orders</CardTitle>
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
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        No orders found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.map((order) => (
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
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            className="text-primary-600 hover:text-primary-900 dark:hover:text-primary-400 h-8 px-2"
                            onClick={() => handleEditOrder(order)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            className="text-red-600 hover:text-red-900 dark:hover:text-red-400 h-8 px-2"
                            onClick={() => handleCancelOrder(order.id)}
                          >
                            Cancel
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
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
                  value={editingOrder.accountId.toString()}
                  onValueChange={(value) => 
                    setEditingOrder((prev) => 
                      prev ? { ...prev, accountId: parseInt(value) } : null
                    )
                  }
                >
                  <SelectTrigger id="edit-account">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id.toString()}>
                        {account.name}
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
                  value={editingOrder.quantity}
                  onChange={(e) => 
                    setEditingOrder((prev) => 
                      prev ? { ...prev, quantity: parseInt(e.target.value) } : null
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
                  value={editingOrder.price}
                  onChange={(e) => 
                    setEditingOrder((prev) => 
                      prev ? { ...prev, price: parseFloat(e.target.value) } : null
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
