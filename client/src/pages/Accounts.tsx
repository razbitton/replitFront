import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTradingContext } from "@/contexts/TradingContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Account } from "@/contexts/TradingContext";
import AccountsTable from "@/components/AccountsTable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

// New account form type
type NewAccount = Omit<Account, "id">;

const Accounts = () => {
  const { 
    accounts, 
    addAccount, 
    updateAccount, 
    deleteAccount, 
    isLoading 
  } = useTradingContext();

  // Form state
  const [accountForm, setAccountForm] = useState<NewAccount>({
    name: "",
    broker: "",
    apiKey: "",
    apiSecret: "",
    accountNumber: "",
    refreshToken: "", // Added refresh token
    percentToTrade: 0.5, // Added percent to trade (0-1)
    active: true,
  });

  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // Handle form changes
  const handleFormChange = (field: keyof NewAccount, value: any) => {
    setAccountForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle account creation
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addAccount(accountForm);
      // Reset form after successful creation
      setAccountForm({
        name: "",
        broker: "",
        apiKey: "",
        apiSecret: "",
        accountNumber: "",
        refreshToken: "",
        percentToTrade: 0.5,
        active: true,
      });
      setShowAddDialog(false);
    } catch (error) {
      console.error("Failed to create account:", error);
    }
  };

  // Edit an account
  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    setShowEditDialog(true);
  };

  // Save edited account
  const handleSaveEditedAccount = async () => {
    if (!editingAccount) return;
    
    try {
      await updateAccount(editingAccount.id, editingAccount);
      setShowEditDialog(false);
    } catch (error) {
      console.error("Failed to update account:", error);
    }
  };

  // Delete an account
  const handleDeleteAccount = async (id: number) => {
    try {
      await deleteAccount(id);
    } catch (error) {
      console.error("Failed to delete account:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-[400px] rounded-lg w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Trading Accounts</h1>
        <Button 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => setShowAddDialog(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Account
        </Button>
      </div>
      
      {/* Accounts Table Card */}
      <Card>
        <CardContent className="p-0">
          <AccountsTable 
            accounts={accounts}
            onEdit={handleEditAccount}
            onDelete={handleDeleteAccount}
          />
        </CardContent>
      </Card>
      
      {/* Add Account Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Account</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleCreateAccount}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="accountName">Name</Label>
                <Input
                  id="accountName"
                  value={accountForm.name}
                  onChange={(e) => handleFormChange("name", e.target.value)}
                  placeholder="Enter account name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="broker">Broker</Label>
                <Input
                  id="broker"
                  value={accountForm.broker}
                  onChange={(e) => handleFormChange("broker", e.target.value)}
                  placeholder="Enter broker name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  value={accountForm.accountNumber}
                  onChange={(e) => handleFormChange("accountNumber", e.target.value)}
                  placeholder="Enter account number"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={accountForm.apiKey}
                    onChange={(e) => handleFormChange("apiKey", e.target.value)}
                    placeholder="Enter API key"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="apiSecret">API Secret</Label>
                  <Input
                    id="apiSecret"
                    type="password"
                    value={accountForm.apiSecret}
                    onChange={(e) => handleFormChange("apiSecret", e.target.value)}
                    placeholder="Enter API secret"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="refreshToken">Refresh Token</Label>
                <Input
                  id="refreshToken"
                  type="password"
                  value={accountForm.refreshToken}
                  onChange={(e) => handleFormChange("refreshToken", e.target.value)}
                  placeholder="Enter refresh token (if applicable)"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="percentToTrade">Percent to Trade (0-1)</Label>
                <Input
                  id="percentToTrade"
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  value={accountForm.percentToTrade}
                  onChange={(e) => handleFormChange("percentToTrade", parseFloat(e.target.value))}
                  placeholder="Enter percent to trade (0-1)"
                  required
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="accountEnabled" className="cursor-pointer">Enabled</Label>
                <Switch
                  id="accountEnabled"
                  checked={accountForm.active}
                  onCheckedChange={(checked) => 
                    handleFormChange("active", checked)
                  }
                />
              </div>
            </div>
            
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit">Save Account</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Account Dialog */}
      {editingAccount && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Account</DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={editingAccount.name}
                  onChange={(e) => 
                    setEditingAccount((prev) => 
                      prev ? { ...prev, name: e.target.value } : null
                    )
                  }
                  placeholder="Enter account name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-broker">Broker</Label>
                <Input
                  id="edit-broker"
                  value={editingAccount.broker}
                  onChange={(e) => 
                    setEditingAccount((prev) => 
                      prev ? { ...prev, broker: e.target.value } : null
                    )
                  }
                  placeholder="Enter broker name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-accountNumber">Account Number</Label>
                <Input
                  id="edit-accountNumber"
                  value={editingAccount.accountNumber}
                  onChange={(e) => 
                    setEditingAccount((prev) => 
                      prev ? { ...prev, accountNumber: e.target.value } : null
                    )
                  }
                  placeholder="Enter account number"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-apiKey">API Key</Label>
                  <Input
                    id="edit-apiKey"
                    type="password"
                    value={editingAccount.apiKey}
                    onChange={(e) => 
                      setEditingAccount((prev) => 
                        prev ? { ...prev, apiKey: e.target.value } : null
                      )
                    }
                    placeholder="Enter API key"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-apiSecret">API Secret</Label>
                  <Input
                    id="edit-apiSecret"
                    type="password"
                    value={editingAccount.apiSecret}
                    onChange={(e) => 
                      setEditingAccount((prev) => 
                        prev ? { ...prev, apiSecret: e.target.value } : null
                      )
                    }
                    placeholder="Enter API secret"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-refreshToken">Refresh Token</Label>
                <Input
                  id="edit-refreshToken"
                  type="password"
                  value={editingAccount.refreshToken || ''}
                  onChange={(e) => 
                    setEditingAccount((prev) => 
                      prev ? { ...prev, refreshToken: e.target.value } : null
                    )
                  }
                  placeholder="Enter refresh token (if applicable)"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-percentToTrade">Percent to Trade (0-1)</Label>
                <Input
                  id="edit-percentToTrade"
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  value={editingAccount.percentToTrade}
                  onChange={(e) => 
                    setEditingAccount((prev) => 
                      prev ? { ...prev, percentToTrade: parseFloat(e.target.value) } : null
                    )
                  }
                  placeholder="Enter percent to trade (0-1)"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-account-active" className="cursor-pointer">Enabled</Label>
                <Switch
                  id="edit-account-active"
                  checked={editingAccount.active}
                  onCheckedChange={(checked) => 
                    setEditingAccount((prev) => 
                      prev ? { ...prev, active: checked } : null
                    )
                  }
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEditedAccount}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Accounts;
