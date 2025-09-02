import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Download, Package } from "lucide-react";
import { StockTransaction } from "@/hooks/useStockLedger";
import { format } from "date-fns";

interface PurchaseHistoryProps {
  transactions: StockTransaction[];
}

export const PurchaseHistory = ({ transactions }: PurchaseHistoryProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter transactions based on search query
  const filteredTransactions = transactions.filter(transaction =>
    transaction.product?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    transaction.product?.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    transaction.reference_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    transaction.notes?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage);

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  };

  const calculateLineTotal = (quantity: number, unitCost: number | null) => {
    return quantity * (unitCost || 0);
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-2">No Purchase History</h3>
        <p className="text-muted-foreground">
          Start recording purchases to see transaction history here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by product, SKU, reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-muted-foreground">
        Showing {paginatedTransactions.length} of {filteredTransactions.length} purchases
      </div>

      {/* Purchase History Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Unit Cost</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTransactions.map((transaction) => {
                const lineTotal = calculateLineTotal(transaction.quantity_delta, transaction.unit_cost);
                
                return (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(transaction.created_at), 'dd MMM yyyy')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(transaction.created_at), 'HH:mm')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{transaction.product?.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Unit: {transaction.product?.unit}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {transaction.product?.sku}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-medium">
                        {transaction.quantity_delta.toLocaleString('en-IN')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {transaction.product?.unit}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {transaction.unit_cost ? (
                        <div className="font-medium">
                          {formatCurrency(transaction.unit_cost)}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-medium text-green-600">
                        {formatCurrency(lineTotal)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {transaction.reference_no ? (
                        <Badge variant="secondary" className="font-mono text-xs">
                          {transaction.reference_no}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {transaction.notes ? (
                        <div className="text-sm max-w-32 truncate" title={transaction.notes}>
                          {transaction.notes}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};