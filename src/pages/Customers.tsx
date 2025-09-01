import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";

const Customers = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Customer Management</h1>
          <p className="text-muted-foreground">
            Manage your customer database and GST information.
          </p>
        </div>
        <Button className="bg-gradient-primary hover:shadow-glow">
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers by name, GSTIN, phone..."
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Customer Database
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No customers found</p>
            <p className="mb-4">Add your first customer to get started with invoicing.</p>
            <Button className="bg-gradient-primary">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Customer
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Customers;