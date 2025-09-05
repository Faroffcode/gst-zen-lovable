import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useStockTransactions } from "@/hooks/useStockLedger";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, TrendingUp, TrendingDown, RotateCcw, ArrowUpDown } from "lucide-react";
import React, { useState, useMemo } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const StockMovements = () => {
  const { data: transactions, isLoading, error } = useStockTransactions();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Show 10 transactions per page

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "purchase":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "sale":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case "adjustment":
        return <ArrowUpDown className="h-4 w-4 text-blue-600" />;
      case "return":
        return <RotateCcw className="h-4 w-4 text-orange-600" />;
      default:
        return <Package className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTransactionBadgeVariant = (type: string) => {
    switch (type) {
      case "purchase":
        return "default";
      case "sale":
        return "destructive";
      case "adjustment":
        return "secondary";
      case "return":
        return "outline";
      default:
        return "secondary";
    }
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

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Pagination logic
  const totalPages = Math.ceil((transactions?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = useMemo(() => {
    if (!transactions) return [];
    return transactions.slice(startIndex, endIndex);
  }, [transactions, startIndex, endIndex]);

  // Reset to first page when transactions change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [transactions]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Stock Movements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                <Skeleton className="h-4 w-4" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Stock Movements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Error loading stock movements</p>
            <p>Please try again later.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Stock Movements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No stock movements found</p>
            <p>Stock transactions will appear here when products are purchased or sold.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Stock Movements
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {paginatedTransactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50">
              <div className="flex-shrink-0">
                {getTransactionIcon(transaction.transaction_type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {transaction.product?.name || "Unknown Product"}
                  </h4>
                  <Badge variant={getTransactionBadgeVariant(transaction.transaction_type)}>
                    {transaction.transaction_type.charAt(0).toUpperCase() + transaction.transaction_type.slice(1)}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>SKU: {transaction.product?.sku || "N/A"}</span>
                  <span>•</span>
                  <span>{formatDate(transaction.created_at)}</span>
                  {transaction.reference_no && (
                    <>
                      <span>•</span>
                      <span>Ref: {transaction.reference_no}</span>
                    </>
                  )}
                </div>
                
                {transaction.notes && (
                  <p className="text-xs text-gray-600 mt-1">{transaction.notes}</p>
                )}
              </div>
              
              <div className="flex-shrink-0 text-right">
                <div className={`text-sm font-medium ${
                  transaction.quantity_delta > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.quantity_delta > 0 ? '+' : ''}{transaction.quantity_delta} {transaction.product?.unit || 'units'}
                </div>
                {transaction.unit_cost && (
                  <div className="text-xs text-gray-500">
                    {formatCurrency(transaction.unit_cost)}/unit
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(endIndex, transactions?.length || 0)} of {transactions?.length || 0} transactions
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNumber = i + 1;
                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        onClick={() => setCurrentPage(pageNumber)}
                        isActive={currentPage === pageNumber}
                        className="cursor-pointer"
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                {totalPages > 5 && (
                  <PaginationItem>
                    <span className="px-3 py-2 text-sm text-muted-foreground">...</span>
                  </PaginationItem>
                )}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StockMovements;
