import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, DollarSign, Package, Users, FileText, AlertTriangle, Eye } from "lucide-react";

// Mock data - in real app this would come from your backend
const mockData = {
  sales: {
    today: 18300,
    growth: 12.5
  },
  profit: {
    today: 2850,
    growth: 8.2
  },
  orders: {
    today: 15,
    growth: -2.3
  },
  customers: {
    total: 832,
    growth: 15.7
  },
  inventory: {
    inHand: 868,
    toReceive: 200,
    lowStock: 12
  },
  topProducts: [{
    name: "Premium Tea Bags",
    sold: 145,
    remaining: 55,
    price: 299
  }, {
    name: "Organic Coffee Beans",
    sold: 98,
    remaining: 32,
    price: 549
  }, {
    name: "Instant Noodles Pack",
    sold: 87,
    remaining: 23,
    price: 45
  }, {
    name: "Basmati Rice 5kg",
    sold: 76,
    remaining: 18,
    price: 680
  }],
  lowStockItems: [{
    name: "Tata Salt",
    remaining: 10,
    threshold: 50,
    status: "Critical"
  }, {
    name: "Refined Oil 1L",
    remaining: 15,
    threshold: 30,
    status: "Low"
  }, {
    name: "Wheat Flour 10kg",
    remaining: 8,
    threshold: 25,
    status: "Critical"
  }]
};
const StatCard = ({
  title,
  value,
  change,
  icon: Icon,
  type = "currency"
}: {
  title: string;
  value: number;
  change: number;
  icon: any;
  type?: "currency" | "number";
}) => {
  const isPositive = change > 0;
  const formattedValue = type === "currency" ? `₹${value.toLocaleString()}` : value.toLocaleString();
  return <Card className="hover:shadow-elegant transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formattedValue}</div>
        <div className="flex items-center text-sm mt-1">
          {isPositive ? <TrendingUp className="h-4 w-4 text-success mr-1" /> : <TrendingDown className="h-4 w-4 text-destructive mr-1" />}
          <span className={isPositive ? "text-success" : "text-destructive"}>
            {Math.abs(change)}%
          </span>
          <span className="text-muted-foreground ml-1">from yesterday</span>
        </div>
      </CardContent>
    </Card>;
};
export const Dashboard = () => {
  return <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your business today.
          </p>
        </div>
        <Button className="bg-gradient-primary hover:shadow-glow">
          <FileText className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      {/* Stats Overview */}
      

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
                <div className="text-2xl font-bold text-primary">{mockData.inventory.inHand}</div>
                <div className="text-sm text-muted-foreground">Quantity in Hand</div>
              </div>
              <div className="text-center p-4 bg-gradient-subtle rounded-lg">
                <div className="text-2xl font-bold text-info">{mockData.inventory.toReceive}</div>
                <div className="text-sm text-muted-foreground">To be Received</div>
              </div>
            </div>
            {mockData.inventory.lowStock > 0 && <div className="mt-4 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                <div className="flex items-center gap-2 text-warning">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">
                    {mockData.inventory.lowStock} items are running low on stock
                  </span>
                </div>
              </div>}
          </CardContent>
        </Card>

        {/* Top Selling Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Top Selling Products</CardTitle>
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockData.topProducts.map((product, index) => <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium truncate">{product.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Sold: {product.sold} | Remaining: {product.remaining}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">₹{product.price}</div>
                  </div>
                </div>)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {mockData.lowStockItems.length > 0 && <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockData.lowStockItems.map((item, index) => <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Remaining: {item.remaining} | Threshold: {item.threshold}
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${item.status === 'Critical' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'}`}>
                    {item.status}
                  </div>
                </div>)}
            </div>
          </CardContent>
        </Card>}
    </div>;
};