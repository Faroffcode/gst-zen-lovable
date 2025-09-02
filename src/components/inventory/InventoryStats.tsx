import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, IndianRupee, AlertTriangle, XCircle } from "lucide-react";
import { Product } from "@/hooks/useProducts";

interface InventoryStatsProps {
  products: Product[];
}

export const InventoryStats = ({ products }: InventoryStatsProps) => {
  const totalProducts = products.length;
  const totalInventoryValue = products.reduce(
    (sum, product) => sum + (product.current_stock * product.unit_price),
    0
  );
  const lowStockItems = products.filter(product => product.current_stock <= product.min_stock).length;
  const outOfStockItems = products.filter(product => product.current_stock === 0).length;

  const stats = [
    {
      title: "Total Products",
      value: totalProducts,
      description: "All categories",
      icon: Package,
      color: "text-primary",
    },
    {
      title: "Total Inventory Value",
      value: `₹${totalInventoryValue.toFixed(2)}`,
      description: "All categories",
      icon: IndianRupee,
      color: "text-success",
    },
    {
      title: "Low Stock Items",
      value: lowStockItems,
      description: "All categories below minimum",
      icon: AlertTriangle,
      color: "text-warning",
    },
    {
      title: "Out of Stock",
      value: outOfStockItems,
      description: "All categories zero inventory",
      icon: XCircle,
      color: "text-destructive",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <Icon className={`h-5 w-5 ${stat.color}`} />
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