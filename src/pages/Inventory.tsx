import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Filter, Download, Package, X, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProducts, useProductsByCategory, Product } from "@/hooks/useProducts";
import { InventoryStats } from "@/components/inventory/InventoryStats";
import { CategoryTabs } from "@/components/inventory/CategoryTabs";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { AddProductDialog } from "@/components/inventory/AddProductDialog";
import { EditProductDialog } from "@/components/inventory/EditProductDialog";
import { ViewProductDialog } from "@/components/inventory/ViewProductDialog";
import { DeleteConfirmDialog } from "@/components/inventory/DeleteConfirmDialog";
import { StockRegisterDialog } from "@/components/inventory/StockRegisterDialog";
import { CategoryManagementDialog } from "@/components/inventory/CategoryManagementDialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage your agricultural products, stock levels, and pricing.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Select defaultValue="all">
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="w-full sm:w-auto">
            <Download className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Export Report</span>
            <span className="sm:hidden">Export</span>
          </Button>
          <Button 
            variant="outline" 
            className="w-full sm:w-auto"
            onClick={() => setShowCategoryManagement(true)}
          >
            <Tag className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Manage Categories</span>
            <span className="sm:hidden">Categories</span>
          </Button>
          <AddProductDialog />
        </div>
      </div>

      {/* Category Tabs */}
      <CategoryTabs
        products={allProducts}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {/* Stats Cards */}
      <InventoryStats products={searchFilteredProducts} />

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <TabsList>
            <TabsTrigger value="current-stock">Current Stock</TabsTrigger>
            <TabsTrigger value="stock-movements">Stock Movements</TabsTrigger>
            <TabsTrigger value="stock-alerts">Stock Alerts</TabsTrigger>
          </TabsList>

          <div className="flex gap-4 items-center w-full sm:w-auto">
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
                <Button variant="outline" size="sm" className="relative">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  {hasActiveFilters && (
                    <Badge 
                      variant="secondary" 
                      className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-purple-100 text-purple-700"
                    >
                      !
                    </Badge>
                  )}
                </Button>
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

        <TabsContent value="current-stock" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Current Inventory
                </div>
                <div className="text-sm font-normal text-muted-foreground">
                  {searchFilteredProducts.length} of {filteredProducts.length} products
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InventoryTable
                products={searchFilteredProducts}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleView}
                onStockRegister={handleStockRegister}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stock-movements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stock Movements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Stock movements feature coming soon</p>
                <p>Track all stock transactions and movements here.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stock-alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stock Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Stock alerts feature coming soon</p>
                <p>Set up automated alerts for low stock and out of stock items.</p>
              </div>
            </CardContent>
          </Card>
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
  );
};

export default Inventory;