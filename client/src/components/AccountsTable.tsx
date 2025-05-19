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

interface AccountsTableProps {
  accounts: Account[];
  onEdit: (account: Account) => void;
  onDelete: (id: number) => void;
}

const AccountsTable = ({ accounts, onEdit, onDelete }: AccountsTableProps) => {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Account Name</TableHead>
            <TableHead>Broker</TableHead>
            <TableHead>API Key</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                No accounts found.
              </TableCell>
            </TableRow>
          ) : (
            accounts.map((account) => (
              <TableRow key={account.id}>
                <TableCell>{account.name}</TableCell>
                <TableCell>{account.broker}</TableCell>
                <TableCell className="font-mono">********</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                      account.active
                        ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                        : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                    }`}
                  >
                    {account.active ? "Active" : "Inactive"}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    className="text-primary-600 hover:text-primary-900 dark:hover:text-primary-400 h-8 px-2"
                    onClick={() => onEdit(account)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-red-600 hover:text-red-900 dark:hover:text-red-400 h-8 px-2"
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
