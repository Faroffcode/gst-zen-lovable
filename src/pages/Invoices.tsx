import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Search, Filter, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useInvoices, Invoice, useInvoice } from "@/hooks/useInvoices";
import { CreateInvoiceDialog } from "@/components/invoices/CreateInvoiceDialog";
import { InvoiceTable } from "@/components/invoices/InvoiceTable";
import { ViewInvoiceDialog } from "@/components/invoices/ViewInvoiceDialog";
import { EditInvoiceDialog } from "@/components/invoices/EditInvoiceDialog";
import { DeleteInvoiceDialog } from "@/components/invoices/DeleteInvoiceDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { generateInvoicePDF, downloadInvoiceHTML } from "@/lib/invoice-pdf";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Invoices = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
  const [deleteInvoice, setDeleteInvoice] = useState<{ id: string; number: string } | null>(null);
  const { data: invoices = [], isLoading } = useInvoices();
  const { toast } = useToast();

  // Filter invoices by search query
  const filteredInvoices = invoices.filter(invoice =>
    invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (invoice.customer?.name && invoice.customer.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (invoice.customer?.gstin && invoice.customer.gstin.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleEdit = (invoice: Invoice) => {
    setEditInvoice(invoice);
  };

  const handleDelete = (invoiceId: string) => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (invoice) {
      setDeleteInvoice({ 
        id: invoiceId, 
        number: invoice.invoice_number 
      });
    }
  };

  const handleView = (invoice: Invoice) => {
    setViewInvoice(invoice);
  };

  const handleDownload = async (invoice: Invoice) => {
    try {
      // Fetch detailed invoice data including items
      const { data: detailedInvoice, error } = await supabase
        .from("invoices")
        .select(`
          *,
          customer:customers(*),
          invoice_items(
            *,
            product:products(name, sku, unit)
          )
        `)
        .eq("id", invoice.id)
        .single();
      
      if (error || !detailedInvoice) {
        throw new Error('Failed to fetch invoice details');
      }

      // Try to generate PDF, fallback to HTML if failed
      try {
        await generateInvoicePDF(detailedInvoice, detailedInvoice.invoice_items || []);
        toast({
          title: "Success",
          description: "Invoice PDF is being generated...",
        });
      } catch (pdfError) {
        console.warn('PDF generation failed, falling back to HTML:', pdfError);
        downloadInvoiceHTML(detailedInvoice, detailedInvoice.invoice_items || []);
        toast({
          title: "Downloaded",
          description: "Invoice downloaded as HTML file",
        });
      }
    } catch (error: any) {
      console.error('Download failed:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to download invoice",
        variant: "destructive",
      });
    }
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

      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invoices by number, customer..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" className="w-full sm:w-auto">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
        <Button variant="outline" className="w-full sm:w-auto">
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
              onDownload={handleDownload}
            />
          )}
        </CardContent>
      </Card>
      
      <ViewInvoiceDialog
        open={!!viewInvoice}
        onOpenChange={(open) => !open && setViewInvoice(null)}
        invoice={viewInvoice}
        onDownload={handleDownload}
      />
      
      <EditInvoiceDialog
        open={!!editInvoice}
        onOpenChange={(open) => !open && setEditInvoice(null)}
        invoice={editInvoice}
      />
      
      <DeleteInvoiceDialog
        open={!!deleteInvoice}
        onOpenChange={(open) => !open && setDeleteInvoice(null)}
        invoiceId={deleteInvoice?.id || null}
        invoiceNumber={deleteInvoice?.number || null}
      />
    </div>
  );
};

export default Invoices;