import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProductStockTransactions, StockTransaction } from "@/hooks/useStockLedger";
import { Product } from "@/hooks/useProducts";
import { ArrowUp, ArrowDown, Package, Calendar, FileText, Download, Filter, X, Send } from "lucide-react";
import { downloadStockRegisterPDF, generateStockRegisterPDFBlob } from "@/lib/stock-register-pdf";
import { sendFileToTelegram } from "@/lib/telegram";

interface StockRegisterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
}

export const StockRegisterDialog = ({ open, onOpenChange, product }: StockRegisterDialogProps) => {
  const { data: transactions = [], isLoading } = useProductStockTransactions(product?.id || "");
  const [runningBalance, setRunningBalance] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  
  // Filter states
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<string>("all");
  const [dateFromFilter, setDateFromFilter] = useState<string>("");
  const [dateToFilter, setDateToFilter] = useState<string>("");
  const [quantityFilter, setQuantityFilter] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  
  // Monthly summary states
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [showMonthlySummary, setShowMonthlySummary] = useState(false);
  
  // Telegram upload state
  const [isUploadingToTelegram, setIsUploadingToTelegram] = useState(false);

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
      day: 'numeric'
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

  // Calculate monthly summary
  const calculateMonthlySummary = (monthYear: string) => {
    if (!monthYear) return null;

    const [year, month] = monthYear.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const monthlyTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.created_at);
      return transactionDate >= startDate && transactionDate <= endDate;
    });

    const purchases = monthlyTransactions
      .filter(t => t.transaction_type === 'purchase')
      .reduce((sum, t) => sum + t.quantity_delta, 0);

    const sales = Math.abs(monthlyTransactions
      .filter(t => t.transaction_type === 'sale')
      .reduce((sum, t) => sum + t.quantity_delta, 0));

    const adjustments = monthlyTransactions
      .filter(t => t.transaction_type === 'adjustment')
      .reduce((sum, t) => sum + t.quantity_delta, 0);

    const returns = monthlyTransactions
      .filter(t => t.transaction_type === 'return')
      .reduce((sum, t) => sum + t.quantity_delta, 0);

    // Calculate opening stock (stock at the beginning of the month)
    const openingStock = transactions
      .filter(t => new Date(t.created_at) < startDate)
      .reduce((sum, t) => sum + t.quantity_delta, 0);

    // Calculate closing stock (opening + purchases + adjustments + returns - sales)
    const closingStock = openingStock + purchases + adjustments + returns - sales;

    return {
      month: new Date(year, month - 1).toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'long' 
      }),
      openingStock,
      purchases,
      sales,
      adjustments,
      returns,
      closingStock,
      totalTransactions: monthlyTransactions.length
    };
  };

  const monthlySummary = selectedMonth ? calculateMonthlySummary(selectedMonth) : null;

  const handleExportPDF = () => {
    if (product && transactions.length > 0) {
      downloadStockRegisterPDF(product, transactions);
    }
  };

  const handleSendToTelegram = async () => {
    if (!product || transactions.length === 0) return;

    setIsUploadingToTelegram(true);
    try {
      // Use default Telegram settings
      const telegramSettings = {
        telegramBotToken: "8299489187:AAGe2QhxpMit1z2ycynPgTvXQDvqBcC4gMo",
        telegramChatId: "-1002926678775"
      };

      // Generate PDF blob
      const pdfBlob = await generateStockRegisterPDFBlob(product, transactions);
      
      // Create filename: "Product Name StockReg.pdf"
      const sanitizedProductName = product.name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, ' ');
      const filename = `${sanitizedProductName} StockReg.pdf`;

      // Send to Telegram
      const success = await sendFileToTelegram(pdfBlob, filename, telegramSettings);
      
      if (success) {
        alert('Stock register sent to Telegram successfully!');
      } else {
        alert('Failed to send stock register to Telegram. Please try again.');
      }
    } catch (error) {
      console.error('Error sending to Telegram:', error);
      alert('Error sending stock register to Telegram. Please try again.');
    } finally {
      setIsUploadingToTelegram(false);
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

  // Filter transactions
  const filteredTransactions = transactionsWithBalance.filter(transaction => {
    // Transaction type filter
    if (transactionTypeFilter !== "all" && transaction.transaction_type !== transactionTypeFilter) {
      return false;
    }

    // Date range filter
    if (dateFromFilter) {
      const transactionDate = new Date(transaction.created_at);
      const fromDate = new Date(dateFromFilter);
      if (transactionDate < fromDate) return false;
    }

    if (dateToFilter) {
      const transactionDate = new Date(transaction.created_at);
      const toDate = new Date(dateToFilter);
      toDate.setHours(23, 59, 59, 999); // Include entire day
      if (transactionDate > toDate) return false;
    }

    // Quantity filter
    if (quantityFilter) {
      const quantity = Math.abs(transaction.quantity_delta);
      const filterQuantity = parseFloat(quantityFilter);
      if (isNaN(filterQuantity) || quantity < filterQuantity) return false;
    }

    return true;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  // Reset to first page when product changes or filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [product?.id, transactionTypeFilter, dateFromFilter, dateToFilter, quantityFilter]);

  // Clear all filters
  const clearFilters = () => {
    setTransactionTypeFilter("all");
    setDateFromFilter("");
    setDateToFilter("");
    setQuantityFilter("");
    setSelectedMonth("");
    setShowMonthlySummary(false);
    setCurrentPage(1);
  };

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
              <div className="flex gap-2">
                <Button
                  onClick={handleExportPDF}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export PDF
                </Button>
                <Button
                  onClick={handleSendToTelegram}
                  disabled={isUploadingToTelegram}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  {isUploadingToTelegram ? "Sending..." : "Send to Telegram"}
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        {/* Filter Section */}
        <div className="border-b pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                {(transactionTypeFilter !== "all" || dateFromFilter || dateToFilter || quantityFilter) && (
                  <Badge variant="secondary" className="ml-1">
                    {[transactionTypeFilter !== "all", dateFromFilter, dateToFilter, quantityFilter].filter(Boolean).length}
                  </Badge>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMonthlySummary(!showMonthlySummary)}
                className="flex items-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                Monthly Summary
                {selectedMonth && (
                  <Badge variant="secondary" className="ml-1">
                    1
                  </Badge>
                )}
              </Button>
              {[transactionTypeFilter !== "all", dateFromFilter, dateToFilter, quantityFilter, selectedMonth].some(Boolean) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-gray-500"
                >
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>
            <div className="text-sm text-gray-600">
              Showing {filteredTransactions.length} of {transactionsWithBalance.length} transactions
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <Label htmlFor="transaction-type">Transaction Type</Label>
                <Select value={transactionTypeFilter} onValueChange={setTransactionTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="purchase">Purchase</SelectItem>
                    <SelectItem value="sale">Sale</SelectItem>
                    <SelectItem value="adjustment">Adjustment</SelectItem>
                    <SelectItem value="return">Return</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="date-from">From Date</Label>
                <Input
                  id="date-from"
                  type="date"
                  value={dateFromFilter}
                  onChange={(e) => setDateFromFilter(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="date-to">To Date</Label>
                <Input
                  id="date-to"
                  type="date"
                  value={dateToFilter}
                  onChange={(e) => setDateToFilter(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="quantity">Min Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.001"
                  placeholder="Enter minimum quantity"
                  value={quantityFilter}
                  onChange={(e) => setQuantityFilter(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Monthly Summary Section */}
          {showMonthlySummary && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-blue-900">Monthly Stock Summary</h3>
                <div className="flex items-center gap-2">
                  <Label htmlFor="month-select" className="text-sm font-medium text-blue-700">
                    Select Month:
                  </Label>
                  <Input
                    id="month-select"
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-40"
                  />
                </div>
              </div>

              {monthlySummary ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-3 rounded-lg border">
                    <div className="text-sm text-gray-600 mb-1">Opening Stock</div>
                    <div className="text-lg font-bold text-gray-900">
                      {monthlySummary.openingStock} {product.unit}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border">
                    <div className="text-sm text-gray-600 mb-1">Purchases</div>
                    <div className="text-lg font-bold text-green-600">
                      +{monthlySummary.purchases} {product.unit}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border">
                    <div className="text-sm text-gray-600 mb-1">Sales</div>
                    <div className="text-lg font-bold text-red-600">
                      -{monthlySummary.sales} {product.unit}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border">
                    <div className="text-sm text-gray-600 mb-1">Closing Stock</div>
                    <div className="text-lg font-bold text-blue-600">
                      {monthlySummary.closingStock} {product.unit}
                    </div>
                  </div>
                </div>
              ) : selectedMonth ? (
                <div className="text-center py-4 text-gray-500">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>No transactions found for {new Date(selectedMonth + '-01').toLocaleDateString('en-IN', { 
                    year: 'numeric', 
                    month: 'long' 
                  })}</p>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>Please select a month to view the summary</p>
                </div>
              )}

              {monthlySummary && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Adjustments:</span>
                      <span className="ml-2 font-medium">
                        {monthlySummary.adjustments > 0 ? '+' : ''}{monthlySummary.adjustments} {product.unit}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Returns:</span>
                      <span className="ml-2 font-medium text-green-600">
                        +{monthlySummary.returns} {product.unit}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Transactions:</span>
                      <span className="ml-2 font-medium">{monthlySummary.totalTransactions}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

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
              <div className="space-y-2">
                {paginatedTransactions.map((transaction, index) => (
                  <div key={transaction.id} className="border border-gray-200 rounded-md p-3 hover:shadow-sm transition-shadow">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      {/* Date */}
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Date</div>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span className="font-medium">{formatDate(transaction.created_at)}</span>
                        </div>
                      </div>

                      {/* Invoice/Reference */}
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Invoice</div>
                        <div className="text-sm font-mono">
                          {transaction.reference_no || '-'}
                        </div>
                      </div>

                      {/* Type */}
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Type</div>
                        <div className="flex items-center gap-1">
                          {getTransactionIcon(transaction.transaction_type)}
                          <span className="text-sm font-medium capitalize">
                            {getTransactionLabel(transaction.transaction_type)}
                          </span>
                        </div>
                      </div>

                      {/* Quantity */}
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Qty</div>
                        <div className={`text-sm font-bold ${
                          transaction.transaction_type === 'sale' ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {transaction.quantity_delta > 0 ? '+' : ''}{transaction.quantity_delta} {product.unit}
                        </div>
                      </div>

                      {/* Closing Stock */}
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Closing Stock</div>
                        <div className="text-sm font-bold text-gray-900">
                          {transaction.running_balance} {product.unit}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {filteredTransactions.length > 0 && totalPages > 1 && (
              <div className="flex justify-center mt-6">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    
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
