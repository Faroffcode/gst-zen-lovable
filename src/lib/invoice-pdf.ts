import { Invoice, InvoiceItem } from "@/hooks/useInvoices";
import { getInvoiceSettings, formatCurrency, formatDate, processCustomTemplate } from "./template-processor";
import { uploadInvoicePDF as uploadToR2, isR2Configured, htmlToPdfBlob } from "./cloudflare-r2";
import { useToast } from "@/hooks/use-toast";

// PDF generation utility using browser's print functionality and CSS
export const generateInvoicePDF = async (invoice: Invoice, invoiceItems: InvoiceItem[], uploadToCloud: boolean = false) => {
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

  // If cloud upload is requested and R2 is configured, upload to R2
  if (uploadToCloud && isR2Configured()) {
    try {
      // Convert HTML to PDF blob (simplified approach)
      const pdfBlob = await htmlToPdfBlob(htmlContent);
      
      // Upload to Cloudflare R2
      const uploadResult = await uploadToR2(invoice.invoice_number, pdfBlob);
      
      if (uploadResult.success) {
        console.log('Invoice uploaded to R2:', uploadResult.url);
        return { success: true, cloudUrl: uploadResult.url };
      } else {
        console.error('R2 upload failed:', uploadResult.error);
        // Fall back to browser print
        printInvoice(htmlContent);
        return { success: true, cloudUrl: null };
      }
    } catch (error) {
      console.error('Cloud upload failed, falling back to print:', error);
      printInvoice(htmlContent);
      return { success: true, cloudUrl: null };
    }
  } else {
    // Standard browser print
    printInvoice(htmlContent);
    return { success: true, cloudUrl: null };
  }
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
const generateDefaultTemplate = (invoice: Invoice, invoiceItems: InvoiceItem[], settings: any): string => {
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
          line-height: 1.6;
          color: #1e293b;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background: white;
        }
        
        .header {
          background: linear-gradient(135deg, ${settings.primaryColor} 0%, ${settings.primaryColor}dd 100%);
          color: white;
          padding: 30px;
          border-radius: 12px;
          margin-bottom: 30px;
          box-shadow: 0 4px 6px rgba(37, 99, 235, 0.1);
        }
        
        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 20px;
        }
        
        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 20px;
        }
        
        .company-branding {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 15px;
        }
        
        .company-logo {
          background: white;
          color: ${settings.primaryColor};
          padding: 8px 12px;
          border-radius: 8px;
          font-weight: bold;
          font-size: 1.2em;
        }
        
        .company-details h2 {
          color: white;
          font-size: 1.5em;
          font-weight: bold;
          margin: 0;
        }
        
        .company-tagline {
          color: #bfdbfe;
          font-size: 0.9em;
          margin: 0;
        }
        
        .company-info h1 {
          color: white;
          font-size: 2.5em;
          font-weight: bold;
          margin: 10px 0;
        }
        
        .invoice-meta {
          text-align: right;
        }
        
        .invoice-number {
          background: white;
          color: ${settings.primaryColor};
          padding: 8px 16px;
          border-radius: 6px;
          font-family: 'Courier New', monospace;
          font-size: 1.2em;
          font-weight: bold;
          margin-bottom: 5px;
          display: inline-block;
        }
        

        
        .total-amount {
          font-size: 2em;
          font-weight: bold;
          color: white;
        }
        
        .billing-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-bottom: 30px;
        }
        
        .section-title {
          font-size: 1.2em;
          font-weight: bold;
          color: ${settings.primaryColor};
          border-bottom: 3px solid ${settings.primaryColor};
          padding-bottom: 8px;
          margin-bottom: 15px;
        }
        
        .customer-info {
          line-height: 1.8;
        }
        
        .customer-name {
          font-size: 1.1em;
          font-weight: bold;
          margin-bottom: 8px;
        }
        
        .gstin {
          font-family: 'Courier New', monospace;
          background: #f3f4f6;
          padding: 4px 8px;
          border-radius: 4px;
          display: inline-block;
          margin-top: 8px;
        }
        
        .invoice-details {
          line-height: 2;
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
          margin-bottom: 30px;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
          border: 2px solid ${settings.primaryColor};
          border-radius: 8px;
          overflow: hidden;
        }
        
        .items-table th {
          background: linear-gradient(135deg, ${settings.primaryColor} 0%, ${settings.primaryColor}dd 100%);
          color: white;
          padding: 12px 8px;
          text-align: left;
          font-weight: 600;
          font-size: 0.9em;
        }
        
        .items-table td {
          padding: 12px 8px;
          border-bottom: 1px solid #f3f4f6;
        }
        
        .items-table tr:nth-child(even) {
          background: #f8fafc;
        }
        
        .items-table tr:hover {
          background: #eff6ff;
        }
        
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        
        .product-name {
          font-weight: 500;
        }
        
        .product-sku {
          font-size: 0.8em;
          color: #6b7280;
          font-family: 'Courier New', monospace;
        }
        
        .summary-section {
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          padding: 20px;
          border-radius: 12px;
          border: 2px solid #2563eb;
          box-shadow: 0 4px 6px rgba(37, 99, 235, 0.1);
        }
        
        .summary-content {
          max-width: 300px;
          margin-left: auto;
        }
        
        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .summary-row:last-child {
          border-bottom: none;
          border-top: 2px solid #2563eb;
          font-weight: bold;
          font-size: 1.1em;
          margin-top: 8px;
          padding-top: 12px;
          color: #2563eb;
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
          body { margin: 0; padding: 15px; }
          .no-print { display: none; }
        }
        
        @page {
          margin: 20mm;
          size: A4;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="header-content">
          <div class="company-info">
            ${settings.showCompanyLogo ? `
            <div class="company-branding">
              <div class="company-logo">${settings.logoText}</div>
              <div class="company-details">
                <h2>${settings.companyName}</h2>
                <p class="company-tagline">${settings.companyTagline}</p>
              </div>
            </div>
            ` : ''}
            <h1>TAX INVOICE</h1>
            <div class="invoice-number">${invoice.invoice_number}</div>
          </div>
          <div class="invoice-meta">
            <div class="total-amount">${formatCurrency(invoice.total_amount, settings)}</div>
            <div style="color: #bfdbfe; font-size: 0.9em;">Total Amount</div>
          </div>
        </div>
      </div>

      <div class="billing-section">
        <div class="bill-to">
          <div class="section-title">Bill To</div>
          <div class="customer-info">
            <div class="customer-name">
              ${invoice.customer?.name || invoice.guest_name || "Guest Customer"}
            </div>
            ${((invoice.customer as any)?.email || invoice.guest_email) ? 
              `<div>${(invoice.customer as any)?.email || invoice.guest_email}</div>` : ''}
            ${((invoice.customer as any)?.phone || invoice.guest_phone) ? 
              `<div>Phone: ${(invoice.customer as any)?.phone || invoice.guest_phone}</div>` : ''}
            ${((invoice.customer as any)?.address || invoice.guest_address) ? 
              `<div style="margin-top: 8px;">${((invoice.customer as any)?.address || invoice.guest_address)?.replace(/\n/g, '<br>')}</div>` : ''}
            ${(invoice.customer?.gstin || invoice.guest_gstin) ? 
              `<div class="gstin">GSTIN: ${invoice.customer?.gstin || invoice.guest_gstin}</div>` : ''}
          </div>
        </div>

        <div class="invoice-info">
          <div class="section-title">Invoice Information</div>
          <div class="invoice-details">
            <div class="detail-row">
              <span class="detail-label">Invoice Number:</span>
              <span class="detail-value">${invoice.invoice_number}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Invoice Date:</span>
              <span class="detail-value">${formatDate(invoice.invoice_date, settings)}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="items-section">
        <div class="section-title">Items</div>
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 25%;">Product (Description)</th>
              <th style="width: 8%;">HSN</th>
              <th style="width: 8%;">Unit</th>
              <th style="width: 8%;">Qty</th>
              <th style="width: 12%;">Rate/Unit</th>
              <th style="width: 12%;">Total</th>
              <th style="width: 12%;">Taxable Value</th>
              <th style="width: 8%;">CGST</th>
              <th style="width: 8%;">SGST</th>
            </tr>
          </thead>
          <tbody>
            ${invoiceItems.map(item => {
              // Calculate GST breakdown for each item
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
                    <div class="product-sku">SKU: ${item.product?.sku || 'N/A'}</div>
                  </td>
                  <td class="text-center">${item.product?.hsn_code || 'N/A'}</td>
                  <td class="text-center">${item.product?.unit || 'N/A'}</td>
                  <td class="text-center">${item.quantity}</td>
                  <td class="text-right">${formatCurrency(item.unit_price, settings)}</td>
                  <td class="text-right">${formatCurrency(totalAmount, settings)}</td>
                  <td class="text-right">${formatCurrency(taxableValue, settings)}</td>
                  <td class="text-right">
                    ${formatCurrency(cgstAmount, settings)}<br>
                    <small>(${(item.tax_rate/2).toFixed(1)}%)</small>
                  </td>
                  <td class="text-right">
                    ${formatCurrency(sgstAmount, settings)}<br>
                    <small>(${(item.tax_rate/2).toFixed(1)}%)</small>
                  </td>
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
                <span>Total Taxable Value:</span>
                <span>${formatCurrency(totalTaxableValue, settings)}</span>
              </div>
              <div class="summary-row">
                <span>Total CGST:</span>
                <span>${formatCurrency(totalCGST, settings)}</span>
              </div>
              <div class="summary-row">
                <span>Total SGST:</span>
                <span>${formatCurrency(totalSGST, settings)}</span>
              </div>
              <div class="summary-row">
                <span>Grand Total:</span>
                <span>${formatCurrency(invoice.total_amount, settings)}</span>
              </div>
            `;
          })()}
        </div>
      </div>

      ${invoice.notes ? `
        <div class="notes-section">
          <div class="notes-title">Notes:</div>
          <div>${invoice.notes.replace(/\n/g, '<br>')}</div>
        </div>
      ` : ''}

      ${settings.showFooter ? `
      <div class="footer">
        <div class="footer-title">${settings.footerText}</div>
        <div class="footer-subtitle">${settings.companyTagline}</div>
        <div class="footer-date">Generated on ${formatDate(new Date().toISOString(), settings)}</div>
      </div>
      ` : ''}
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
    body { font-family: Arial, sans-serif; margin: 20px; color: #1e293b; }
    .header { 
      background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
      color: white;
      padding: 30px;
      border-radius: 12px;
      margin-bottom: 30px;
    }
    .company-branding { display: flex; align-items: center; gap: 15px; margin-bottom: 15px; }
    .company-logo { background: white; color: #2563eb; padding: 8px 12px; border-radius: 8px; font-weight: bold; }
    .invoice-title { font-size: 24px; font-weight: bold; color: white; }
    .invoice-number { 
      background: white;
      color: #2563eb;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 18px;
      margin: 10px 0;
      display: inline-block;
    }
    .customer-info, .invoice-info { margin-bottom: 20px; }
    .section-title { color: #2563eb; font-weight: bold; border-bottom: 3px solid #2563eb; padding-bottom: 5px; }
    .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; border: 2px solid #2563eb; border-radius: 8px; overflow: hidden; }
    .items-table th { background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); color: white; padding: 12px 8px; text-align: left; }
    .items-table td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; }
    .items-table tr:nth-child(even) { background: #f8fafc; }
    .total-section { 
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      padding: 20px;
      border-radius: 12px;
      border: 2px solid #2563eb;
      margin-top: 20px;
      text-align: right;
    }
    .total-row { margin: 5px 0; }
    .grand-total { font-weight: bold; font-size: 18px; color: #2563eb; border-top: 2px solid #2563eb; padding-top: 10px; }
    .footer {
      background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
      color: white;
      text-align: center;
      margin-top: 40px;
      padding: 20px;
      border-radius: 8px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-branding">
      <div class="company-logo">BTC</div>
      <div>
        <h2 style="margin: 0; font-size: 1.5em;">Bio Tech Centre</h2>
        <p style="margin: 0; color: #bfdbfe; font-size: 0.9em;">Professional Bio-Technology Solutions</p>
      </div>
    </div>
    <div class="invoice-title">TAX INVOICE</div>
    <div class="invoice-number">${invoice.invoice_number}</div>
  </div>
  
  <div class="customer-info">
    <h3 class="section-title">Bill To:</h3>
    <p><strong>${invoice.customer?.name || invoice.guest_name || "Guest Customer"}</strong></p>
    ${((invoice.customer as any)?.email || invoice.guest_email) ? `<p>Email: ${(invoice.customer as any)?.email || invoice.guest_email}</p>` : ''}
    ${((invoice.customer as any)?.phone || invoice.guest_phone) ? `<p>Phone: ${(invoice.customer as any)?.phone || invoice.guest_phone}</p>` : ''}
    ${(invoice.customer?.gstin || invoice.guest_gstin) ? `<p>GSTIN: ${invoice.customer?.gstin || invoice.guest_gstin}</p>` : ''}
  </div>
  
  <div class="invoice-info">
    <p><strong>Invoice Date:</strong> ${formatDate(invoice.invoice_date)}</p>
  </div>
  
  <table class="items-table">
    <thead>
      <tr>
        <th>Product</th>
        <th>Quantity</th>
        <th>Unit Price</th>
        <th>Tax %</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${invoiceItems.map(item => {
        const totalAmount = item.quantity * item.unit_price;
        return `
        <tr>
          <td>${item.product?.name}<br><small>SKU: ${item.product?.sku}</small></td>
          <td>${item.quantity} ${item.product?.unit}</td>
          <td>${formatCurrency(item.unit_price)}</td>
          <td>${item.tax_rate}%</td>
          <td>${formatCurrency(totalAmount)}</td>
        </tr>
      `;
      }).join('')}
    </tbody>
  </table>
  
  <div class="total-section">
    <div class="total-row">Subtotal: ${formatCurrency(invoice.subtotal)}</div>
    <div class="total-row">CGST: ${formatCurrency(invoice.tax_amount / 2)}</div>
    <div class="total-row">SGST: ${formatCurrency(invoice.tax_amount / 2)}</div>
    <div class="total-row grand-total">Total: ${formatCurrency(invoice.total_amount)}</div>
  </div>
  
  ${invoice.notes ? `<div style="margin-top: 30px;"><strong>Notes:</strong><br>${invoice.notes}</div>` : ''}
  
  <div style="margin-top: 40px; text-align: center;" class="footer">
    <div style="font-size: 1.2em; font-weight: bold; margin-bottom: 5px;">Thank you for choosing Bio Tech Centre!</div>
    <div style="color: #bfdbfe; font-size: 0.9em; margin-bottom: 10px;">Your trusted partner in bio-technology solutions</div>
    <div style="color: #93c5fd; font-size: 0.8em;">Generated on ${new Date().toLocaleDateString('en-IN')}</div>
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