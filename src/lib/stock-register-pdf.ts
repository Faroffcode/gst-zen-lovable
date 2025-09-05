import { Product } from "@/hooks/useProducts";
import { StockRegisterEntry } from "@/hooks/useStockRegister";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface StockRegisterPDFData {
  product: Product;
  entries: StockRegisterEntry[];
  totalPurchases: number;
  totalSales: number;
  currentStock: number;
  totalEntries: number;
}

// Generate stock register PDF
export const generateStockRegisterPDF = async (data: StockRegisterPDFData) => {
  const htmlContent = generateStockRegisterHTML(data);
  
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
    const fileName = `Stock_Register_${data.product.name.replace(/[^a-zA-Z0-9\s]/g, '')}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);

  } catch (error) {
    console.error('Error generating stock register PDF:', error);
    // Fallback to HTML download
    downloadStockRegisterHTMLFallback(htmlContent, data.product.name);
  }
};

// Generate HTML content for stock register
const generateStockRegisterHTML = (data: StockRegisterPDFData): string => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatInvoiceNumber = (invoiceNumber: string) => {
    // If it's already in BTC format, return as is
    if (invoiceNumber.startsWith('BTC-')) {
      return invoiceNumber;
    }
    
    // If it's in INV- format, convert to BTC format
    if (invoiceNumber.startsWith('INV-')) {
      const number = invoiceNumber.replace('INV-', '');
      return `BTC-${number}`;
    }
    
    // If it's a raw number, add BTC- prefix
    if (/^\d+$/.test(invoiceNumber)) {
      return `BTC-${invoiceNumber}`;
    }
    
    // For any other format, return as is
    return invoiceNumber;
  };

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Stock Register - ${data.product.name}</title>
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
        
        .stock-register-container {
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
          text-align: center;
          margin-bottom: 30px;
          padding: 20px;
          background: #eff3ff;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
        
        .main-title {
          font-size: 2.5em;
          font-weight: bold;
          color: #1e293b;
          margin: 0 0 10px 0;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        
        .subtitle {
          color: #6b7280;
          font-size: 1.1em;
          margin: 0;
        }
        
        .content-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-bottom: 30px;
        }
        
        .product-details {
          padding: 20px;
          border-radius: 8px;
          background: #f8fafc;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        
        .section-title {
          font-size: 1.3em;
          font-weight: bold;
          color: #1e293b;
          margin-bottom: 15px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 2px solid #3b82f6;
          padding-bottom: 5px;
        }
        
        .product-info {
          line-height: 1.6;
        }
        
        .product-name {
          font-size: 1.4em;
          font-weight: bold;
          margin-bottom: 10px;
          color: #1e293b;
        }
        
        .product-detail-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .product-detail-row:last-child {
          border-bottom: none;
        }
        
        .detail-label {
          font-weight: bold;
          color: #374151;
          min-width: 120px;
        }
        
        .detail-value {
          color: #1e293b;
          text-align: right;
        }
        
        .summary-section {
          padding: 20px;
          border-radius: 8px;
          background: #f0f9ff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        
        .summary-item {
          background: white;
          padding: 15px;
          margin-bottom: 10px;
          border-radius: 6px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          text-align: center;
        }
        
        .summary-item:last-child {
          margin-bottom: 0;
        }
        
        .summary-label {
          font-size: 0.9em;
          color: #6b7280;
          margin-bottom: 5px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .summary-value {
          font-size: 1.5em;
          font-weight: bold;
          color: #1e293b;
        }
        
        .summary-value.purchases {
          color: #059669;
        }
        
        .summary-value.sales {
          color: #dc2626;
        }
        
        .summary-value.current-stock {
          color: #2563eb;
        }
        
        .summary-value.total-entries {
          color: #7c3aed;
        }
        
        .entries-section {
          margin-top: 30px;
        }
        
        .entries-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
          font-size: 0.9em;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        
        .entries-table th {
          background: #eff3ff;
          color: #1e293b;
          padding: 12px 8px;
          text-align: center;
          font-weight: bold;
          font-size: 0.9em;
        }
        
        .entries-table td {
          padding: 10px 8px;
          vertical-align: middle;
          text-align: center;
          font-size: 0.9em;
          background: white;
          border-bottom: 1px solid #f1f5f9;
        }
        
        .entries-table td:first-child {
          text-align: left;
          width: 15%;
        }
        
        .entries-table td:nth-child(2) { width: 20%; }
        .entries-table td:nth-child(3) { width: 15%; }
        .entries-table td:nth-child(4) { width: 12%; text-align: right; }
        .entries-table td:nth-child(5) { width: 12%; text-align: right; }
        .entries-table td:nth-child(6) { width: 12%; text-align: right; }
        
        .transaction-type {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.8em;
          font-weight: bold;
          text-transform: uppercase;
        }
        
        .transaction-type.purchase {
          background: #dcfce7;
          color: #166534;
        }
        
        .transaction-type.sale {
          background: #fef2f2;
          color: #991b1b;
        }
        
        .quantity-positive {
          color: #059669;
          font-weight: bold;
        }
        
        .quantity-negative {
          color: #dc2626;
          font-weight: bold;
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
          .header { margin-bottom: 20px; }
          .content-section { margin-bottom: 20px; }
          .entries-section { margin-top: 20px; }
        }
        
        @page {
          margin: 10mm;
          size: A4;
        }
      </style>
    </head>
    <body>
      <div class="stock-register-container">
        <div class="header">
          <h1 class="main-title">Stock Register</h1>
          <p class="subtitle">Inventory Management Report</p>
        </div>

        <div class="content-section">
          <div class="product-details">
            <h2 class="section-title">Product Details</h2>
            <div class="product-info">
              <div class="product-name">${data.product.name}</div>
              <div class="product-detail-row">
                <span class="detail-label">SKU:</span>
                <span class="detail-value">${data.product.sku}</span>
              </div>
              <div class="product-detail-row">
                <span class="detail-label">Category:</span>
                <span class="detail-value">${data.product.category}</span>
              </div>
              <div class="product-detail-row">
                <span class="detail-label">HSN Code:</span>
                <span class="detail-value">${data.product.hsn_code || 'N/A'}</span>
              </div>
              <div class="product-detail-row">
                <span class="detail-label">Unit:</span>
                <span class="detail-value">${data.product.unit}</span>
              </div>
              <div class="product-detail-row">
                <span class="detail-label">Tax Rate:</span>
                <span class="detail-value">${data.product.tax_rate}%</span>
              </div>
              <div class="product-detail-row">
                <span class="detail-label">Min Stock:</span>
                <span class="detail-value">${data.product.min_stock} ${data.product.unit}</span>
              </div>
              <div class="product-detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value" style="text-transform: capitalize;">${data.product.status}</span>
              </div>
            </div>
          </div>

          <div class="summary-section">
            <h2 class="section-title">Stock Summary</h2>
            <div class="summary-item">
              <div class="summary-label">Total Purchases</div>
              <div class="summary-value purchases">${data.totalPurchases} ${data.product.unit}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Total Sales</div>
              <div class="summary-value sales">${data.totalSales} ${data.product.unit}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Current Stock</div>
              <div class="summary-value current-stock">${data.currentStock} ${data.product.unit}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Total Entries</div>
              <div class="summary-value total-entries">${data.totalEntries}</div>
            </div>
          </div>
        </div>

        <div class="entries-section">
          <h2 class="section-title">Stock Register Entries</h2>
          <table class="entries-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Invoice</th>
                <th>Type</th>
                <th>Opening Stock</th>
                <th>Quantity</th>
                <th>Closing Stock</th>
              </tr>
            </thead>
            <tbody>
              ${data.entries.map(entry => `
                <tr>
                  <td>${formatDate(entry.date)}</td>
                  <td style="font-family: 'Courier New', monospace;">${formatInvoiceNumber(entry.invoice)}</td>
                  <td>
                    <span class="transaction-type ${entry.type}">${entry.type}</span>
                  </td>
                  <td>${entry.opening_stock} ${data.product.unit}</td>
                  <td class="${entry.type === 'purchase' ? 'quantity-positive' : 'quantity-negative'}">
                    ${entry.type === 'purchase' ? '+' : '-'}${entry.quantity} ${data.product.unit}
                  </td>
                  <td style="font-weight: bold; color: #2563eb;">${entry.closing_stock} ${data.product.unit}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="footer">
          <div class="footer-title">Bio Tech Centre</div>
          <div class="footer-subtitle">Stock Register Report</div>
          <div class="footer-date">Generated on ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}</div>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Fallback function to download as HTML if PDF generation fails
const downloadStockRegisterHTMLFallback = (htmlContent: string, productName: string) => {
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Stock_Register_${productName.replace(/[^a-zA-Z0-9\s]/g, '')}_${new Date().toISOString().split('T')[0]}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};