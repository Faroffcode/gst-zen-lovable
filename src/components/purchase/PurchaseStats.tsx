import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, ShoppingCart, Package, DollarSign } from "lucide-react";
import { StockTransaction } from "@/hooks/useStockLedger";

interface PurchaseStatsProps {
  transactions: StockTransaction[];
}

export const PurchaseStats = ({ transactions }: PurchaseStatsProps) => {
  // Calculate stats from purchase transactions
  const totalPurchases = transactions.length;
  
  const totalValue = 0; // Unit cost removed, no value calculation

  const totalQuantity = transactions.reduce((sum, transaction) => {
    return sum + transaction.quantity_delta;
  }, 0);

  // Calculate this month's purchases
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const thisMonthPurchases = transactions.filter(transaction => {
    const transactionDate = new Date(transaction.created_at);
    return transactionDate.getMonth() === currentMonth && 
           transactionDate.getFullYear() === currentYear;
  });

  const thisMonthValue = 0; // Unit cost removed, no value calculation

  const stats = [
    {
      title: "Total Purchases",
      value: totalPurchases.toString(),
      icon: ShoppingCart,
      description: "All time purchases",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "This Month",
      value: thisMonthPurchases.length.toString(),
      icon: TrendingUp,
      description: "Purchases this month",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Total Quantity",
      value: totalQuantity.toLocaleString('en-IN'),
      icon: Package,
      description: "Items purchased",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "This Month Qty",
      value: thisMonthPurchases.reduce((sum, transaction) => sum + transaction.quantity_delta, 0).toLocaleString('en-IN'),
      icon: Package,
      description: "Quantity this month",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="hover:shadow-elegant transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};