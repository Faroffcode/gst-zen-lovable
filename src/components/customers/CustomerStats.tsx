import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, UserX, TrendingUp } from "lucide-react";
import { Customer } from "@/hooks/useCustomers";

interface CustomerStatsProps {
  customers: Customer[];
}

export const CustomerStats = ({ customers }: CustomerStatsProps) => {
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => c.status === 'active').length;
  const inactiveCustomers = customers.filter(c => c.status === 'inactive').length;
  const customersWithGSTIN = customers.filter(c => c.gstin && c.gstin.trim() !== '').length;

  const stats = [
    {
      title: "Total Customers",
      value: totalCustomers,
      icon: Users,
      change: null,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Active Customers",
      value: activeCustomers,
      icon: UserCheck,
      change: null,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Inactive Customers",
      value: inactiveCustomers,
      icon: UserX,
      change: null,
      color: "text-gray-600",
      bgColor: "bg-gray-50",
    },
    {
      title: "With GSTIN",
      value: customersWithGSTIN,
      icon: TrendingUp,
      change: totalCustomers > 0 ? `${Math.round((customersWithGSTIN / totalCustomers) * 100)}%` : "0%",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
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
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.change && (
                <div className="flex items-center pt-1">
                  <Badge variant="secondary" className="text-xs">
                    {stat.change}
                  </Badge>
                  <p className="text-xs text-muted-foreground ml-2">
                    of total
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};