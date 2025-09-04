import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useProductStockTransactions, StockTransaction } from "@/hooks/useStockLedger";
import { Product } from "@/hooks/useProducts";
import { ArrowUp, ArrowDown, Package, Calendar, FileText, Download } from "lucide-react";
import { downloadStockRegisterPDF } from "@/lib/stock-register-pdf";

interface StockRegisterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
}

export const StockRegisterDialog = ({ open, onOpenChange, product }: StockRegisterDialogProps) => {
  const { data: transactions = [], isLoading } = useProductStockTransactions(product?.id || "");
  const [runningBalance, setRunningBalance] = useState(0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'purchase':
        return 'bg-green-100 text-green-800';
      case 'sale':
        return 'bg-red-100 text-red-800';
      case 'adjustment':
        return 'bg-blue-100 text-blue-800';
      case 'return':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <ArrowUp className="h-4 w-4" />;
      case 'sale':
        return <ArrowDown className="h-4 w-4" />;
      case 'adjustment':
        return <Package className="h-4 w-4" />;
      case 'return':
        return <ArrowUp className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'purchase':
        return 'Purchase';
      case 'sale':
        return 'Sale';
      case 'adjustment':
        return 'Adjustment';
      case 'return':
        return 'Return';
      default:
        return type;
    }
  };

  const handleExportPDF = () => {
    if (product && transactions.length > 0) {
      downloadStockRegisterPDF(product, transactions);
    }
  };

  // Calculate running balance
  const calculateRunningBalance = (transactions: StockTransaction[]) => {
    let balance = 0;
    return transactions.map(transaction => {
      balance += transaction.quantity_delta;
      return { ...transaction, running_balance: balance };
    });
  };

  const transactionsWithBalance = calculateRunningBalance(transactions);

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Package className="h-6 w-6" />
                Stock Register - {product.name}
              </DialogTitle>
              <div className="text-sm text-gray-600 space-y-1 mt-2">
                <div><span className="font-medium">SKU:</span> {product.sku}</div>
                <div><span className="font-medium">Current Stock:</span> {product.current_stock} {product.unit}</div>
                <div><span className="font-medium">Unit Price:</span> {formatCurrency(product.unit_price)}</div>
              </div>
            </div>
            {transactions.length > 0 && (
              <Button
                onClick={handleExportPDF}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export PDF
              </Button>
            )}
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No stock transactions found for this product.</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-32">Date & Time</TableHead>
                      <TableHead className="w-24">Type</TableHead>
                      <TableHead className="w-32">Reference</TableHead>
                      <TableHead className="w-24 text-right">Quantity</TableHead>
                      <TableHead className="w-24 text-right">Unit Cost</TableHead>
                      <TableHead className="w-24 text-right">Total Value</TableHead>
                      <TableHead className="w-24 text-right">Balance</TableHead>
                      <TableHead className="w-48">Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactionsWithBalance.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            {formatDate(transaction.created_at)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={`${getTransactionTypeColor(transaction.transaction_type)} border-0`}
                          >
                            <div className="flex items-center gap-1">
                              {getTransactionIcon(transaction.transaction_type)}
                              {getTransactionLabel(transaction.transaction_type)}
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {transaction.reference_no || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`font-medium ${transaction.quantity_delta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {transaction.quantity_delta > 0 ? '+' : ''}{transaction.quantity_delta} {product.unit}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {transaction.unit_cost ? formatCurrency(transaction.unit_cost) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {transaction.unit_cost ? formatCurrency(transaction.unit_cost * Math.abs(transaction.quantity_delta)) : '-'}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {transaction.running_balance} {product.unit}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {transaction.notes || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Summary */}
            {transactions.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-3">Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Total Purchases</div>
                    <div className="font-medium">
                      {transactions
                        .filter(t => t.transaction_type === 'purchase')
                        .reduce((sum, t) => sum + t.quantity_delta, 0)} {product.unit}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Total Sales</div>
                    <div className="font-medium text-red-600">
                      {Math.abs(transactions
                        .filter(t => t.transaction_type === 'sale')
                        .reduce((sum, t) => sum + t.quantity_delta, 0))} {product.unit}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Current Balance</div>
                    <div className="font-medium">
                      {product.current_stock} {product.unit}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Total Transactions</div>
                    <div className="font-medium">
                      {transactions.length}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
