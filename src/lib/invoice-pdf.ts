import { Invoice, InvoiceItem } from "@/hooks/useInvoices";
import { getInvoiceSettings, formatCurrency, formatDate, processCustomTemplate } from "./template-processor";
import { useToast } from "@/hooks/use-toast";
import { sendFileToTelegram } from "@/lib/telegram";

// PDF generation utility using browser's print functionality and CSS
export const generateInvoicePDF = async (invoice: Invoice, invoiceItems: InvoiceItem[]) => {
  const settings = getInvoiceSettings();
  
  let htmlContent: string;

  // Check if custom template should be used
  if (settings.useCustomTemplate && settings.customTemplateFile) {
    try {
      htmlContent = await processCustomTemplate(settings.customTemplateFile, invoice, invoiceItems, settings);
    } catch (error) {
      console.error('Custom template processing failed:', error);
      // Fall back to default template
      htmlContent = generateDefaultTemplate(invoice, invoiceItems, settings);
    }
  } else {
    htmlContent = generateDefaultTemplate(invoice, invoiceItems, settings);
  }

  // Standard browser print
  printInvoice(htmlContent);
  return { success: true };
};

// Generate and return PDF as Blob
export const generateInvoicePDFBlob = async (invoice: Invoice, invoiceItems: InvoiceItem[]): Promise<Blob> => {
  const settings = getInvoiceSettings();
  
  let htmlContent: string;

  // Check if custom template should be used
  if (settings.useCustomTemplate && settings.customTemplateFile) {
    try {
      htmlContent = await processCustomTemplate(settings.customTemplateFile, invoice, invoiceItems, settings);
    } catch (error) {
      console.error('Custom template processing failed:', error);
      // Fall back to default template
      htmlContent = generateDefaultTemplate(invoice, invoiceItems, settings);
    }
  } else {
    htmlContent = generateDefaultTemplate(invoice, invoiceItems, settings);
  }

  // Convert HTML to PDF blob
  return await convertHtmlToPdfBlob(htmlContent);
};

// Helper function to convert HTML to PDF blob
const convertHtmlToPdfBlob = async (htmlContent: string): Promise<Blob> => {
  // Create a Blob with the HTML content
  const blob = new Blob([htmlContent], { type: 'text/html' });
  return blob;
};

// Helper function to print invoice using browser
const printInvoice = (htmlContent: string) => {
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    throw new Error('Unable to open print window. Please check your browser settings.');
  }

  // Write content to the print window
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  // Wait for content to load, then print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };
};

// Generate default template
const generateDefaultTemplate = (invoice: Invoice, invoiceItems: InvoiceItem[], settings: { companyName: string; companyTagline: string; logoText: string; footerText: string; primaryColor: string }): string => {
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice ${invoice.invoice_number}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.4;
          color: #1e293b;
          max-width: 100%;
          margin: 0;
          padding: 15px;
          background: white;
          font-size: 12px;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 15px;
        }
        
        .company-info {
          flex: 1;
        }
        
        .company-name {
          font-size: 1.8em;
          font-weight: bold;
          color: #1e293b;
          margin: 0 0 5px 0;
        }
        
        .company-tagline {
          color: #64748b;
          font-size: 0.9em;
          margin: 0;
        }
        
        .invoice-header {
          text-align: right;
        }
        
        .invoice-title {
          font-size: 1.8em;
          font-weight: bold;
          color: #1e293b;
          margin: 0 0 10px 0;
        }
        
        .invoice-details {
          text-align: right;
          line-height: 1.4;
        }
        
        .invoice-detail-row {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-bottom: 3px;
        }
        
        .invoice-label {
          font-weight: bold;
          color: #374151;
          font-size: 0.9em;
        }
        
        .invoice-value {
          color: #1e293b;
          font-size: 0.9em;
        }
        
        .billing-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        
        .billed-to, .billed-from {
          border: 1px solid #e5e7eb;
          padding: 12px;
          border-radius: 4px;
        }
        
        .section-title {
          font-size: 1.1em;
          font-weight: bold;
          color: #1e293b;
          margin-bottom: 8px;
          text-transform: uppercase;
        }
        
        .billing-info {
          line-height: 1.4;
        }
        
        .billing-name {
          font-size: 1em;
          font-weight: bold;
          margin-bottom: 5px;
          color: #1e293b;
        }
        
        .billing-address {
          color: #64748b;
          margin-bottom: 4px;
          font-size: 0.9em;
        }
        
        .gstin, .pan {
          font-family: 'Courier New', monospace;
          background: #f8fafc;
          padding: 2px 4px;
          border-radius: 2px;
          display: inline-block;
          margin: 2px 4px 2px 0;
          font-size: 0.8em;
        }
        
        .detail-row {
          display: flex;
          justify-content: space-between;
          border-bottom: 1px solid #f3f4f6;
          padding: 4px 0;
        }
        
        .detail-label {
          color: #6b7280;
        }
        
        .detail-value {
          font-weight: 500;
        }
        
        .items-section {
          margin-bottom: 20px;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          border: 1px solid #e5e7eb;
          font-size: 0.8em;
        }
        
        .items-table th {
          background: #f8fafc;
          color: #1e293b;
          padding: 6px 4px;
          text-align: center;
          font-weight: bold;
          font-size: 0.8em;
          border: 1px solid #e5e7eb;
        }
        
        .items-table td {
          padding: 6px 4px;
          border: 1px solid #e5e7eb;
          vertical-align: middle;
          text-align: center;
          font-size: 0.8em;
        }
        
        .items-table td:first-child {
          text-align: left;
          width: 20%;
        }
        
        .items-table td:nth-child(2) { width: 8%; }
        .items-table td:nth-child(3) { width: 8%; }
        .items-table td:nth-child(4) { width: 8%; }
        .items-table td:nth-child(5) { width: 10%; text-align: right; }
        .items-table td:nth-child(6) { width: 10%; text-align: right; }
        .items-table td:nth-child(7) { width: 8%; }
        .items-table td:nth-child(8) { width: 10%; text-align: right; }
        .items-table td:nth-child(9) { width: 10%; text-align: right; }
        .items-table td:nth-child(10) { width: 10%; text-align: right; }
        
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        
        .product-name {
          font-weight: 500;
          font-size: 0.8em;
        }
        
        .product-sku {
          font-size: 0.7em;
          color: #6b7280;
          font-family: 'Courier New', monospace;
        }
        
        .summary-section {
          display: flex;
          justify-content: flex-end;
          margin: 15px 0;
        }
        
        .summary-content {
          width: 250px;
          border: 1px solid #e5e7eb;
          padding: 10px;
        }
        
        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 3px 0;
          border-bottom: 1px solid #f3f4f6;
          font-size: 0.9em;
        }
        
        .summary-row:last-child {
          border-bottom: none;
          border-top: 1px solid #1e293b;
          font-weight: bold;
          font-size: 1em;
          margin-top: 5px;
          padding-top: 5px;
          color: #1e293b;
        }
        
        .bank-details {
          margin-top: 20px;
          padding: 12px;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          background: #f8fafc;
        }
        
        .bank-title {
          font-size: 1em;
          font-weight: bold;
          color: #1e293b;
          margin-bottom: 8px;
        }
        
        .bank-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 5px;
          line-height: 1.3;
          font-size: 0.8em;
        }
        
        .bank-row {
          display: flex;
          gap: 5px;
        }
        
        .bank-label {
          font-weight: bold;
          color: #374151;
          min-width: 80px;
        }
        
        .bank-value {
          color: #1e293b;
        }
        
        .footer-message {
          text-align: center;
          margin-top: 20px;
          padding: 10px;
          font-size: 1em;
          color: #1e293b;
          font-weight: 500;
        }
        
        .notes-section {
          background: #fef3c7;
          padding: 20px;
          border-radius: 8px;
          margin: 30px 0;
          border-left: 4px solid #f59e0b;
        }
        
        .notes-title {
          font-weight: 600;
          margin-bottom: 8px;
          color: #92400e;
        }
        
        .footer {
          background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
          color: white;
          text-align: center;
          margin-top: 40px;
          padding: 20px;
          border-radius: 8px;
        }
        
        .footer-title {
          font-size: 1.2em;
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .footer-subtitle {
          color: #bfdbfe;
          font-size: 0.9em;
          margin-bottom: 10px;
        }
        
        .footer-date {
          color: #93c5fd;
          font-size: 0.8em;
        }
        
        @media print {
          body { 
            margin: 0; 
            padding: 10mm; 
            font-size: 11px;
            line-height: 1.3;
          }
          .no-print { display: none; }
          .header { margin-bottom: 15px; }
          .billing-section { margin-bottom: 15px; }
          .items-section { margin-bottom: 15px; }
          .summary-section { margin: 10px 0; }
          .bank-details { margin-top: 15px; }
          .footer-message { margin-top: 15px; }
        }
        
        @page {
          margin: 10mm;
          size: A4;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-info">
          <div class="company-name">${settings.companyName}</div>
          <div class="company-tagline">${settings.companyTagline}</div>
        </div>
        <div class="invoice-header">
          <div class="invoice-title">Invoice</div>
          <div class="invoice-details">
            <div class="invoice-detail-row">
              <span class="invoice-label">Invoice No #:</span>
              <span class="invoice-value">${invoice.invoice_number}</span>
            </div>
            <div class="invoice-detail-row">
              <span class="invoice-label">Invoice Date:</span>
              <span class="invoice-value">${formatDate(invoice.invoice_date, settings)}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="billing-section">
        <div class="billed-to">
          <div class="section-title">Billed To</div>
          <div class="billing-info">
            <div class="billing-name">
              ${invoice.customer?.name || invoice.guest_name || "Guest Customer"}
            </div>
            ${((invoice.customer as { address?: string })?.address || invoice.guest_address) ? 
              `<div class="billing-address">${((invoice.customer as { address?: string })?.address || invoice.guest_address)?.replace(/\n/g, ', ')}</div>` : ''}
            ${(invoice.customer?.gstin || invoice.guest_gstin) ? 
              `<div class="gstin">GSTIN: ${invoice.customer?.gstin || invoice.guest_gstin}</div>` : ''}
            ${(invoice.customer?.pan || invoice.guest_pan) ? 
              `<div class="pan">PAN: ${invoice.customer?.pan || invoice.guest_pan}</div>` : ''}
          </div>
        </div>

        <div class="billed-from">
          <div class="section-title">Billed By</div>
          <div class="billing-info">
            <div class="billing-name">Ezazul Haque</div>
            <div class="billing-address">Nalhati to Rajgram Road, Vill :- Kaigoria, Post :- Diha, West Bengal, India - 731220</div>
            <div class="gstin">GSTIN: 19ADOPH4023K1ZD</div>
            <div class="pan">PAN: ADOPH4023K</div>
          </div>
        </div>
      </div>

      <div class="items-section">
        <div class="section-title">Items</div>
        <table class="items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>HSN/SAC</th>
              <th>Quantity</th>
              <th>Unit</th>
              <th>Rate</th>
              <th>Amount</th>
              <th>GST Rate</th>
              <th>CGST</th>
              <th>SGST</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoiceItems.map(item => {
              const rateWithoutGST = item.unit_price / (1 + item.tax_rate / 100);
              const taxableValue = item.quantity * rateWithoutGST;
              const totalAmount = item.quantity * item.unit_price;
              const taxAmount = totalAmount - taxableValue;
              const cgstAmount = taxAmount / 2;
              const sgstAmount = taxAmount / 2;
              
              return `
                <tr>
                  <td>
                    <div class="product-name">${item.product?.name || 'Custom Product'}</div>
                  </td>
                  <td>${item.product?.hsn_code || ''}</td>
                  <td>${item.quantity}</td>
                  <td>${item.product?.unit || ''}</td>
                  <td>${formatCurrency(rateWithoutGST, settings)}</td>
                  <td>${formatCurrency(taxableValue, settings)}</td>
                  <td>${item.tax_rate}%</td>
                  <td>${formatCurrency(cgstAmount, settings)}</td>
                  <td>${formatCurrency(sgstAmount, settings)}</td>
                  <td>${formatCurrency(totalAmount, settings)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      <div class="summary-section">
        <div class="summary-content">
          ${(() => {
            // Calculate GST-compliant totals from invoice items
            let totalTaxableValue = 0;
            let totalCGST = 0;
            let totalSGST = 0;
            let grandTotal = 0;
            
            invoiceItems.forEach(item => {
              const rateWithoutGST = item.unit_price / (1 + item.tax_rate / 100);
              const itemTaxableValue = item.quantity * rateWithoutGST;
              const itemTotalAmount = item.quantity * item.unit_price;
              const itemTaxAmount = itemTotalAmount - itemTaxableValue;
              
              totalTaxableValue += itemTaxableValue;
              totalCGST += itemTaxAmount / 2;
              totalSGST += itemTaxAmount / 2;
              grandTotal += itemTotalAmount;
            });
            
            return `
              <div class="summary-row">
                <span>Amount:</span>
                <span>${formatCurrency(totalTaxableValue, settings)}</span>
              </div>
              <div class="summary-row">
                <span>CGST:</span>
                <span>${formatCurrency(totalCGST, settings)}</span>
              </div>
              <div class="summary-row">
                <span>SGST:</span>
                <span>${formatCurrency(totalSGST, settings)}</span>
              </div>
              <div class="summary-row">
                <span>Total (INR):</span>
                <span>${formatCurrency(invoice.total_amount, settings)}</span>
              </div>
            `;
          })()}
        </div>
      </div>

      <div class="bank-details">
        <div class="bank-title">Bank Details</div>
        <div class="bank-info">
          <div class="bank-row">
            <span class="bank-label">Account Name:</span>
            <span class="bank-value">Ezazul Haque</span>
          </div>
          <div class="bank-row">
            <span class="bank-label">Account Number:</span>
            <span class="bank-value">000000000000</span>
          </div>
          <div class="bank-row">
            <span class="bank-label">IFSC:</span>
            <span class="bank-value">SBIN0008540</span>
          </div>
          <div class="bank-row">
            <span class="bank-label">Account Type:</span>
            <span class="bank-value">Current</span>
          </div>
          <div class="bank-row">
            <span class="bank-label">Bank:</span>
            <span class="bank-value">State Bank of India</span>
          </div>
        </div>
      </div>

      <div class="footer-message">
        Thank you for business with us!
      </div>
    </body>
    </html>
  `;

  return htmlContent;
};

// Write content to new window and print
const printContent = (htmlContent: string) => {
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    throw new Error('Unable to open print window. Please check your browser settings.');
  }

  // Write content to new window
  printWindow.document.write(htmlContent);
  printWindow.document.close();

  // Wait for content to load then trigger print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
      // Close window after printing (user can cancel)
      printWindow.onafterprint = () => {
        printWindow.close();
      };
    }, 500);
  };
};

// Alternative: Download as HTML file if PDF generation fails
export const downloadInvoiceHTML = (invoice: Invoice, invoiceItems: InvoiceItem[]) => {
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

  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>Invoice ${invoice.invoice_number} - Bio Tech Centre</title>
  <meta charset="UTF-8">
  <style>
    body { 
      font-family: Arial, sans-serif; 
      margin: 0; 
      padding: 10mm; 
      color: #1e293b; 
      font-size: 11px;
      line-height: 1.3;
    }
    .header { 
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 15px;
      margin-bottom: 15px;
    }
    .section-title { 
      color: #1e293b; 
      font-weight: bold; 
      border-bottom: 1px solid #1e293b; 
      padding-bottom: 3px; 
      font-size: 1em;
    }
    .items-table { 
      width: 100%; 
      border-collapse: collapse; 
      margin: 10px 0; 
      border: 1px solid #e5e7eb; 
      font-size: 0.8em;
    }
    .items-table th { 
      background: #f8fafc; 
      color: #1e293b; 
      padding: 6px 4px; 
      text-align: center; 
      font-weight: bold;
      border: 1px solid #e5e7eb;
    }
    .items-table td { 
      border: 1px solid #e5e7eb; 
      padding: 6px 4px; 
      text-align: center; 
      font-size: 0.8em;
    }
    .items-table td:first-child { text-align: left; width: 20%; }
    .items-table td:nth-child(2) { width: 8%; }
    .items-table td:nth-child(3) { width: 8%; }
    .items-table td:nth-child(4) { width: 8%; }
    .items-table td:nth-child(5) { width: 10%; text-align: right; }
    .items-table td:nth-child(6) { width: 10%; text-align: right; }
    .items-table td:nth-child(7) { width: 8%; }
    .items-table td:nth-child(8) { width: 10%; text-align: right; }
    .items-table td:nth-child(9) { width: 10%; text-align: right; }
    .items-table td:nth-child(10) { width: 10%; text-align: right; }
    .total-section { 
      background: #f8fafc;
      padding: 10px;
      border: 1px solid #e5e7eb;
      margin-top: 15px;
      text-align: right;
    }
    .total-row { margin: 3px 0; font-size: 0.9em; }
    .grand-total { 
      font-weight: bold; 
      font-size: 1em; 
      color: #1e293b; 
      border-top: 1px solid #1e293b; 
      padding-top: 5px; 
    }
    .footer {
      background: #f8fafc;
      color: #1e293b;
      text-align: center;
      margin-top: 20px;
      padding: 10px;
      border: 1px solid #e5e7eb;
    }
    @media print {
      body { 
        margin: 0; 
        padding: 10mm; 
        font-size: 11px;
        line-height: 1.3;
      }
    }
    @page {
      margin: 10mm;
      size: A4;
    }
  </style>
</head>
<body>
  <div class="header">
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px;">
      <div>
        <h2 style="margin: 0; font-size: 2.5em; font-weight: bold; color: #1e293b;">Bio Tech Centre</h2>
        <p style="margin: 0; color: #64748b; font-size: 1em;">Professional Bio-Technology Solutions</p>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 2.5em; font-weight: bold; color: #1e293b; margin-bottom: 20px;">Invoice</div>
        <div style="line-height: 1.8;">
          <div style="display: flex; justify-content: flex-end; gap: 10px;">
            <span style="font-weight: bold; color: #374151;">Invoice No #:</span>
            <span style="color: #1e293b;">${invoice.invoice_number}</span>
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 10px;">
            <span style="font-weight: bold; color: #374151;">Invoice Date:</span>
            <span style="color: #1e293b;">${formatDate(invoice.invoice_date)}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px;">
    <div style="border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px;">
      <h3 style="font-size: 1.3em; font-weight: bold; color: #1e293b; margin-bottom: 15px; text-transform: uppercase;">Billed To</h3>
      <div style="line-height: 1.8;">
        <div style="font-size: 1.2em; font-weight: bold; margin-bottom: 10px; color: #1e293b;">
          ${invoice.customer?.name || invoice.guest_name || "Guest Customer"}
        </div>
        ${((invoice.customer as { address?: string })?.address || invoice.guest_address) ? 
          `<div style="color: #64748b; margin-bottom: 8px;">${((invoice.customer as { address?: string })?.address || invoice.guest_address)?.replace(/\n/g, ', ')}</div>` : ''}
        ${(invoice.customer?.gstin || invoice.guest_gstin) ? 
          `<div style="font-family: 'Courier New', monospace; background: #f8fafc; padding: 4px 8px; border-radius: 4px; display: inline-block; margin: 4px 8px 4px 0; font-size: 0.9em;">GSTIN: ${invoice.customer?.gstin || invoice.guest_gstin}</div>` : ''}
        ${(invoice.customer?.pan || invoice.guest_pan) ? 
          `<div style="font-family: 'Courier New', monospace; background: #f8fafc; padding: 4px 8px; border-radius: 4px; display: inline-block; margin: 4px 8px 4px 0; font-size: 0.9em;">PAN: ${invoice.customer?.pan || invoice.guest_pan}</div>` : ''}
      </div>
    </div>

    <div style="border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px;">
      <h3 style="font-size: 1.3em; font-weight: bold; color: #1e293b; margin-bottom: 15px; text-transform: uppercase;">Billed By</h3>
      <div style="line-height: 1.8;">
        <div style="font-size: 1.2em; font-weight: bold; margin-bottom: 10px; color: #1e293b;">Ezazul Haque</div>
        <div style="color: #64748b; margin-bottom: 8px;">Nalhati to Rajgram Road, Vill :- Kaigoria, Post :- Diha, West Bengal, India - 731220</div>
        <div style="font-family: 'Courier New', monospace; background: #f8fafc; padding: 4px 8px; border-radius: 4px; display: inline-block; margin: 4px 8px 4px 0; font-size: 0.9em;">GSTIN: 19ADOPH4023K1ZD</div>
        <div style="font-family: 'Courier New', monospace; background: #f8fafc; padding: 4px 8px; border-radius: 4px; display: inline-block; margin: 4px 8px 4px 0; font-size: 0.9em;">PAN: ADOPH4023K</div>
      </div>
    </div>
  </div>
  
  <table class="items-table">
    <thead>
      <tr>
        <th>Item</th>
        <th>HSN/SAC</th>
        <th>Quantity</th>
        <th>Unit</th>
        <th>Rate</th>
        <th>Amount</th>
        <th>GST Rate</th>
        <th>CGST</th>
        <th>SGST</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${invoiceItems.map(item => {
        const rateWithoutGST = item.unit_price / (1 + item.tax_rate / 100);
        const taxableValue = item.quantity * rateWithoutGST;
        const totalAmount = item.quantity * item.unit_price;
        const taxAmount = totalAmount - taxableValue;
        const cgstAmount = taxAmount / 2;
        const sgstAmount = taxAmount / 2;
        
        return `
        <tr>
          <td>${item.product?.name || 'Custom Product'}</td>
          <td>${item.product?.hsn_code || ''}</td>
          <td>${item.quantity}</td>
          <td>${item.product?.unit || ''}</td>
          <td>${formatCurrency(rateWithoutGST)}</td>
          <td>${formatCurrency(taxableValue)}</td>
          <td>${item.tax_rate}%</td>
          <td>${formatCurrency(cgstAmount)}</td>
          <td>${formatCurrency(sgstAmount)}</td>
          <td>${formatCurrency(totalAmount)}</td>
        </tr>
      `;
      }).join('')}
    </tbody>
  </table>
  
  <div style="display: flex; justify-content: flex-end; margin: 20px 0;">
    <div style="width: 300px; border: 1px solid #e5e7eb; padding: 15px;">
      ${(() => {
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
        
        return `
          <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #f3f4f6;">
            <span>Amount:</span>
            <span>${formatCurrency(totalTaxableValue)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #f3f4f6;">
            <span>CGST:</span>
            <span>${formatCurrency(totalCGST)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #f3f4f6;">
            <span>SGST:</span>
            <span>${formatCurrency(totalSGST)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 5px 0; border-top: 2px solid #1e293b; font-weight: bold; font-size: 1.1em; margin-top: 8px; padding-top: 8px; color: #1e293b;">
            <span>Total (INR):</span>
            <span>${formatCurrency(invoice.total_amount)}</span>
          </div>
        `;
      })()}
    </div>
  </div>
  
  <div style="margin-top: 30px; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; background: #f8fafc;">
    <div style="font-size: 1.2em; font-weight: bold; color: #1e293b; margin-bottom: 15px;">Bank Details</div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; line-height: 1.6;">
      <div style="display: flex; gap: 10px;">
        <span style="font-weight: bold; color: #374151; min-width: 120px;">Account Name:</span>
        <span style="color: #1e293b;">Ezazul Haque</span>
      </div>
      <div style="display: flex; gap: 10px;">
        <span style="font-weight: bold; color: #374151; min-width: 120px;">Account Number:</span>
        <span style="color: #1e293b;">000000000000</span>
      </div>
      <div style="display: flex; gap: 10px;">
        <span style="font-weight: bold; color: #374151; min-width: 120px;">IFSC:</span>
        <span style="color: #1e293b;">SBIN0008540</span>
      </div>
      <div style="display: flex; gap: 10px;">
        <span style="font-weight: bold; color: #374151; min-width: 120px;">Account Type:</span>
        <span style="color: #1e293b;">Current</span>
      </div>
      <div style="display: flex; gap: 10px;">
        <span style="font-weight: bold; color: #374151; min-width: 120px;">Bank:</span>
        <span style="color: #1e293b;">State Bank of India</span>
      </div>
    </div>
  </div>
  
  <div style="text-align: center; margin-top: 30px; padding: 20px; font-size: 1.1em; color: #1e293b; font-weight: 500;">
    Thank you for business with us!
  </div>
</body>
</html>`;

  // Create blob and download
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `invoice-${invoice.invoice_number}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Send invoice PDF to Telegram
export const sendInvoiceToTelegram = async (
  invoice: Invoice,
  invoiceItems: InvoiceItem[],
  telegramSettings: { telegramBotToken: string; telegramChatId: string }
): Promise<boolean> => {
  try {
    // Generate HTML content
    const settings = getInvoiceSettings();
    
    let htmlContent: string;

    // Check if custom template should be used
    if (settings.useCustomTemplate && settings.customTemplateFile) {
      try {
        htmlContent = await processCustomTemplate(settings.customTemplateFile, invoice, invoiceItems, settings);
      } catch (error) {
        console.error('Custom template processing failed:', error);
        // Fall back to default template
        htmlContent = generateDefaultTemplate(invoice, invoiceItems, settings);
      }
    } else {
      htmlContent = generateDefaultTemplate(invoice, invoiceItems, settings);
    }

    // Create a Blob with the HTML content
    const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
    
    // Send to Telegram as HTML file
    const success = await sendFileToTelegram(
      htmlBlob,
      `invoice-${invoice.invoice_number}.html`,
      telegramSettings
    );
    
    return success;
  } catch (error) {
    console.error('Error sending invoice to Telegram:', error);
    return false;
  }
};