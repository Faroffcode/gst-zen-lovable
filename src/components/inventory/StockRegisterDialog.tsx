import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStockRegister, useAddStockRegisterEntry, useLastClosingStock, CreateStockRegisterEntry } from "@/hooks/useStockRegister";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Product } from "@/hooks/useProducts";
import { Package, Plus, TrendingUp, TrendingDown, Calendar, FileText, Download, Filter, X } from "lucide-react";
import { generateStockRegisterPDF, StockRegisterPDFData } from "@/lib/stock-register-pdf";

interface StockRegisterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
}

export const StockRegisterDialog = ({ open, onOpenChange, product }: StockRegisterDialogProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  
  const { data: stockRegisterData, isLoading } = useStockRegister(product?.id || "", currentPage, pageSize);
  const { data: lastClosingStock = 0 } = useLastClosingStock(product?.id || "");
  const addEntry = useAddStockRegisterEntry();
  
  // Form state for adding new entries
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEntry, setNewEntry] = useState<Omit<CreateStockRegisterEntry, 'product_id'>>({
    date: new Date().toISOString().split('T')[0],
    invoice: '',
    type: 'purchase',
    quantity: 0
  });

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    type: 'all',
    invoice: ''
  });

  const stockRegister = stockRegisterData?.data || [];
  const totalPages = stockRegisterData?.totalPages || 0;
  const totalCount = stockRegisterData?.totalCount || 0;

  // Filter entries based on current filters
  const filteredEntries = stockRegister.filter(entry => {
    if (filters.dateFrom && entry.date < filters.dateFrom) return false;
    if (filters.dateTo && entry.date > filters.dateTo) return false;
    if (filters.type !== 'all' && entry.type !== filters.type) return false;
    if (filters.invoice && !entry.invoice.toLowerCase().includes(filters.invoice.toLowerCase())) return false;
    return true;
  });

  // Calculate filtered totals
  const filteredTotalPurchases = filteredEntries
    .filter(entry => entry.type === 'purchase')
    .reduce((sum, entry) => sum + entry.quantity, 0);
  
  const filteredTotalSales = filteredEntries
    .filter(entry => entry.type === 'sale')
    .reduce((sum, entry) => sum + entry.quantity, 0);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatInvoiceNumber = (invoiceNumber: string) => {
    // If it's already in BTC format, return as is
    if (invoiceNumber.startsWith('BTC')) {
      return invoiceNumber;
    }
    
    // If it's in INV- format, convert to BTC format
    if (invoiceNumber.startsWith('INV-')) {
      const number = invoiceNumber.replace('INV-', '');
      return `BTC${number.padStart(3, '0')}`;
    }
    
    // If it's a raw number, add BTC prefix
    if (/^\d+$/.test(invoiceNumber)) {
      return `BTC${invoiceNumber.padStart(3, '0')}`;
    }
    
    // For any other format, return as is
    return invoiceNumber;
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'purchase':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'sale':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <TrendingUp className="h-4 w-4" />;
      case 'sale':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const handleAddEntry = () => {
    if (!product || !newEntry.invoice || newEntry.quantity <= 0) return;
    
    console.log('Adding stock register entry:', {
      ...newEntry,
      product_id: product.id,
      current_product_stock: product.current_stock
    });
    
    addEntry.mutate({
      ...newEntry,
      product_id: product.id
    }, {
      onSuccess: () => {
        console.log('Stock register entry added successfully');
        setNewEntry({
          date: new Date().toISOString().split('T')[0],
          invoice: '',
          type: 'purchase',
          quantity: 0
        });
        setShowAddForm(false);
        setCurrentPage(1); // Reset to first page when adding new entry
      },
      onError: (error) => {
        console.error('Failed to add stock register entry:', error);
      }
    });
  };

  const handleExportPDF = async () => {
    if (!product || !stockRegisterData) return;
    
    try {
      const pdfData: StockRegisterPDFData = {
        product,
        entries: filteredEntries, // Use filtered entries for PDF
        totalPurchases: filteredTotalPurchases,
        totalSales: filteredTotalSales,
        currentStock: product.current_stock,
        totalEntries: filteredEntries.length
      };
      
      await generateStockRegisterPDF(pdfData);
    } catch (error) {
      console.error('Failed to export PDF:', error);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      type: 'all',
      invoice: ''
    });
  };

  const hasActiveFilters = filters.dateFrom || filters.dateTo || filters.type !== 'all' || filters.invoice;

  const calculateNextClosingStock = () => {
    if (newEntry.type === 'purchase') {
      return lastClosingStock + newEntry.quantity;
    } else {
      return lastClosingStock - newEntry.quantity;
    }
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
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                className={`flex items-center gap-2 ${hasActiveFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : ''}`}
              >
                <Filter className="h-4 w-4" />
                Filter
                {hasActiveFilters && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                    {[filters.dateFrom, filters.dateTo, filters.type !== 'all' ? filters.type : '', filters.invoice].filter(Boolean).length}
                  </span>
                )}
              </Button>
              <Button
                onClick={handleExportPDF}
                variant="outline"
                className="flex items-center gap-2"
                disabled={totalCount === 0}
              >
                <Download className="h-4 w-4" />
                Export PDF
              </Button>
              <Button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Entry
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Filter Panel */}
        {showFilters && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg text-orange-900">Filter Entries</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="dateFrom">From Date</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="dateTo">To Date</Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="type">Transaction Type</Label>
                  <Select 
                    value={filters.type} 
                    onValueChange={(value) => setFilters({ ...filters, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="purchase">Purchase</SelectItem>
                      <SelectItem value="sale">Sale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="invoice">Invoice Number</Label>
                  <Input
                    id="invoice"
                    value={filters.invoice}
                    onChange={(e) => setFilters({ ...filters, invoice: e.target.value })}
                    placeholder="Search invoice..."
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-gray-600">
                  Showing {filteredEntries.length} of {stockRegister.length} entries
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={handleClearFilters}
                    disabled={!hasActiveFilters}
                  >
                    Clear Filters
                  </Button>
                  <Button 
                    onClick={() => setShowFilters(false)}
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add Entry Form */}
        {showAddForm && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-lg text-blue-900">Add New Stock Entry</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newEntry.date}
                    onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="invoice">Invoice Number *</Label>
                  <Input
                    id="invoice"
                    value={newEntry.invoice}
                    onChange={(e) => setNewEntry({ ...newEntry, invoice: e.target.value })}
                    placeholder="Enter invoice number"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="type">Transaction Type *</Label>
                  <Select 
                    value={newEntry.type} 
                    onValueChange={(value: 'purchase' | 'sale') => setNewEntry({ ...newEntry, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="purchase">Purchase</SelectItem>
                      <SelectItem value="sale">Sale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={newEntry.quantity || ''}
                    onChange={(e) => setNewEntry({ ...newEntry, quantity: parseInt(e.target.value) || 0 })}
                    placeholder="Enter quantity"
                    required
                  />
                </div>
              </div>

              {/* Stock Calculation Preview */}
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-medium text-gray-900 mb-3">Stock Calculation Preview</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Opening Stock:</span>
                    <div className="font-bold text-lg">{lastClosingStock} {product.unit}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Quantity ({newEntry.type}):</span>
                    <div className={`font-bold text-lg ${newEntry.type === 'purchase' ? 'text-green-600' : 'text-red-600'}`}>
                      {newEntry.type === 'purchase' ? '+' : '-'}{newEntry.quantity} {product.unit}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Closing Stock:</span>
                    <div className="font-bold text-lg text-blue-600">
                      {calculateNextClosingStock()} {product.unit}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddEntry}
                  disabled={!newEntry.invoice || newEntry.quantity <= 0 || addEntry.isPending}
                >
                  {addEntry.isPending ? 'Adding...' : 'Add Entry'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stock Register Table */}
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <div className="space-y-4">
            {totalCount === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No stock register entries found for this product.</p>
                <p className="text-sm">Add your first entry using the "Add Entry" button above.</p>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Stock Register Entries ({totalCount})
                  </CardTitle>
                  <div className="text-sm text-gray-600">
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} entries
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Opening Stock</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Closing Stock</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEntries.map((entry) => (
                        <TableRow key={entry.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              {formatDate(entry.date)}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {formatInvoiceNumber(entry.invoice)}
                          </TableCell>
                          <TableCell>
                            <Badge className={getTransactionTypeColor(entry.type)}>
                              <div className="flex items-center gap-1">
                                {getTransactionIcon(entry.type)}
                                <span className="capitalize">{entry.type}</span>
                              </div>
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {entry.opening_stock} {product.unit}
                          </TableCell>
                          <TableCell className={`text-right font-bold ${
                            entry.type === 'purchase' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {entry.type === 'purchase' ? '+' : '-'}{entry.quantity} {product.unit}
                          </TableCell>
                          <TableCell className="text-right font-bold text-blue-600">
                            {entry.closing_stock} {product.unit}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <Card>
                <CardContent className="pt-6">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              onClick={() => setCurrentPage(pageNum)}
                              isActive={currentPage === pageNum}
                              className="cursor-pointer"
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </CardContent>
              </Card>
            )}

            {/* Summary */}
            {totalCount > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    Summary {hasActiveFilters && `(Filtered: ${filteredEntries.length} entries)`}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-sm text-green-700 mb-1">Total Purchases</div>
                      <div className="text-xl font-bold text-green-800">
                        {filteredTotalPurchases} {product.unit}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="text-sm text-red-700 mb-1">Total Sales</div>
                      <div className="text-xl font-bold text-red-800">
                        {filteredTotalSales} {product.unit}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-sm text-blue-700 mb-1">Current Stock</div>
                      <div className="text-xl font-bold text-blue-800">
                        {product.current_stock} {product.unit}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-sm text-gray-700 mb-1">Total Entries</div>
                      <div className="text-xl font-bold text-gray-800">
                        {hasActiveFilters ? filteredEntries.length : totalCount}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
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