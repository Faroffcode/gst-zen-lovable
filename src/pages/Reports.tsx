import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Download, Calendar, TrendingUp } from "lucide-react";

const Reports = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            View GST reports, sales analytics, and business insights.
          </p>
        </div>
        <Button className="bg-gradient-primary hover:shadow-glow">
          <Download className="h-4 w-4 mr-2" />
          Export Reports
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-elegant transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              GST Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Monthly GST collection by tax rates
            </p>
            <Button variant="outline" className="w-full">
              View GST Report
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-elegant transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Sales Register
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Detailed sales transactions and revenue
            </p>
            <Button variant="outline" className="w-full">
              View Sales Report
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-elegant transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Stock Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Current stock levels and movements
            </p>
            <Button variant="outline" className="w-full">
              View Stock Report
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Reports coming soon</p>
            <p className="mb-4">Advanced reporting features will be available once you connect to a database.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;