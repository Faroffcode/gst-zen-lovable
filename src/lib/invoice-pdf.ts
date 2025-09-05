import { Invoice, InvoiceItem } from "@/hooks/useInvoices";
import { Customer } from "@/hooks/useCustomers";
import { getInvoiceSettings, formatCurrency, formatDate, processCustomTemplate, InvoiceSettings } from "./template-processor";
import { useToast } from "@/hooks/use-toast";
import { sendFileToTelegram } from "@/lib/telegram";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// PDF generation utility for downloading invoice as actual PDF file
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

  // Generate and download as PDF
  await downloadInvoiceAsPDF(htmlContent, invoice.invoice_number);
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
  try {
    // Create a temporary container element
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = htmlContent;
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0';
    tempContainer.style.width = '210mm'; // A4 width
    tempContainer.style.backgroundColor = 'white';
    document.body.appendChild(tempContainer);

    // Convert HTML to canvas
    const canvas = await html2canvas(tempContainer, {
      scale: 2, // Higher quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 794, // A4 width in pixels (210mm)
      height: tempContainer.scrollHeight
    });

    // Remove temporary container
    document.body.removeChild(tempContainer);

    // Create PDF with proper margins
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Set margins
    const margin = 15; // 15mm margins on all sides
    const pageWidth = 210 - (margin * 2); // A4 width minus margins
    const pageHeight = 297 - (margin * 2); // A4 height minus margins
    
    const imgWidth = pageWidth; // Use available width
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = margin; // Start with top margin

    // Add first page
    pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight + margin;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Return PDF as blob
    return pdf.output('blob');
  } catch (error) {
    console.error('Error generating PDF blob:', error);
    // Fallback to HTML blob
    return new Blob([htmlContent], { type: 'text/html' });
  }
};



// Generate default template
const generateDefaultTemplate = (invoice: Invoice, invoiceItems: InvoiceItem[], settings: InvoiceSettings): string => {
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
          padding: 20px;
          background: white;
          font-size: 12px;
          min-height: 100vh;
        }
        
        .invoice-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05);
          padding: 30px;
          margin: 0 auto;
          max-width: 800px;
          position: relative;
          overflow: hidden;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 25px;
          padding: 20px;
          background: #eff3ff;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
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
          color: #6b7280;
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
          margin-bottom: 25px;
        }
        
        .billed-to, .billed-from {
          padding: 20px;
          border-radius: 8px;
          background: #eff3ff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        
        .section-title {
          font-size: 1.1em;
          font-weight: bold;
          color: #1e293b;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
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
          background: #eff3ff;
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
          margin-bottom: 25px;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
          font-size: 0.8em;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        
        .items-table th {
          background: #eff3ff;
          color: #1e293b;
          padding: 8px 4px;
          text-align: center;
          font-weight: bold;
          font-size: 0.8em;
        }
        
        .items-table td {
          padding: 8px 4px;
          vertical-align: middle;
          text-align: center;
          font-size: 0.8em;
          background: white;
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
          margin: 20px 0;
        }
        
        .summary-content {
          width: 280px;
          padding: 20px;
          border-radius: 8px;
          background: #eff3ff;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
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
          font-weight: bold;
          font-size: 1.1em;
          margin-top: 8px;
          padding-top: 8px;
          background: #eff3ff;
          border-radius: 4px;
          padding: 8px 12px;
          color: #32cd32;
        }
        
        .bank-details {
          margin-top: 25px;
          padding: 20px;
          border-radius: 8px;
          background: #eff3ff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
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
          margin-top: 25px;
          padding: 20px;
          font-size: 1.1em;
          background: #eff3ff;
          color: #1e293b;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          font-weight: 500;
        }
        
        .notes-section {
          background: #eff3ff;
          padding: 20px;
          border-radius: 8px;
          margin: 30px 0;
        }
        
        .notes-title {
          font-weight: 600;
          margin-bottom: 8px;
          color: #1e293b;
        }
        
        .footer {
          background: #eff3ff;
          color: #1e293b;
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
          color: #6b7280;
          font-size: 0.9em;
          margin-bottom: 10px;
        }
        
        .footer-date {
          color: #6b7280;
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
      <div class="invoice-container">
        <div class="header">
          <div class="company-info">
          <div class="company-name">EZAZUL HAQUE</div>
          <div class="company-tagline">Proprietor of BIO TECH CENTRE</div>
              </div>
        <div class="invoice-header">
          <div class="invoice-title">Invoice</div>
          <div class="invoice-details">
            <div class="invoice-detail-row">
              <span class="invoice-label">Invoice No:</span>
              <span class="invoice-value">BTC-${invoice.invoice_number.replace('INV-', '')}/25-26</span>
            </div>
            <div class="invoice-detail-row">
              <span class="invoice-label">Invoice Date:</span>
              <span class="invoice-value">${formatDate(invoice.invoice_date, settings)}</span>
          </div>
          </div>
        </div>
      </div>

      <div class="billing-section">
        <div class="billed-from">
          <div class="section-title">Billed By</div>
          <div class="billing-info">
            <div class="billing-name">Ezazul Haque</div>
            <div class="billing-address">Nalhati to Rajgram Road, Vill :- Kaigoria, Post :- Diha, West Bengal, India - 731220</div>
            <div class="gstin">GSTIN: 19ADOPH4023K1ZD</div>
            <div class="pan">PAN: ADOPH4023K</div>
          </div>
        </div>

        <div class="billed-to">
          <div class="section-title">Billed To</div>
          <div class="billing-info">
            ${(invoice.customer?.name || invoice.guest_name) ? 
              `<div class="billing-name">${invoice.customer?.name || invoice.guest_name}</div>` : ''}
            ${((invoice.customer as Customer)?.email || invoice.guest_email) ? 
              `<div class="billing-address">Email: ${(invoice.customer as Customer)?.email || invoice.guest_email}</div>` : ''}
            ${((invoice.customer as Customer)?.phone || invoice.guest_phone) ? 
              `<div class="billing-address">Phone: ${(invoice.customer as Customer)?.phone || invoice.guest_phone}</div>` : ''}
            ${((invoice.customer as Customer)?.address || invoice.guest_address) ? 
              `<div class="billing-address">${((invoice.customer as Customer)?.address || invoice.guest_address)?.replace(/\n/g, '<br>')}</div>` : ''}
            ${((invoice.customer as Customer)?.city || (invoice.customer as Customer)?.state || (invoice.customer as Customer)?.pincode) ? 
              `<div class="billing-address">${[(invoice.customer as Customer)?.city, (invoice.customer as Customer)?.state, (invoice.customer as Customer)?.pincode].filter(Boolean).join(', ')}</div>` : ''}
            ${(invoice.customer?.gstin || invoice.guest_gstin) ? 
              `<div class="gstin">GSTIN: ${invoice.customer?.gstin || invoice.guest_gstin}</div>` : ''}
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
      </div>
    </body>
    </html>
  `;

  return htmlContent;
};

// Generate and download invoice as PDF file
const downloadInvoiceAsPDF = async (htmlContent: string, invoiceNumber: string) => {
  try {
    // Create a temporary container element
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = htmlContent;
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0';
    tempContainer.style.width = '210mm'; // A4 width
    tempContainer.style.backgroundColor = 'white';
    document.body.appendChild(tempContainer);

    // Convert HTML to canvas
    const canvas = await html2canvas(tempContainer, {
      scale: 2, // Higher quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 794, // A4 width in pixels (210mm)
      height: tempContainer.scrollHeight
    });

    // Remove temporary container
    document.body.removeChild(tempContainer);

    // Create PDF with proper margins
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Set margins
    const margin = 15; // 15mm margins on all sides
    const pageWidth = 210 - (margin * 2); // A4 width minus margins
    const pageHeight = 297 - (margin * 2); // A4 height minus margins
    
    const imgWidth = pageWidth; // Use available width
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = margin; // Start with top margin

    // Add first page
    pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight + margin;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Download the PDF
    const fileName = `Invoice_${invoiceNumber}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);

  } catch (error) {
    console.error('Error generating PDF:', error);
    // Fallback to HTML download
    downloadInvoiceHTMLFallback(htmlContent, invoiceNumber);
  }
};

// Fallback function to download as HTML if PDF generation fails
const downloadInvoiceHTMLFallback = (htmlContent: string, invoiceNumber: string) => {
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Invoice_${invoiceNumber}_${new Date().toISOString().split('T')[0]}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
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
      font-size: 0.8em;
    }
    .items-table th { 
      background: #f3f4f6; 
      color: #1e293b; 
      padding: 6px 4px; 
      text-align: center; 
      font-weight: bold;
    }
    .items-table td { 
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
      background: #eff3ff;
      padding: 10px;
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
      background: #eff3ff;
      color: #1e293b;
      text-align: center;
      margin-top: 20px;
      padding: 10px;
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
        <h2 style="margin: 0; font-size: 2.5em; font-weight: bold; color: #1e293b;">EZAZUL HAQUE</h2>
        <p style="margin: 0; color: #64748b; font-size: 1em;">Proprietor of BIO TECH CENTRE</p>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 2.5em; font-weight: bold; color: #1e293b; margin-bottom: 20px;">Invoice</div>
        <div style="line-height: 1.8;">
          <div style="display: flex; justify-content: flex-end; gap: 10px;">
            <span style="font-weight: bold; color: #374151;">Invoice No:</span>
            <span style="color: #1e293b;">BTC-${invoice.invoice_number.replace('INV-', '')}/25-26</span>
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
      <h3 style="font-size: 1.3em; font-weight: bold; color: #1e293b; margin-bottom: 15px; text-transform: uppercase;">Billed By</h3>
      <div style="line-height: 1.8;">
        <div style="font-size: 1.2em; font-weight: bold; margin-bottom: 10px; color: #1e293b;">Ezazul Haque</div>
        <div style="color: #64748b; margin-bottom: 8px;">Nalhati to Rajgram Road, Vill :- Kaigoria, Post :- Diha, West Bengal, India - 731220</div>
        <div style="font-family: 'Courier New', monospace; background: #eff3ff; padding: 4px 8px; border-radius: 4px; display: inline-block; margin: 4px 8px 4px 0; font-size: 0.9em;">GSTIN: 19ADOPH4023K1ZD</div>
        <div style="font-family: 'Courier New', monospace; background: #eff3ff; padding: 4px 8px; border-radius: 4px; display: inline-block; margin: 4px 8px 4px 0; font-size: 0.9em;">PAN: ADOPH4023K</div>
      </div>
    </div>
  
    <div style="border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px;">
      <h3 style="font-size: 1.3em; font-weight: bold; color: #1e293b; margin-bottom: 15px; text-transform: uppercase;">Billed To</h3>
      <div style="line-height: 1.8;">
        ${(invoice.customer?.name || invoice.guest_name) ? 
          `<div style="font-size: 1.2em; font-weight: bold; margin-bottom: 10px; color: #1e293b;">${invoice.customer?.name || invoice.guest_name}</div>` : ''}
        ${((invoice.customer as Customer)?.email || invoice.guest_email) ? 
          `<div style="color: #64748b; margin-bottom: 4px;">Email: ${(invoice.customer as Customer)?.email || invoice.guest_email}</div>` : ''}
        ${((invoice.customer as Customer)?.phone || invoice.guest_phone) ? 
          `<div style="color: #64748b; margin-bottom: 4px;">Phone: ${(invoice.customer as Customer)?.phone || invoice.guest_phone}</div>` : ''}
        ${((invoice.customer as Customer)?.address || invoice.guest_address) ? 
          `<div style="color: #64748b; margin-bottom: 8px;">${((invoice.customer as Customer)?.address || invoice.guest_address)?.replace(/\n/g, '<br>')}</div>` : ''}
        ${((invoice.customer as Customer)?.city || (invoice.customer as Customer)?.state || (invoice.customer as Customer)?.pincode) ? 
          `<div style="color: #64748b; margin-bottom: 8px;">${[(invoice.customer as Customer)?.city, (invoice.customer as Customer)?.state, (invoice.customer as Customer)?.pincode].filter(Boolean).join(', ')}</div>` : ''}
        ${(invoice.customer?.gstin || invoice.guest_gstin) ? 
          `<div style="font-family: 'Courier New', monospace; background: #eff3ff; padding: 4px 8px; border-radius: 4px; display: inline-block; margin: 4px 8px 4px 0; font-size: 0.9em;">GSTIN: ${invoice.customer?.gstin || invoice.guest_gstin}</div>` : ''}
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
          <div style="display: flex; justify-content: space-between; padding: 5px 0; border-top: 2px solid #1e293b; font-weight: bold; font-size: 1.1em; margin-top: 8px; padding-top: 8px; color: #32cd32;">
            <span>Total (INR):</span>
            <span>${formatCurrency(invoice.total_amount)}</span>
          </div>
        `;
      })()}
    </div>
  </div>
  
  <div style="margin-top: 30px; padding: 20px; border-radius: 8px; background: #eff3ff;">
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
  
  <div style="text-align: center; margin-top: 30px; padding: 20px; font-size: 1.1em; color: #1e293b; font-weight: 500; background: #eff3ff; border-radius: 8px;">
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
    // Generate PDF blob
    const pdfBlob = await generateInvoicePDFBlob(invoice, invoiceItems);
    
    // Create filename with BTC format and customer name if available
    let filename: string;
    const invoiceNumber = invoice.invoice_number.replace('INV-', ''); // Remove INV- prefix
    const btcNumber = `BTC-${invoiceNumber}`;
    
    if (invoice.customer?.name) {
      // Use existing customer name
      const customerName = invoice.customer.name.replace(/[^a-zA-Z0-9\s]/g, ''); // Keep only alphanumeric and spaces
      filename = `${btcNumber} ${customerName}.pdf`;
    } else if (invoice.guest_name) {
      // Use guest customer name
      const guestName = invoice.guest_name.replace(/[^a-zA-Z0-9\s]/g, ''); // Keep only alphanumeric and spaces
      filename = `${btcNumber} ${guestName}.pdf`;
    } else {
      // No customer name available
      filename = `${btcNumber}.pdf`;
    }
    
    // Send to Telegram as PDF file
    const success = await sendFileToTelegram(
      pdfBlob,
      filename,
      telegramSettings
    );
    
    return success;
  } catch (error) {
    console.error('Error sending invoice to Telegram:', error);
    return false;
  }
};
