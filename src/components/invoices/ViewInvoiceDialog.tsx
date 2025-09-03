import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Download, Printer, Send, X } from "lucide-react";
import { Invoice, InvoiceItem, useInvoice } from "@/hooks/useInvoices";
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

  const handlePrint = () => {
    window.print();
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
            description: "Invoice PDF is being generated...",
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
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
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
          <div className="print:bg-white print:text-black">
            {/* Invoice Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl mb-6 border border-blue-100 print:bg-white print:border print:border-gray-300">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-semibold">BTC</div>
                    <div>
                      <h2 className="text-xl font-bold text-blue-900">Bio Tech Centre</h2>
                      <p className="text-sm text-blue-700">Professional Bio-Technology Solutions</p>
                    </div>
                  </div>
                  <h1 className="text-3xl font-bold text-blue-800 mb-2">TAX INVOICE</h1>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-mono font-semibold bg-white px-3 py-1 rounded border">{detailedInvoice.invoice_number}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-800">{formatCurrency(detailedInvoice.total_amount)}</div>
                  <div className="text-sm text-blue-600 font-medium">Total Amount</div>
                </div>
              </div>
            </div>

            {/* Invoice Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Billing Information */}
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold border-b-2 border-blue-600 pb-2 text-blue-800">Bill To</h3>
                <div className="space-y-2">
                  <div className="font-medium text-lg">
                    {detailedInvoice.customer?.name || detailedInvoice.guest_name || "Guest Customer"}
                  </div>
                  {(detailedInvoice.customer?.email || detailedInvoice.guest_email) && (
                    <div className="text-sm text-muted-foreground">
                      {detailedInvoice.customer?.email || detailedInvoice.guest_email}
                    </div>
                  )}
                  {(detailedInvoice.customer?.phone || detailedInvoice.guest_phone) && (
                    <div className="text-sm text-muted-foreground">
                      Phone: {detailedInvoice.customer?.phone || detailedInvoice.guest_phone}
                    </div>
                  )}
                  {(detailedInvoice.customer?.address || detailedInvoice.guest_address) && (
                    <div className="text-sm text-muted-foreground whitespace-pre-line">
                      {detailedInvoice.customer?.address || detailedInvoice.guest_address}
                    </div>
                  )}
                  {(detailedInvoice.customer?.gstin || detailedInvoice.guest_gstin) && (
                    <div className="text-sm">
                      <span className="font-medium">GSTIN:</span> 
                      <span className="font-mono ml-2">
                        {detailedInvoice.customer?.gstin || detailedInvoice.guest_gstin}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Invoice Information */}
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold border-b-2 border-blue-600 pb-2 text-blue-800">Invoice Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Invoice Number:</span>
                    <span className="font-mono font-medium">{detailedInvoice.invoice_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Invoice Date:</span>
                    <span>{formatDate(detailedInvoice.invoice_date)}</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Invoice Items */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4 text-blue-800">Items</h3>
              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white grid grid-cols-12 gap-2 p-3 text-xs font-medium print:bg-gray-100 print:text-black">
                  <div className="col-span-3">Product (Description)</div>
                  <div className="col-span-1 text-center">HSN</div>
                  <div className="col-span-1 text-center">Unit</div>
                  <div className="col-span-1 text-center">Qty</div>
                  <div className="col-span-1 text-right">Rate/Unit</div>
                  <div className="col-span-1 text-right">Total</div>
                  <div className="col-span-1 text-right">Taxable Value</div>
                  <div className="col-span-1 text-right">CGST</div>
                  <div className="col-span-1 text-right">SGST</div>
                  <div className="col-span-1 text-right">Amount</div>
                </div>
                {detailedInvoice.invoice_items?.map((item: InvoiceItem, index: number) => {
                  // Calculate GST breakdown for each item
                  const rateWithoutGST = item.unit_price / (1 + item.tax_rate / 100);
                  const taxableValue = item.quantity * rateWithoutGST;
                  const totalAmount = item.quantity * item.unit_price;
                  const taxAmount = totalAmount - taxableValue;
                  const cgstAmount = taxAmount / 2;
                  const sgstAmount = taxAmount / 2;
                  
                  return (
                    <div key={item.id} className={`grid grid-cols-12 gap-2 p-3 text-xs hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <div className="col-span-3">
                        <div className="font-medium text-sm">{item.product?.name || 'Custom Product'}</div>
                        <div className="text-muted-foreground text-xs">
                          SKU: {item.product?.sku || 'N/A'}
                        </div>
                      </div>
                      <div className="col-span-1 text-center text-xs">
                        {item.product?.hsn_code || 'N/A'}
                      </div>
                      <div className="col-span-1 text-center text-xs">
                        {item.product?.unit || 'N/A'}
                      </div>
                      <div className="col-span-1 text-center text-xs">
                        {item.quantity}
                      </div>
                      <div className="col-span-1 text-right text-xs">
                        {formatCurrency(item.unit_price)}
                      </div>
                      <div className="col-span-1 text-right text-xs font-medium">
                        {formatCurrency(totalAmount)}
                      </div>
                      <div className="col-span-1 text-right text-xs">
                        {formatCurrency(taxableValue)}
                      </div>
                      <div className="col-span-1 text-right text-xs">
                        {formatCurrency(cgstAmount)}
                        <div className="text-muted-foreground">({(item.tax_rate/2).toFixed(1)}%)</div>
                      </div>
                      <div className="col-span-1 text-right text-xs">
                        {formatCurrency(sgstAmount)}
                        <div className="text-muted-foreground">({(item.tax_rate/2).toFixed(1)}%)</div>
                      </div>
                      <div className="col-span-1 text-right text-xs font-semibold">
                        {formatCurrency(totalAmount)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Invoice Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200 shadow-sm print:bg-white print:border print:border-gray-300">
              <div className="flex justify-end">
                <div className="w-full max-w-md space-y-3">
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
                      <>
                        <h4 className="font-semibold text-blue-800 border-b-2 border-blue-300 pb-2 mb-3">Tax Summary</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm text-gray-700">
                            <span>Total Taxable Value:</span>
                            <span className="font-medium">{formatCurrency(totalTaxableValue)}</span>
                          </div>
                          <div className="flex justify-between text-sm text-gray-700">
                            <span>Total CGST:</span>
                            <span className="font-medium">{formatCurrency(totalCGST)}</span>
                          </div>
                          <div className="flex justify-between text-sm text-gray-700">
                            <span>Total SGST:</span>
                            <span className="font-medium">{formatCurrency(totalSGST)}</span>
                          </div>
                          <Separator className="bg-blue-200" />
                          <div className="flex justify-between text-lg font-bold text-blue-800">
                            <span>Grand Total:</span>
                            <span>{formatCurrency(detailedInvoice.total_amount)}</span>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Notes */}
            {detailedInvoice.notes && (
              <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200 print:bg-white print:border print:border-gray-300">
                <h4 className="font-medium mb-2 text-amber-800">Notes:</h4>
                <p className="text-sm text-amber-700 whitespace-pre-line">
                  {detailedInvoice.notes}
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 pt-6 border-t-2 border-blue-600 text-center print:fixed print:bottom-0">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-lg">
                <p className="font-semibold text-lg">Thank you for choosing Bio Tech Centre!</p>
                <p className="text-blue-100 text-sm mt-2">Your trusted partner in bio-technology solutions</p>
                <p className="text-blue-200 text-xs mt-1">Generated on {new Date().toLocaleDateString('en-IN')}</p>
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