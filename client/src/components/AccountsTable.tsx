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
        <h2 className="text-xl font-medium">
          Accounts <span className="text-sm font-normal text-gray-500">({accounts.length})</span>
        </h2>
      </div>
      
      <div className="w-full pr-4">
        <Table className="table-fixed w-full">
          <TableHeader className="bg-gray-50 dark:bg-gray-800">
            <TableRow className="border-b border-gray-200 dark:border-gray-700">
              <TableHead className="py-3 w-[25%] text-left">Name</TableHead>
              <TableHead className="py-3 w-[20%] text-left">Account Number</TableHead>
              <TableHead className="py-3 w-[20%] text-left">Broker</TableHead>
              <TableHead className="py-3 w-[15%] text-left">Percent to Trade</TableHead>
              <TableHead className="py-3 text-center pl-24 w-[20%]">Actions</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      </div>

      <div className="max-h-[550px] overflow-y-auto relative">
        <Table className="table-fixed w-full">
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
                  <TableCell className="font-medium py-4 w-[25%]">{account.name}</TableCell>
                  <TableCell className="w-[20%]">{account.accountNumber || 'N/A'}</TableCell>
                  <TableCell className="w-[20%]">{account.broker}</TableCell>
                  <TableCell className="w-[15%]">
                    {(account.percentToTrade * 100).toFixed(0)}%
                  </TableCell>
                  <TableCell className="text-right space-x-2 w-[20%]">
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
    </div>
  );
};

export default AccountsTable;
