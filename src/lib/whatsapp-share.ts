import { Invoice, InvoiceItem } from "@/hooks/useInvoices";
import { generateInvoicePDFBlob } from "./invoice-pdf";

// WhatsApp sharing utility functions
export const shareInvoiceToWhatsApp = async (invoice: Invoice, invoiceItems: InvoiceItem[]) => {
  try {
    // Generate PDF blob
    const pdfBlob = await generateInvoicePDFBlob(invoice, invoiceItems);
    
    // Create a temporary URL for the PDF
    const pdfUrl = URL.createObjectURL(pdfBlob);
    
    // Create filename
    const invoiceNumber = invoice.invoice_number.replace('INV-', '');
    const btcNumber = `BTC-${invoiceNumber}`;
    const customerName = invoice.customer?.name || invoice.guest_name || 'Customer';
    const filename = `${btcNumber} ${customerName}.pdf`;
    
    // Create a temporary link element to download the PDF
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL
    setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
    
    // Prepare WhatsApp message
    const message = `📄 *Invoice ${btcNumber}*\n\n` +
      `Customer: ${customerName}\n` +
      `Date: ${new Date(invoice.invoice_date).toLocaleDateString('en-IN')}\n` +
      `Amount: ₹${invoice.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n\n` +
      `Please find the invoice PDF attached.`;
    
    // Create WhatsApp share URL
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    
    // Open WhatsApp in a new tab
    window.open(whatsappUrl, '_blank');
    
    return { success: true };
  } catch (error) {
    console.error('Error sharing invoice to WhatsApp:', error);
    return { success: false, error: error as Error };
  }
};

// Alternative method: Share invoice details as text (without PDF)
export const shareInvoiceDetailsToWhatsApp = (invoice: Invoice, invoiceItems: InvoiceItem[]) => {
  try {
    const invoiceNumber = invoice.invoice_number.replace('INV-', '');
    const btcNumber = `BTC-${invoiceNumber}`;
    const customerName = invoice.customer?.name || invoice.guest_name || 'Customer';
    
    // Calculate totals
    let totalTaxableValue = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    
    invoiceItems.forEach(item => {
      const rateWithoutGST = item.unit_price / (1 + item.tax_rate / 100);
      const itemTaxableValue = item.quantity * rateWithoutGST;
      const itemTotalAmount = item.quantity * item.unit_price;
      const itemTaxAmount = itemTotalAmount - itemTaxableValue;
      
      totalTaxableValue += itemTaxableValue;
      totalCGST += itemTaxAmount / 2;
      totalSGST += itemTaxAmount / 2;
    });
    
    // Create detailed message
    const message = `📄 *INVOICE ${btcNumber}*\n\n` +
      `*From:* EZAZUL HAQUE\n` +
      `Proprietor of BIO TECH CENTRE\n` +
      `GSTIN: 19ADOPH4023K1ZD\n\n` +
      `*To:* ${customerName}\n` +
      `${invoice.customer?.phone || invoice.guest_phone ? `Phone: ${invoice.customer?.phone || invoice.guest_phone}\n` : ''}` +
      `${invoice.customer?.gstin || invoice.guest_gstin ? `GSTIN: ${invoice.customer?.gstin || invoice.guest_gstin}\n` : ''}` +
      `\n*Invoice Date:* ${new Date(invoice.invoice_date).toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}\n\n` +
      `*Items:*\n` +
      invoiceItems.map(item => 
        `• ${item.product?.name || 'Custom Product'} - Qty: ${item.quantity} - ₹${item.unit_price.toFixed(2)}`
      ).join('\n') +
      `\n\n*Summary:*\n` +
      `Taxable Value: ₹${totalTaxableValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n` +
      `CGST: ₹${totalCGST.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n` +
      `SGST: ₹${totalSGST.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n` +
      `*Total: ₹${invoice.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}*\n\n` +
      `*Bank Details:*\n` +
      `Account: Ezazul Haque\n` +
      `Bank: State Bank of India\n` +
      `IFSC: SBIN0008540\n\n` +
      `Thank you for your business! 🙏`;
    
    // Create WhatsApp share URL
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    
    // Open WhatsApp in a new tab
    window.open(whatsappUrl, '_blank');
    
    return { success: true };
  } catch (error) {
    console.error('Error sharing invoice details to WhatsApp:', error);
    return { success: false, error: error as Error };
  }
};
