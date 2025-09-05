import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, DollarSign, Package, Users, FileText, AlertTriangle, Eye, IndianRupee, XCircle, ShoppingCart, TrendingUp as TrendingUpIcon } from "lucide-react";
import { CreateInvoiceDialog } from "@/components/invoices/CreateInvoiceDialog";
import { useProducts } from "@/hooks/useProducts";
import { useInvoices } from "@/hooks/useInvoices";
import { useCustomers } from "@/hooks/useCustomers";
import { useStockTransactions } from "@/hooks/useStockLedger";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";


const StatCard = ({
  title,
  value,
  change,
  icon: Icon,
  type = "currency"
}: {
  title: string;
  value: number | string;
  change?: number;
  icon: React.ComponentType<{ className?: string }>;
  type?: "currency" | "number";
}) => {
  const isPositive = change ? change > 0 : true;
  const formattedValue = typeof value === "number" && type === "currency" 
    ? `₹${value.toLocaleString()}` 
    : value.toString();
  
  return <Card className="hover:shadow-elegant transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formattedValue}</div>
        {change !== undefined && (
          <div className="flex items-center text-sm mt-1">
            {isPositive ? <TrendingUp className="h-4 w-4 text-success mr-1" /> : <TrendingDown className="h-4 w-4 text-destructive mr-1" />}
            <span className={isPositive ? "text-success" : "text-destructive"}>
              {Math.abs(change)}%
            </span>
            <span className="text-muted-foreground ml-1">from yesterday</span>
          </div>
        )}
      </CardContent>
    </Card>;
};
export const Dashboard = () => {
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: invoices = [], isLoading: invoicesLoading } = useInvoices();
  const { data: customers = [], isLoading: customersLoading } = useCustomers();
  const { data: stockTransactions = [], isLoading: stockLoading } = useStockTransactions();

  // Calculate inventory statistics
  const inventoryStats = useMemo(() => {
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, product) => sum + product.current_stock, 0);
    const totalInventoryValue = products.reduce(
      (sum, product) => sum + (product.current_stock * product.unit_price),
      0
    );
    const lowStockItems = products.filter(product => product.current_stock <= product.min_stock);
    const outOfStockItems = products.filter(product => product.current_stock === 0);
    
    return {
      totalProducts,
      totalStock,
      totalInventoryValue,
      lowStockItems,
      outOfStockItems,
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStockItems.length
    };
  }, [products]);

  // Calculate recent activity statistics
  const activityStats = useMemo(() => {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const todayInvoices = invoices.filter(invoice => 
      new Date(invoice.created_at) >= todayStart
    );
    
    const todayRevenue = todayInvoices.reduce((sum, invoice) => sum + invoice.total_amount, 0);
    
    const recentPurchases = stockTransactions.filter(transaction => 
      transaction.transaction_type === 'purchase' && 
      new Date(transaction.created_at) >= todayStart
    );
    
    return {
      todayInvoices: todayInvoices.length,
      todayRevenue,
      totalCustomers: customers.length,
      recentPurchases: recentPurchases.length
    };
  }, [invoices, customers, stockTransactions]);

  // Calculate purchase statistics
  const purchaseStats = useMemo(() => {
    const purchaseTransactions = stockTransactions.filter(transaction => 
      transaction.transaction_type === 'purchase'
    );
    
    const totalPurchaseQuantity = purchaseTransactions.reduce(
      (sum, transaction) => sum + Math.abs(transaction.quantity_delta), 0
    );
    
    const thisMonth = new Date();
    thisMonth.setDate(1);
    
    const thisMonthPurchases = purchaseTransactions.filter(transaction => 
      new Date(transaction.created_at) >= thisMonth
    );
    
    const thisMonthQuantity = thisMonthPurchases.reduce(
      (sum, transaction) => sum + Math.abs(transaction.quantity_delta), 0
    );
    
    return {
      totalPurchases: purchaseTransactions.length,
      totalQuantity: totalPurchaseQuantity,
      thisMonthPurchases: thisMonthPurchases.length,
      thisMonthQuantity
    };
  }, [stockTransactions]);

  // Get top products by stock quantity
  const topProducts = useMemo(() => {
    return products
      .sort((a, b) => b.current_stock - a.current_stock)
      .slice(0, 5);
  }, [products]);

  if (productsLoading || invoicesLoading || customersLoading || stockLoading) {
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }
  return <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your business today.
          </p>
        </div>
        <CreateInvoiceDialog />
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Overview Card */}
        <Card className="hover:shadow-elegant transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Package className="h-4 w-4" />
              Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-center">
              <div className="text-center p-3 bg-gradient-subtle rounded-lg min-w-40">
                <div className="text-xl font-bold text-primary">{inventoryStats.totalProducts}</div>
                <div className="text-xs text-muted-foreground">Total Products</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-2 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-center mb-1">
                  <Users className="h-3 w-3 text-blue-600 mr-1" />
                </div>
                <div className="text-base font-bold text-blue-600">{activityStats.totalCustomers}</div>
                <div className="text-xs text-muted-foreground">Customers</div>
              </div>
              <div className="text-center p-2 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-center mb-1">
                  <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                </div>
                <div className="text-base font-bold text-green-600">{inventoryStats.totalStock}</div>
                <div className="text-xs text-muted-foreground">In Stock</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Purchase Stats Card */}
        <Card className="hover:shadow-elegant transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ShoppingCart className="h-3 w-3" />
              Purchases
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUpIcon className="h-3 w-3 text-green-600" />
                <span className="text-xs font-medium text-muted-foreground">Total</span>
              </div>
              <span className="text-base font-bold">{purchaseStats.totalPurchases}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-3 w-3 text-blue-600" />
                <span className="text-xs font-medium text-muted-foreground">This Month</span>
              </div>
              <span className="text-base font-bold">{purchaseStats.thisMonthPurchases}</span>
            </div>
            <div className="pt-1 border-t">
              <div className="text-center">
                <div className="text-xs font-bold text-primary">{purchaseStats.totalQuantity}</div>
                <div className="text-xs text-muted-foreground">Total Quantity</div>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Inventory Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Package className="h-4 w-4" />
              Inventory Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-center">
              <div className="text-center p-3 bg-gradient-subtle rounded-lg min-w-40">
                <div className="text-xl font-bold text-primary">{inventoryStats.totalStock}</div>
                <div className="text-xs text-muted-foreground">Total Items in Stock</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-2 bg-warning/10 border border-warning/20 rounded-lg">
                <div className="text-base font-bold text-warning">{inventoryStats.lowStockCount}</div>
                <div className="text-xs text-muted-foreground">Low Stock</div>
              </div>
              <div className="text-center p-2 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="text-base font-bold text-destructive">{inventoryStats.outOfStockCount}</div>
                <div className="text-xs text-muted-foreground">Out of Stock</div>
              </div>
            </div>
            
            {inventoryStats.lowStockCount > 0 && (
              <div className="mt-4 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                <div className="flex items-center gap-2 text-warning">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">
                    {inventoryStats.lowStockCount} items are running low on stock
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Products by Stock */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm">Top Products by Stock</CardTitle>
            <Button variant="ghost" size="sm" className="h-7 px-2">
              <Eye className="h-3 w-3 mr-1" />
              View All
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {topProducts.length > 0 ? (
              topProducts.map((product, index) => (
                <div key={product.id} className="flex items-center justify-between py-1">
                  <div className="flex-1">
                    <div className="font-medium truncate text-sm">{product.name}</div>
                    <div className="text-xs text-muted-foreground">
                      SKU: {product.sku} | {product.category}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-base">{product.current_stock}</div>
                    <div className="text-xs text-muted-foreground">{product.unit}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-3 text-muted-foreground">
                <Package className="h-6 w-6 mx-auto mb-1 opacity-50" />
                <p className="text-xs">No products found</p>
                <p className="text-xs">Add some products to see them here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {inventoryStats.lowStockItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
              Low Stock Alert ({inventoryStats.lowStockItems.length} items)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {inventoryStats.lowStockItems.slice(0, 5).map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Current: {product.current_stock} {product.unit} | Minimum: {product.min_stock} {product.unit}
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    product.current_stock === 0 
                      ? 'bg-destructive/10 text-destructive' 
                      : 'bg-warning/10 text-warning'
                  }`}>
                    {product.current_stock === 0 ? 'Out of Stock' : 'Low Stock'}
                  </div>
                </div>
              ))}
              {inventoryStats.lowStockItems.length > 5 && (
                <div className="text-center pt-2">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View All {inventoryStats.lowStockItems.length} Items
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>;
};