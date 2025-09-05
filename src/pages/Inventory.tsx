import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Filter, Download, Package, X, Tag, ArrowUpDown, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProducts, useProductsByCategory, Product } from "@/hooks/useProducts";
import { CategoryTabs } from "@/components/inventory/CategoryTabs";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { AddProductDialog } from "@/components/inventory/AddProductDialog";
import { EditProductDialog } from "@/components/inventory/EditProductDialog";
import { ViewProductDialog } from "@/components/inventory/ViewProductDialog";
import { DeleteConfirmDialog } from "@/components/inventory/DeleteConfirmDialog";
import { StockRegisterDialog } from "@/components/inventory/StockRegisterDialog";
import { CategoryManagementDialog } from "@/components/inventory/CategoryManagementDialog";
import StockMovements from "@/components/inventory/StockMovements";
import StockAlerts from "@/components/inventory/StockAlerts";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const Inventory = () => {
  // State for navigation and search
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeTab, setActiveTab] = useState("current-stock");
  const [searchQuery, setSearchQuery] = useState("");
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [stockRegisterProduct, setStockRegisterProduct] = useState<Product | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showCategoryManagement, setShowCategoryManagement] = useState(false);

  // Filter states - Stock levels, price range, tax rate, and status
  // Allows comprehensive filtering of products by multiple criteria
  const [stockRange, setStockRange] = useState({ min: "", max: "" });
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [taxRateFilter, setTaxRateFilter] = useState<"all" | "5" | "12" | "18" | "28">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [stockLevel, setStockLevel] = useState<"all" | "low" | "out" | "normal">("all");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20); // Show 20 products per page

  const { data: allProducts = [], isLoading } = useProducts();
  const { data: filteredProducts = [] } = useProductsByCategory(selectedCategory);

  // Comprehensive filter with search query and filter criteria with memoization for performance
  // Searches across: product names, SKUs, HSN codes, and applies various filters
  const searchFilteredProducts = useMemo(() => {
    let filtered = filteredProducts;

    // Apply search filter
    if (searchQuery.trim()) {
      const searchTerm = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.sku.toLowerCase().includes(searchTerm) ||
        (product.hsn_code && product.hsn_code.includes(searchTerm))
      );
    }

    // Apply stock range filter
    if (stockRange.min) {
      filtered = filtered.filter(product => 
        product.current_stock >= parseFloat(stockRange.min)
      );
    }
    if (stockRange.max) {
      filtered = filtered.filter(product => 
        product.current_stock <= parseFloat(stockRange.max)
      );
    }

    // Apply price range filter
    if (priceRange.min) {
      filtered = filtered.filter(product => 
        product.unit_price >= parseFloat(priceRange.min)
      );
    }
    if (priceRange.max) {
      filtered = filtered.filter(product => 
        product.unit_price <= parseFloat(priceRange.max)
      );
    }

    // Apply tax rate filter
    if (taxRateFilter !== "all") {
      filtered = filtered.filter(product => 
        product.tax_rate === parseFloat(taxRateFilter)
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(product => {
        if (statusFilter === "active") {
          return product.status === "active";
        } else if (statusFilter === "inactive") {
          return product.status === "inactive";
        }
        return true;
      });
    }

    // Apply stock level filter
    if (stockLevel !== "all") {
      filtered = filtered.filter(product => {
        if (stockLevel === "out") {
          return product.current_stock === 0;
        } else if (stockLevel === "low") {
          return product.current_stock > 0 && product.current_stock <= product.min_stock;
        } else if (stockLevel === "normal") {
          return product.current_stock > product.min_stock;
        }
        return true;
      });
    }

    return filtered;
  }, [filteredProducts, searchQuery, stockRange, priceRange, taxRateFilter, statusFilter, stockLevel]);

  // Pagination logic
  const totalPages = Math.ceil(searchFilteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = searchFilteredProducts.slice(startIndex, endIndex);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, stockRange, priceRange, taxRateFilter, statusFilter, stockLevel]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return stockRange.min || stockRange.max || priceRange.min || priceRange.max || 
           taxRateFilter !== "all" || statusFilter !== "all" || stockLevel !== "all";
  }, [stockRange, priceRange, taxRateFilter, statusFilter, stockLevel]);

  // Clear all filters
  const clearFilters = () => {
    setStockRange({ min: "", max: "" });
    setPriceRange({ min: "", max: "" });
    setTaxRateFilter("all");
    setStatusFilter("all");
    setStockLevel("all");
  };

  const handleEdit = (product: Product) => {
    setEditProduct(product);
  };

  const handleDelete = (productId: string) => {
    const product = filteredProducts.find(p => p.id === productId);
    if (product) {
      setDeleteProduct(product);
    }
  };

  const handleView = (product: Product) => {
    setViewProduct(product);
  };

  const handleStockRegister = (product: Product) => {
    setStockRegisterProduct(product);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventory Management</h1>
          <p className="text-muted-foreground text-base leading-relaxed">
            Manage your agricultural products, stock levels, and pricing efficiently.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2">
            <Label htmlFor="status-filter" className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Status:
            </Label>
            <Select defaultValue="all">
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto flex items-center justify-center gap-2">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export Report</span>
                <span className="sm:hidden">Export</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Export inventory data to PDF or Excel</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full sm:w-auto flex items-center justify-center gap-2"
                onClick={() => setShowCategoryManagement(true)}
              >
                <Tag className="h-4 w-4" />
                <span className="hidden sm:inline">Manage Categories</span>
                <span className="sm:hidden">Categories</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add, edit, or delete product categories</p>
            </TooltipContent>
          </Tooltip>
          <AddProductDialog />
        </div>
      </div>

      {/* Category Tabs */}
      <CategoryTabs
        products={allProducts}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />


      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <TabsList className="grid w-full sm:w-auto grid-cols-3">
              <TabsTrigger value="current-stock" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline">Current Stock</span>
                <span className="sm:hidden">Stock</span>
              </TabsTrigger>
              <TabsTrigger value="stock-movements" className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4" />
                <span className="hidden sm:inline">Stock Movements</span>
                <span className="sm:hidden">Movements</span>
              </TabsTrigger>
              <TabsTrigger value="stock-alerts" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="hidden sm:inline">Stock Alerts</span>
                <span className="sm:hidden">Alerts</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center w-full lg:w-auto">
            <div className="relative flex-1 sm:flex-none sm:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products by name, SKU, HSN..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Dialog open={showFilters} onOpenChange={setShowFilters}>
              <DialogTrigger asChild>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" className="relative flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      <span>Filters</span>
                      {hasActiveFilters && (
                        <Badge 
                          variant="secondary" 
                          className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-purple-100 text-purple-700"
                        >
                          !
                        </Badge>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Filter products by stock level, price, tax rate, and status</p>
                  </TooltipContent>
                </Tooltip>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filter Products
                  </DialogTitle>
                  <DialogDescription>
                    Apply filters to narrow down your product list.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6 py-4">
                  {/* Stock Range Filter */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Stock Range</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Min</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={stockRange.min}
                          onChange={(e) => setStockRange(prev => ({ ...prev, min: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Max</Label>
                        <Input
                          type="number"
                          placeholder="1000"
                          value={stockRange.max}
                          onChange={(e) => setStockRange(prev => ({ ...prev, max: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Price Range Filter */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Price Range (₹)</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Min</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={priceRange.min}
                          onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Max</Label>
                        <Input
                          type="number"
                          placeholder="10000"
                          value={priceRange.max}
                          onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Stock Level Filter */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Stock Level</Label>
                    <Select value={stockLevel} onValueChange={(value: "all" | "low" | "out" | "normal") => setStockLevel(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Stock Levels</SelectItem>
                        <SelectItem value="normal">Normal Stock</SelectItem>
                        <SelectItem value="low">Low Stock</SelectItem>
                        <SelectItem value="out">Out of Stock</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tax Rate Filter */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Tax Rate</Label>
                    <Select value={taxRateFilter} onValueChange={(value: "all" | "5" | "12" | "18" | "28") => setTaxRateFilter(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Tax Rates</SelectItem>
                        <SelectItem value="5">5%</SelectItem>
                        <SelectItem value="12">12%</SelectItem>
                        <SelectItem value="18">18%</SelectItem>
                        <SelectItem value="28">28%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status Filter */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Status</Label>
                    <Select value={statusFilter} onValueChange={(value: "all" | "active" | "inactive") => setStatusFilter(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={clearFilters}
                    className="flex-1"
                    disabled={!hasActiveFilters}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                  <Button 
                    onClick={() => setShowFilters(false)}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    Apply Filters
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="pt-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-purple-700">Active Filters:</span>
                {stockRange.min && (
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                    Min Stock: {stockRange.min}
                    <X 
                      className="ml-1 h-3 w-3 cursor-pointer" 
                      onClick={() => setStockRange(prev => ({ ...prev, min: "" }))}
                    />
                  </Badge>
                )}
                {stockRange.max && (
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                    Max Stock: {stockRange.max}
                    <X 
                      className="ml-1 h-3 w-3 cursor-pointer" 
                      onClick={() => setStockRange(prev => ({ ...prev, max: "" }))}
                    />
                  </Badge>
                )}
                {priceRange.min && (
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                    Min Price: ₹{priceRange.min}
                    <X 
                      className="ml-1 h-3 w-3 cursor-pointer" 
                      onClick={() => setPriceRange(prev => ({ ...prev, min: "" }))}
                    />
                  </Badge>
                )}
                {priceRange.max && (
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                    Max Price: ₹{priceRange.max}
                    <X 
                      className="ml-1 h-3 w-3 cursor-pointer" 
                      onClick={() => setPriceRange(prev => ({ ...prev, max: "" }))}
                    />
                  </Badge>
                )}
                {stockLevel !== "all" && (
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                    {stockLevel === "normal" ? "Normal Stock" : 
                     stockLevel === "low" ? "Low Stock" : "Out of Stock"}
                    <X 
                      className="ml-1 h-3 w-3 cursor-pointer" 
                      onClick={() => setStockLevel("all")}
                    />
                  </Badge>
                )}
                {taxRateFilter !== "all" && (
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                    Tax: {taxRateFilter}%
                    <X 
                      className="ml-1 h-3 w-3 cursor-pointer" 
                      onClick={() => setTaxRateFilter("all")}
                    />
                  </Badge>
                )}
                {statusFilter !== "all" && (
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                    Status: {statusFilter === "active" ? "Active" : "Inactive"}
                    <X 
                      className="ml-1 h-3 w-3 cursor-pointer" 
                      onClick={() => setStatusFilter("all")}
                    />
                  </Badge>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearFilters}
                  className="text-purple-700 hover:text-purple-800 hover:bg-purple-100"
                >
                  Clear All
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <TabsContent value="current-stock" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  <span className="text-xl font-semibold">Current Inventory</span>
                </div>
                <div className="text-sm font-medium text-muted-foreground bg-gray-100 px-3 py-1 rounded-full">
                  {searchFilteredProducts.length} of {filteredProducts.length} products
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InventoryTable
                products={paginatedProducts}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleView}
                onStockRegister={handleStockRegister}
              />
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-muted-foreground bg-gray-50 px-3 py-2 rounded-lg">
                      Showing <span className="font-semibold text-gray-900">{startIndex + 1}</span> to <span className="font-semibold text-gray-900">{Math.min(endIndex, searchFilteredProducts.length)}</span> of <span className="font-semibold text-gray-900">{searchFilteredProducts.length}</span> products
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
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stock-movements" className="space-y-6">
          <StockMovements />
        </TabsContent>

        <TabsContent value="stock-alerts" className="space-y-6">
          <StockAlerts />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <EditProductDialog
        product={editProduct}
        open={!!editProduct}
        onOpenChange={(open) => !open && setEditProduct(null)}
      />
      
      <ViewProductDialog
        product={viewProduct}
        open={!!viewProduct}
        onOpenChange={(open) => !open && setViewProduct(null)}
      />
      
      <DeleteConfirmDialog
        product={deleteProduct}
        open={!!deleteProduct}
        onOpenChange={(open) => !open && setDeleteProduct(null)}
      />
      
      <StockRegisterDialog
        product={stockRegisterProduct}
        open={!!stockRegisterProduct}
        onOpenChange={(open) => !open && setStockRegisterProduct(null)}
      />
      
      <CategoryManagementDialog
        open={showCategoryManagement}
        onOpenChange={setShowCategoryManagement}
      />
      </div>
    </TooltipProvider>
  );
};

export default Inventory;