import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Filter, Download, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProducts, useProductsByCategory } from "@/hooks/useProducts";
import { InventoryStats } from "@/components/inventory/InventoryStats";
import { CategoryTabs } from "@/components/inventory/CategoryTabs";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { AddProductDialog } from "@/components/inventory/AddProductDialog";
import { Skeleton } from "@/components/ui/skeleton";

const Inventory = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeTab, setActiveTab] = useState("current-stock");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: allProducts = [], isLoading } = useProducts();
  const { data: filteredProducts = [] } = useProductsByCategory(selectedCategory);

  // Filter products by search query
  const searchFilteredProducts = filteredProducts.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.hsn_code && product.hsn_code.includes(searchQuery))
  );

  const handleEdit = (product: any) => {
    // TODO: Implement edit functionality
    console.log("Edit product:", product);
  };

  const handleDelete = (productId: string) => {
    // TODO: Implement delete functionality
    console.log("Delete product:", productId);
  };

  const handleView = (product: any) => {
    // TODO: Implement view functionality
    console.log("View product:", product);
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
        <div className="flex gap-3">
          <Select defaultValue="all">
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
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
      <InventoryStats products={filteredProducts} />

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
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>

        <TabsContent value="current-stock" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Current Inventory
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InventoryTable
                products={searchFilteredProducts}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleView}
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
    </div>
  );
};

export default Inventory;