import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCustomerInvoices, Invoice } from "@/hooks/useInvoices";
import { Customer } from "@/hooks/useCustomers";
import { FileText, Calendar, DollarSign, Eye, Download } from "lucide-react";
import { formatCurrency } from "@/lib/template-processor";
import { useState } from "react";
import { ViewInvoiceDialog } from "@/components/invoices/ViewInvoiceDialog";
import { generateInvoicePDF, downloadInvoiceHTML } from "@/lib/invoice-pdf";
import { useToast } from "@/hooks/use-toast";

interface CustomerInvoicesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
}

export const CustomerInvoicesDialog = ({ open, onOpenChange, customer }: CustomerInvoicesDialogProps) => {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const { data: invoices = [], isLoading } = useCustomerInvoices(customer?.id || "");
  const { toast } = useToast();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDownload = async (invoice: Invoice) => {
    try {
      await generateInvoicePDF(invoice);
    } catch (error) {
      console.error('PDF generation failed, trying HTML download:', error);
      downloadInvoiceHTML(invoice);
    }
  };

  const handleView = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
  };

  // Calculate customer statistics
  const totalInvoices = invoices.length;
  const totalAmount = invoices.reduce((sum, invoice) => sum + invoice.total_amount, 0);
  const averageOrderValue = totalInvoices > 0 ? totalAmount / totalInvoices : 0;

  if (!customer) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
              <FileText className="h-7 w-7" />
              Invoices for {customer.name}
            </DialogTitle>
            <div className="text-sm text-gray-600 space-y-1">
              <div><span className="font-medium">Email:</span> {customer.email}</div>
              <div><span className="font-medium">Phone:</span> {customer.phone}</div>
              {customer.gstin && <div><span className="font-medium">GSTIN:</span> {customer.gstin}</div>}
            </div>
          </DialogHeader>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Customer Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-6 w-6 text-blue-600" />
                    <span className="text-sm font-medium text-blue-600">Total Invoices</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{totalInvoices}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-6 w-6 text-green-600" />
                    <span className="text-sm font-medium text-green-600">Total Amount</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(totalAmount)}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-6 w-6 text-purple-600" />
                    <span className="text-sm font-medium text-purple-600">Average Order</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(averageOrderValue)}</p>
                </div>
              </div>

              {/* Invoices Table */}
              {invoices.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">No invoices found</p>
                  <p>This customer hasn't made any purchases yet.</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-mono text-sm">
                            {invoice.invoice_number}
                          </TableCell>
                          <TableCell>{formatDate(invoice.invoice_date)}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(invoice.total_amount)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-green-600 border-green-200">
                              Completed
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end flex-wrap">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleView(invoice)}
                                title="View Invoice"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                <span className="text-xs">View</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownload(invoice)}
                                title="Download PDF"
                              >
                                <Download className="h-4 w-4 mr-1" />
                                <span className="text-xs">Download</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ViewInvoiceDialog
        open={!!selectedInvoice}
        onOpenChange={(open) => !open && setSelectedInvoice(null)}
        invoice={selectedInvoice}
        onDownload={handleDownload}
      />
    </>
  );
};
