import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Account } from "@/contexts/TradingContext";
import { Badge } from "@/components/ui/badge";

interface AccountsTableProps {
  accounts: Account[];
  onEdit: (account: Account) => void;
  onDelete: (id: number) => void;
}

const AccountsTable = ({ accounts, onEdit, onDelete }: AccountsTableProps) => {
  return (
    <div className="overflow-x-auto">
      <div className="p-6 pb-3">
        <h2 className="text-xl font-medium">Accounts</h2>
      </div>
      <Table>
        <TableHeader className="bg-gray-50 dark:bg-gray-800">
          <TableRow className="border-b border-gray-200 dark:border-gray-700">
            <TableHead className="py-3">Name</TableHead>
            <TableHead className="py-3">Broker</TableHead>
            <TableHead className="py-3">Account Type</TableHead>
            <TableHead className="py-3">Status</TableHead>
            <TableHead className="py-3 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                No accounts found. Click "Add New Account" to create one.
              </TableCell>
            </TableRow>
          ) : (
            accounts.map((account) => (
              <TableRow key={account.id} className="border-t border-gray-100 dark:border-gray-800">
                <TableCell className="font-medium py-4">{account.name}</TableCell>
                <TableCell>{account.broker}</TableCell>
                <TableCell>Live Trading</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`px-2 py-1 ${
                      account.active
                        ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                        : "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
                    }`}
                  >
                    {account.active ? "Enabled" : "Disabled"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-sm font-medium"
                    onClick={() => onEdit(account)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-sm font-medium text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
                    onClick={() => onDelete(account.id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default AccountsTable;
