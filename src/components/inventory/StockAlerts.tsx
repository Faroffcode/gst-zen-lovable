import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/useProducts";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Package, AlertCircle, TrendingDown } from "lucide-react";
import React, { useState, useMemo } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const StockAlerts = () => {
  const { data: products, isLoading, error } = useProducts();
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Show 10 alerts per page

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Stock Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
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
            <AlertTriangle className="h-5 w-5" />
            Stock Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Error loading stock alerts</p>
            <p>Please try again later.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!products || products.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Stock Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No products found</p>
            <p>Add some products to start tracking stock levels.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filter products based on stock levels
  const lowStockProducts = products.filter(product => 
    product.current_stock > 0 && product.current_stock <= product.min_stock
  );
  
  const outOfStockProducts = products.filter(product => 
    product.current_stock === 0
  );

  const allAlertProducts = [...lowStockProducts, ...outOfStockProducts];

  const filteredProducts = filter === "all" ? allAlertProducts :
                          filter === "low" ? lowStockProducts :
                          outOfStockProducts;

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, startIndex, endIndex]);

  // Reset to first page when filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  const getAlertIcon = (product: any) => {
    if (product.current_stock === 0) {
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    } else {
      return <AlertTriangle className="h-4 w-4 text-orange-600" />;
    }
  };

  const getAlertBadge = (product: any) => {
    if (product.current_stock === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    } else {
      return <Badge variant="outline" className="text-orange-600 border-orange-600">Low Stock</Badge>;
    }
  };

  const getStockPercentage = (product: any) => {
    if (product.min_stock === 0) return 100;
    return Math.min((product.current_stock / product.min_stock) * 100, 100);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Stock Alerts
        </CardTitle>
        <div className="flex gap-2 mt-4">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All ({allAlertProducts.length})
          </Button>
          <Button
            variant={filter === "low" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("low")}
          >
            Low Stock ({lowStockProducts.length})
          </Button>
          <Button
            variant={filter === "out" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("out")}
          >
            Out of Stock ({outOfStockProducts.length})
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {filteredProducts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <TrendingDown className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">
              {filter === "all" ? "No stock alerts" : 
               filter === "low" ? "No low stock items" : "No out of stock items"}
            </p>
            <p>
              {filter === "all" ? "All products have adequate stock levels." :
               filter === "low" ? "No products are running low on stock." : 
               "No products are currently out of stock."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedProducts.map((product) => (
              <div key={product.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex-shrink-0">
                  {getAlertIcon(product)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {product.name}
                    </h4>
                    {getAlertBadge(product)}
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                    <span>SKU: {product.sku}</span>
                    <span>•</span>
                    <span>Category: {product.category}</span>
                    <span>•</span>
                    <span>Unit: {product.unit}</span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Current Stock</span>
                        <span>{product.current_stock} {product.unit}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            product.current_stock === 0 ? 'bg-red-500' : 'bg-orange-500'
                          }`}
                          style={{ width: `${getStockPercentage(product)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 mt-1">
                    Min. Stock: {product.min_stock} {product.unit}
                  </div>
                </div>
                
                <div className="flex-shrink-0 text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {product.current_stock} / {product.min_stock}
                  </div>
                  <div className="text-xs text-gray-500">
                    {product.current_stock === 0 ? '0%' : `${Math.round(getStockPercentage(product))}%`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length} alerts
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

export default StockAlerts;
