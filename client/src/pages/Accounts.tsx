import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
} from "@/components/ui/dialog";

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
    broker: "Interactive Brokers",
    apiKey: "",
    apiSecret: "",
    accountNumber: "",
    active: true,
  });

  // Edit account dialog state
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
        broker: "Interactive Brokers",
        apiKey: "",
        apiSecret: "",
        accountNumber: "",
        active: true,
      });
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-[500px] rounded-lg" />
        <Skeleton className="h-[500px] rounded-lg" />
        <Skeleton className="h-[300px] rounded-lg lg:col-span-2" />
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add Account Form */}
        <Card>
          <CardHeader className="px-6 py-4 border-b">
            <CardTitle className="text-lg font-medium">Add New Account</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleCreateAccount}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="accountName">Account Name</Label>
                  <Input
                    id="accountName"
                    value={accountForm.name}
                    onChange={(e) => handleFormChange("name", e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="broker">Broker</Label>
                  <Select
                    value={accountForm.broker}
                    onValueChange={(value) => handleFormChange("broker", value)}
                  >
                    <SelectTrigger id="broker" className="mt-1">
                      <SelectValue placeholder="Select broker" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Interactive Brokers">Interactive Brokers</SelectItem>
                      <SelectItem value="TD Ameritrade">TD Ameritrade</SelectItem>
                      <SelectItem value="E*Trade">E*Trade</SelectItem>
                      <SelectItem value="Schwab">Schwab</SelectItem>
                      <SelectItem value="Tastytrade">Tastytrade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={accountForm.apiKey}
                    onChange={(e) => handleFormChange("apiKey", e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="apiSecret">API Secret</Label>
                  <Input
                    id="apiSecret"
                    type="password"
                    value={accountForm.apiSecret}
                    onChange={(e) => handleFormChange("apiSecret", e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="accountNumber">Account Number (Optional)</Label>
                  <Input
                    id="accountNumber"
                    value={accountForm.accountNumber}
                    onChange={(e) => handleFormChange("accountNumber", e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <div className="md:col-span-2 flex items-center space-x-2 mt-2">
                  <Checkbox
                    id="account-active"
                    checked={accountForm.active}
                    onCheckedChange={(checked) => 
                      handleFormChange("active", checked === true)
                    }
                  />
                  <Label
                    htmlFor="account-active"
                    className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Account Active
                  </Label>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button type="submit">Add Account</Button>
              </div>
            </form>
          </CardContent>
        </Card>
        
        {/* API Connections Info */}
        <Card>
          <CardHeader className="px-6 py-4 border-b">
            <CardTitle className="text-lg font-medium">API Connection Guidelines</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="prose dark:prose-invert prose-sm max-w-none">
              <p>To connect your brokerage account, you'll need to generate API credentials from your broker's developer portal.</p>
              
              <h4>Interactive Brokers</h4>
              <ul>
                <li>Log in to your IBKR account</li>
                <li>Navigate to User Settings &gt; API &gt; Settings</li>
                <li>Enable "Read-Only API access" and "Trading API access"</li>
                <li>Generate a new API key with appropriate permissions</li>
              </ul>
              
              <h4>TD Ameritrade</h4>
              <ul>
                <li>Visit the TD Ameritrade Developer Portal</li>
                <li>Register a new application</li>
                <li>Use OAuth for authentication and request appropriate scopes</li>
                <li>Add the redirect URI: http://localhost:5001/callback</li>
              </ul>
              
              <p className="text-yellow-600 dark:text-yellow-400"><strong>Important:</strong> Never share your API credentials. The system will securely encrypt and store your API keys.</p>
            </div>
          </CardContent>
        </Card>
        
        {/* Accounts Table */}
        <Card className="lg:col-span-2">
          <CardHeader className="px-6 py-4 border-b">
            <CardTitle className="text-lg font-medium">Registered Accounts</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <AccountsTable 
              accounts={accounts}
              onEdit={handleEditAccount}
              onDelete={handleDeleteAccount}
            />
          </CardContent>
        </Card>
      </div>
      
      {/* Edit Account Dialog */}
      {editingAccount && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Account</DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="col-span-2">
                <Label htmlFor="edit-name">Account Name</Label>
                <Input
                  id="edit-name"
                  value={editingAccount.name}
                  onChange={(e) => 
                    setEditingAccount((prev) => 
                      prev ? { ...prev, name: e.target.value } : null
                    )
                  }
                />
              </div>
              
              <div className="col-span-2">
                <Label htmlFor="edit-broker">Broker</Label>
                <Select
                  value={editingAccount.broker}
                  onValueChange={(value) => 
                    setEditingAccount((prev) => 
                      prev ? { ...prev, broker: value } : null
                    )
                  }
                >
                  <SelectTrigger id="edit-broker">
                    <SelectValue placeholder="Select broker" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Interactive Brokers">Interactive Brokers</SelectItem>
                    <SelectItem value="TD Ameritrade">TD Ameritrade</SelectItem>
                    <SelectItem value="E*Trade">E*Trade</SelectItem>
                    <SelectItem value="Schwab">Schwab</SelectItem>
                    <SelectItem value="Tastytrade">Tastytrade</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
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
                  placeholder="********"
                />
              </div>
              
              <div>
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
                  placeholder="********"
                />
              </div>
              
              <div className="col-span-2 flex items-center space-x-2 mt-2">
                <Checkbox
                  id="edit-account-active"
                  checked={editingAccount.active}
                  onCheckedChange={(checked) => 
                    setEditingAccount((prev) => 
                      prev ? { ...prev, active: checked === true } : null
                    )
                  }
                />
                <Label
                  htmlFor="edit-account-active"
                  className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Account Active
                </Label>
              </div>
            </div>
            
            <DialogFooter className="mt-6">
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
