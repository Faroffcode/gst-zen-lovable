import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, Eye, Download, CheckSquare, Square, MessageCircle } from "lucide-react";
import { Invoice } from "@/hooks/useInvoices";
import { Checkbox } from "@/components/ui/checkbox";
import { shareInvoiceToWhatsApp } from "@/lib/whatsapp-share";
import { useToast } from "@/hooks/use-toast";

interface InvoiceTableProps {
  invoices: Invoice[];
  onDelete: (invoiceId: string) => void;
  onView: (invoice: Invoice) => void;
  onDownload: (invoice: Invoice) => void;
  selectedInvoices: Set<string>;
  onSelectInvoice: (invoiceId: string) => void;
  onSelectAll: () => void;
}

export const InvoiceTable = ({ 
  invoices, 
  onDelete,
  onView, 
  onDownload,
  selectedInvoices,
  onSelectInvoice,
  onSelectAll
}: InvoiceTableProps) => {
  const { toast } = useToast();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const handleShareToWhatsApp = async (invoice: Invoice) => {
    try {
      const result = await shareInvoiceToWhatsApp(
        invoice,
        invoice.invoice_items || []
      );
      
      if (result.success) {
        if (result.fallback) {
          toast({
            title: "Success",
            description: "PDF downloaded! WhatsApp opened with message. Please attach the PDF manually.",
          });
        } else {
          toast({
            title: "Success",
            description: "Invoice PDF shared to WhatsApp successfully!",
          });
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to share invoice to WhatsApp. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error sharing invoice to WhatsApp:', error);
      toast({
        title: "Error",
        description: "Failed to share invoice to WhatsApp: " + (error as Error).message,
        variant: "destructive",
      });
    }
  };


  if (invoices.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground">
          <div className="text-lg font-medium mb-2">No invoices found</div>
          <p>No invoices match your search criteria.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectedInvoices.size === invoices.length && invoices.length > 0}
                onCheckedChange={onSelectAll}
                aria-label="Select all invoices"
              />
            </TableHead>
            <TableHead>Invoice #</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead className="hidden md:table-cell">Date</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id} className={selectedInvoices.has(invoice.id) ? "bg-[#eff3ff]" : ""}>
              <TableCell>
                <Checkbox
                  checked={selectedInvoices.has(invoice.id)}
                  onCheckedChange={() => onSelectInvoice(invoice.id)}
                  aria-label={`Select invoice ${invoice.invoice_number}`}
                />
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-mono font-medium">{invoice.invoice_number}</div>
                  <div className="md:hidden text-sm text-muted-foreground">
                    {formatDate(invoice.invoice_date)}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">
                    {invoice.customer?.name || invoice.guest_name || "Guest Customer"}
                  </div>
                  {(invoice.customer?.gstin || invoice.guest_gstin) && (
                    <div className="text-sm text-muted-foreground font-mono">
                      GSTIN: {invoice.customer?.gstin || invoice.guest_gstin}
                    </div>
                  )}
                  {invoice.guest_email && (
                    <div className="text-sm text-muted-foreground">
                      {invoice.guest_email}
                    </div>
                  )}
                  {invoice.guest_phone && (
                    <div className="text-sm text-muted-foreground">
                      {invoice.guest_phone}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">{formatDate(invoice.invoice_date)}</TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(invoice.total_amount)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end flex-wrap">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onView(invoice)}
                    className="hidden sm:inline-flex"
                    title="View Invoice"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    <span className="text-xs">View</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShareToWhatsApp(invoice)}
                    className="hidden sm:inline-flex text-green-600 hover:text-green-700 hover:bg-green-50"
                    title="Share via WhatsApp"
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    <span className="text-xs">WhatsApp</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDownload(invoice)}
                    className="hidden sm:inline-flex"
                    title="Download PDF"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    <span className="text-xs">Download</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(invoice.id)}
                    className="text-destructive hover:text-destructive"
                    title="Delete Invoice"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    <span className="text-xs">Delete</span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};