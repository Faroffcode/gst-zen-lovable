import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Search, Filter, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useInvoices, Invoice } from "@/hooks/useInvoices";
import { CreateInvoiceDialog } from "@/components/invoices/CreateInvoiceDialog";
import { InvoiceTable } from "@/components/invoices/InvoiceTable";
import { Skeleton } from "@/components/ui/skeleton";

const Invoices = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: invoices = [], isLoading } = useInvoices();

  // Filter invoices by search query
  const filteredInvoices = invoices.filter(invoice =>
    invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (invoice.customer?.name && invoice.customer.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (invoice.customer?.gstin && invoice.customer.gstin.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleEdit = (invoice: Invoice) => {
    // TODO: Implement edit functionality
    console.log("Edit invoice:", invoice);
  };

  const handleDelete = (invoiceId: string) => {
    // TODO: Implement delete functionality
    console.log("Delete invoice:", invoiceId);
  };

  const handleView = (invoice: Invoice) => {
    // TODO: Implement view functionality
    console.log("View invoice:", invoice);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Invoice Management</h1>
          <p className="text-muted-foreground">
            Create, manage, and track your GST invoices.
          </p>
        </div>
        <CreateInvoiceDialog />
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invoices by number, customer..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">
                {invoices.length === 0 ? "No invoices found" : "No matching invoices"}
              </p>
              <p className="mb-4">
                {invoices.length === 0 
                  ? "Create your first GST compliant invoice."
                  : "Try adjusting your search criteria."
                }
              </p>
              {invoices.length === 0 && <CreateInvoiceDialog />}
            </div>
          ) : (
            <InvoiceTable
              invoices={filteredInvoices}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={handleView}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Invoices;