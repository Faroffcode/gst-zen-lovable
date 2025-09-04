import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Download, Send, X } from "lucide-react";
import { Invoice, InvoiceItem, useInvoice } from "@/hooks/useInvoices";
import { Customer } from "@/hooks/useCustomers";
import { Skeleton } from "@/components/ui/skeleton";
import { generateInvoicePDF, sendInvoiceToTelegram } from "@/lib/invoice-pdf";
import { useToast } from "@/hooks/use-toast";

interface ViewInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
  onDownload?: (invoice: Invoice) => void;
}

export const ViewInvoiceDialog = ({ open, onOpenChange, invoice, onDownload }: ViewInvoiceDialogProps) => {
  const { data: detailedInvoice, isLoading } = useInvoice(invoice?.id || "");
  const { toast } = useToast();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };



  const handleDownload = async () => {
    if (detailedInvoice && onDownload) {
      onDownload(detailedInvoice);
    } else if (detailedInvoice) {
      // Direct download without cloud upload
      generateInvoicePDF(
        detailedInvoice, 
        detailedInvoice.invoice_items || []
      ).then(result => {
        if (result.success) {
          toast({
            title: "Success",
            description: "Invoice PDF downloaded successfully!",
          });
        }
      }).catch(error => {
        toast({
          title: "Error",
          description: "Failed to generate invoice PDF",
          variant: "destructive",
        });
      });
    }
  };

  const handleSendToTelegram = async () => {
    if (!detailedInvoice) return;
    
    // Show loading state
    const loadingToast = toast({
      title: "Sending to Telegram",
      description: "Please wait while we send the invoice...",
    });

    // Check if Telegram integration is enabled
    const storageSettings = localStorage.getItem('storageSettings');
    if (!storageSettings) {
      toast({
        title: "Telegram Not Configured",
        description: "Please configure Telegram in Storage Settings first.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const settings = JSON.parse(storageSettings);
      if (!settings.enableCloudSync || settings.cloudProvider !== 'telegram' || 
          !settings.telegramBotToken || !settings.telegramChatId) {
        toast({
          title: "Telegram Not Configured",
          description: "Please configure Telegram in Storage Settings first.",
          variant: "destructive",
        });
        return;
      }
      
      // Send invoice to Telegram
      const success = await sendInvoiceToTelegram(
        detailedInvoice,
        detailedInvoice.invoice_items || [],
        {
          telegramBotToken: settings.telegramBotToken,
          telegramChatId: settings.telegramChatId
        }
      );
      
      if (success) {
        toast({
          title: "Success",
          description: "Invoice sent to Telegram successfully!",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to send invoice to Telegram. Please check your settings.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error sending invoice to Telegram:', error);
      toast({
        title: "Error",
        description: "Failed to send invoice to Telegram: " + (error as Error).message,
        variant: "destructive",
      });
    }
  };

  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="text-2xl font-bold">Invoice Details</DialogTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSendToTelegram}>
              <Send className="h-4 w-4 mr-2" />
              Send to Telegram
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : detailedInvoice ? (
          <div>
            {/* Invoice Header */}
            <div className="p-6 mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800 mb-1">BIO TECH CENTRE</h1>
                  <p className="text-sm text-gray-600 mb-6">Professional</p>
                </div>
                <div className="text-right">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Invoice</h2>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div><span className="font-medium">Invoice No #:</span> {detailedInvoice.invoice_number}</div>
                    <div><span className="font-medium">Invoice Date:</span> {formatDate(detailedInvoice.invoice_date)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Billing Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-3">BILLED TO</h3>
                <div className="space-y-1">
                  <div className="font-bold text-base">
                    {detailedInvoice.customer?.name || detailedInvoice.guest_name || "Guest Customer"}
                  </div>
                  {((detailedInvoice.customer as Customer)?.phone || detailedInvoice.guest_phone) && (
                    <div className="text-sm text-gray-600">
                      Phone: {(detailedInvoice.customer as Customer)?.phone || detailedInvoice.guest_phone}
                    </div>
                  )}
                  {((detailedInvoice.customer as Customer)?.address || detailedInvoice.guest_address) && (
                    <div className="text-sm text-gray-600">
                      {(detailedInvoice.customer as Customer)?.address || detailedInvoice.guest_address}
                    </div>
                  )}
                  {((detailedInvoice.customer as Customer)?.city || (detailedInvoice.customer as Customer)?.state || (detailedInvoice.customer as Customer)?.pincode) && (
                    <div className="text-sm text-gray-600">
                      {[(detailedInvoice.customer as Customer)?.city, (detailedInvoice.customer as Customer)?.state, (detailedInvoice.customer as Customer)?.pincode].filter(Boolean).join(', ')}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-3">BILLED BY</h3>
                <div className="space-y-1">
                  <div className="font-bold text-base">Ezazul Haque</div>
                  <div className="text-sm text-gray-600">Nalhati to Rajgram Road, Vill :- Kaigoria, Post :- Diha, West Bengal, India - 731220</div>
                  <div className="text-sm text-gray-600 space-y-1 mt-2">
                    <div><span className="font-medium">GSTIN:</span> 19ADOPH4023K1ZD</div>
                    <div><span className="font-medium">PAN:</span> ADOPH4023K</div>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Invoice Items */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-800 mb-4">ITEMS</h3>
              <div className="border border-gray-300 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100 text-gray-800">
                      <th className="text-left p-2 text-xs font-medium border-r border-gray-300">Item</th>
                      <th className="text-center p-2 text-xs font-medium border-r border-gray-300">HSN/SAC</th>
                      <th className="text-center p-2 text-xs font-medium border-r border-gray-300">Quantity</th>
                      <th className="text-center p-2 text-xs font-medium border-r border-gray-300">Unit</th>
                      <th className="text-right p-2 text-xs font-medium border-r border-gray-300">Rate</th>
                      <th className="text-right p-2 text-xs font-medium border-r border-gray-300">Amount</th>
                      <th className="text-center p-2 text-xs font-medium border-r border-gray-300">GST Rate</th>
                      <th className="text-right p-2 text-xs font-medium border-r border-gray-300">CGST</th>
                      <th className="text-right p-2 text-xs font-medium border-r border-gray-300">SGST</th>
                      <th className="text-right p-2 text-xs font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailedInvoice.invoice_items?.map((item: InvoiceItem, index: number) => {
                      // Calculate GST breakdown for each item
                      const rateWithoutGST = item.unit_price / (1 + item.tax_rate / 100);
                      const taxableValue = item.quantity * rateWithoutGST;
                      const totalAmount = item.quantity * item.unit_price;
                      const taxAmount = totalAmount - taxableValue;
                      const cgstAmount = taxAmount / 2;
                      const sgstAmount = taxAmount / 2;
                      
                      return (
                        <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="p-2 text-xs border-r border-gray-300">{item.product?.name || 'Custom Product'}</td>
                          <td className="p-2 text-xs text-center border-r border-gray-300">{item.product?.hsn_code || '2160'}</td>
                          <td className="p-2 text-xs text-center border-r border-gray-300">{item.quantity}</td>
                          <td className="p-2 text-xs text-center border-r border-gray-300">{item.product?.unit || 'Nos'}</td>
                          <td className="p-2 text-xs text-right border-r border-gray-300">{formatCurrency(rateWithoutGST)}</td>
                          <td className="p-2 text-xs text-right border-r border-gray-300">{formatCurrency(taxableValue)}</td>
                          <td className="p-2 text-xs text-center border-r border-gray-300">{item.tax_rate}%</td>
                          <td className="p-2 text-xs text-right border-r border-gray-300">{formatCurrency(cgstAmount)}</td>
                          <td className="p-2 text-xs text-right border-r border-gray-300">{formatCurrency(sgstAmount)}</td>
                          <td className="p-2 text-xs text-right font-medium">{formatCurrency(totalAmount)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Invoice Summary */}
            <div className="flex justify-end mb-8">
              <div className="w-80">
                {(() => {
                  // Calculate GST-compliant totals from invoice items
                  let totalTaxableValue = 0;
                  let totalCGST = 0;
                  let totalSGST = 0;
                  let grandTotal = 0;
                  
                  detailedInvoice.invoice_items?.forEach((item: InvoiceItem) => {
                    const rateWithoutGST = item.unit_price / (1 + item.tax_rate / 100);
                    const itemTaxableValue = item.quantity * rateWithoutGST;
                    const itemTotalAmount = item.quantity * item.unit_price;
                    const itemTaxAmount = itemTotalAmount - itemTaxableValue;
                    
                    totalTaxableValue += itemTaxableValue;
                    totalCGST += itemTaxAmount / 2;
                    totalSGST += itemTaxAmount / 2;
                    grandTotal += itemTotalAmount;
                  });
                  
                  return (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-700 py-1">
                        <span>Amount:</span>
                        <span className="font-medium">{formatCurrency(totalTaxableValue)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-700 py-1">
                        <span>CGST:</span>
                        <span className="font-medium">{formatCurrency(totalCGST)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-700 py-1">
                        <span>SGST:</span>
                        <span className="font-medium">{formatCurrency(totalSGST)}</span>
                      </div>
                      <div className="border-t border-gray-300 pt-2">
                        <div className="flex justify-between text-lg font-bold text-gray-800">
                          <span>Total (INR):</span>
                          <span>{formatCurrency(detailedInvoice.total_amount)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Bank Details */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Bank Details</h3>
              <div className="grid grid-cols-3 gap-x-8 gap-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Account Name:</span>
                  <div className="text-gray-800">Ezazul Haque</div>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Account Number:</span>
                  <div className="text-gray-800">000000000000</div>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Account Type:</span>
                  <div className="text-gray-800">Current</div>
                </div>
                <div>
                  <span className="font-medium text-gray-600">IFSC:</span>
                  <div className="text-gray-800">SBIN0008540</div>
                </div>
                <div className="col-span-2">
                  <span className="font-medium text-gray-600">Bank:</span>
                  <div className="text-gray-800">State Bank of India</div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {detailedInvoice.notes && (
              <div className="mt-6 p-4 rounded-lg border border-gray-200" style={{backgroundColor: '#f8fafc'}}>
                <h4 className="font-medium mb-2 text-gray-800">Notes:</h4>
                <p className="text-sm text-gray-700 whitespace-pre-line">
                  {detailedInvoice.notes}
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 text-center">
              <div className="text-gray-800 p-4 bg-gray-100 rounded">
                <p className="font-semibold text-base">Thank you for business with us!</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Invoice not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};