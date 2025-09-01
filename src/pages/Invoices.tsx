import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Search, Filter, Download } from "lucide-react";
import { Input } from "@/components/ui/input";

const Invoices = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Invoice Management</h1>
          <p className="text-muted-foreground">
            Create, manage, and track your GST invoices.
          </p>
        </div>
        <Button className="bg-gradient-primary hover:shadow-glow">
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invoices by number, customer..."
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Invoice History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No invoices found</p>
            <p className="mb-4">Create your first GST compliant invoice.</p>
            <Button className="bg-gradient-primary">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Invoice
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Invoices;