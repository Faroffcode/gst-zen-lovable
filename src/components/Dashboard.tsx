import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, DollarSign, Package, Users, FileText, AlertTriangle, Eye, IndianRupee, XCircle } from "lucide-react";
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
  icon: any;
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

  // Get top products by stock value
  const topProducts = useMemo(() => {
    return products
      .map(product => ({
        ...product,
        stockValue: product.current_stock * product.unit_price
      }))
      .sort((a, b) => b.stockValue - a.stockValue)
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Products"
          value={inventoryStats.totalProducts}
          icon={Package}
          type="number"
        />
        <StatCard
          title="Inventory Value"
          value={inventoryStats.totalInventoryValue}
          icon={IndianRupee}
          type="currency"
        />
        <StatCard
          title="Today's Revenue"
          value={activityStats.todayRevenue}
          icon={DollarSign}
          type="currency"
        />
        <StatCard
          title="Total Customers"
          value={activityStats.totalCustomers}
          icon={Users}
          type="number"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Inventory Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gradient-subtle rounded-lg">
                <div className="text-2xl font-bold text-primary">{inventoryStats.totalStock}</div>
                <div className="text-sm text-muted-foreground">Total Items in Stock</div>
              </div>
              <div className="text-center p-4 bg-gradient-subtle rounded-lg">
                <div className="text-2xl font-bold text-success">₹{inventoryStats.totalInventoryValue.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Value</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-center p-3 bg-warning/10 border border-warning/20 rounded-lg">
                <div className="text-lg font-bold text-warning">{inventoryStats.lowStockCount}</div>
                <div className="text-xs text-muted-foreground">Low Stock Items</div>
              </div>
              <div className="text-center p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="text-lg font-bold text-destructive">{inventoryStats.outOfStockCount}</div>
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

        {/* Top Products by Value */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Top Products by Stock Value</CardTitle>
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.length > 0 ? (
                topProducts.map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium truncate">{product.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Stock: {product.current_stock} {product.unit} | Unit Price: ₹{product.unit_price}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">₹{product.stockValue.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Total Value</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No products found</p>
                  <p className="text-xs">Add some products to see them here</p>
                </div>
              )}
            </div>
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