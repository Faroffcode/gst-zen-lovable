import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, TrendingUp, Package, DollarSign, Users, BarChart3 } from "lucide-react";
import { useInvoices } from "@/hooks/useInvoices";
import { useProducts } from "@/hooks/useProducts";
import { useStockTransactions } from "@/hooks/useStockLedger";
import { useState, useMemo } from "react";
import { formatCurrency } from "@/lib/template-processor";
import { LowStockDialog } from "@/components/reports/LowStockDialog";

const Reports = () => {
  const [activeReport, setActiveReport] = useState<'sales' | 'stock'>('sales');
  const [showLowStockDialog, setShowLowStockDialog] = useState(false);
  
  const { data: invoices = [], isLoading: invoicesLoading } = useInvoices();
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: stockTransactions = [], isLoading: stockLoading } = useStockTransactions();

  // Calculate sales statistics for current date only
  const salesStats = useMemo(() => {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Filter invoices for today only
    const todayInvoices = invoices.filter(invoice => 
      invoice.invoice_date.startsWith(today)
    );
    
    const totalRevenue = todayInvoices.reduce((sum, invoice) => sum + invoice.total_amount, 0);
    const totalInvoices = todayInvoices.length;
    const averageOrderValue = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;
    
    // Monthly revenue (last 30 days) - keeping this for context
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const monthlyRevenue = invoices
      .filter(invoice => new Date(invoice.invoice_date) >= thirtyDaysAgo)
      .reduce((sum, invoice) => sum + invoice.total_amount, 0);

    return {
      totalRevenue,
      totalInvoices,
      averageOrderValue,
      monthlyRevenue,
      todayInvoices
    };
  }, [invoices]);

  // Calculate stock statistics
  const stockStats = useMemo(() => {
    const totalProducts = products.length;
    const totalStockValue = products.reduce((sum, product) => 
      sum + (product.current_stock * product.unit_price), 0
    );
    const lowStockProducts = products.filter(product => 
      product.current_stock <= product.min_stock
    ).length;
    const outOfStockProducts = products.filter(product => 
      product.current_stock === 0
    ).length;

    return {
      totalProducts,
      totalStockValue,
      lowStockProducts,
      outOfStockProducts
    };
  }, [products]);

  // Recent sales transactions (today only)
  const recentSales = useMemo(() => {
    return salesStats.todayInvoices
      .slice(0, 10)
      .map(invoice => ({
        ...invoice,
        customerName: invoice.customer?.name || invoice.guest_name || 'Guest',
        date: new Date(invoice.invoice_date).toLocaleDateString('en-IN')
      }));
  }, [salesStats.todayInvoices]);

  // Recent stock movements
  const recentStockMovements = useMemo(() => {
    return stockTransactions
      .slice(0, 10)
      .map(transaction => ({
        ...transaction,
        date: new Date(transaction.created_at).toLocaleDateString('en-IN'),
        time: new Date(transaction.created_at).toLocaleTimeString('en-IN', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      }));
  }, [stockTransactions]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  if (invoicesLoading || productsLoading || stockLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Reports & Analytics</h1>
            <p className="text-muted-foreground">Loading real-time data...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <p className="text-muted-foreground">
          Real-time business insights and analytics
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Today's Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(salesStats.totalRevenue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(salesStats.monthlyRevenue)} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Today's Invoices</p>
                <p className="text-2xl font-bold">{salesStats.totalInvoices}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg: {formatCurrency(salesStats.averageOrderValue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Stock Value</p>
                <p className="text-2xl font-bold">{formatCurrency(stockStats.totalStockValue)}</p>
              </div>
              <Package className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stockStats.totalProducts} products
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
          onClick={() => setShowLowStockDialog(true)}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Low Stock</p>
                <p className="text-2xl font-bold text-orange-600">{stockStats.lowStockProducts}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stockStats.outOfStockProducts} out of stock
            </p>
            <p className="text-xs text-blue-600 mt-1 font-medium">
              Click to view details
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Report Tabs */}
      <div className="flex gap-2">
        <Button
          variant={activeReport === 'sales' ? 'default' : 'outline'}
          onClick={() => setActiveReport('sales')}
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          Sales Register
        </Button>
        <Button
          variant={activeReport === 'stock' ? 'default' : 'outline'}
          onClick={() => setActiveReport('stock')}
        >
          <Package className="h-4 w-4 mr-2" />
          Stock Summary
        </Button>
      </div>

      {/* Sales Register */}
      {activeReport === 'sales' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Sales Register - Today's Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentSales.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No sales today</p>
                <p>No invoices have been generated today. Create an invoice to see today's sales data.</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentSales.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-mono text-sm">
                          {invoice.invoice_number}
                        </TableCell>
                        <TableCell>{invoice.customerName}</TableCell>
                        <TableCell>{invoice.date}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(invoice.total_amount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-green-600 border-green-200">
                            Completed
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stock Summary */}
      {activeReport === 'stock' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Stock Summary - Recent Movements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentStockMovements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No stock movements</p>
                <p>Stock movements will appear here when you make purchases or sales.</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Reference</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentStockMovements.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">
                          {transaction.product?.name || 'Unknown Product'}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline"
                            className={
                              transaction.transaction_type === 'purchase' 
                                ? 'text-green-600 border-green-200'
                                : transaction.transaction_type === 'sale'
                                ? 'text-red-600 border-red-200'
                                : 'text-blue-600 border-blue-200'
                            }
                          >
                            {transaction.transaction_type}
                          </Badge>
                        </TableCell>
                        <TableCell className={
                          transaction.quantity_delta > 0 ? 'text-green-600' : 'text-red-600'
                        }>
                          {transaction.quantity_delta > 0 ? '+' : ''}{transaction.quantity_delta}
                        </TableCell>
                        <TableCell>{transaction.date}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {transaction.reference_no || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <LowStockDialog
        open={showLowStockDialog}
        onOpenChange={setShowLowStockDialog}
        products={products}
      />
    </div>
  );
};

export default Reports;