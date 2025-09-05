import jsPDF from 'jspdf';
import { StockTransaction } from '@/hooks/useStockLedger';
import { Product } from '@/hooks/useProducts';

export const generateStockRegisterPDF = (
  product: Product,
  transactions: StockTransaction[]
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Helper function to add text
  const addText = (text: string, x: number, y: number, options: any = {}) => {
    doc.setFontSize(options.fontSize || 10);
    doc.setTextColor(options.color || '#000000');
    doc.text(text, x, y);
  };

  // Helper function to add line
  const addLine = (x1: number, y1: number, x2: number, y2: number) => {
    doc.setDrawColor(0, 0, 0);
    doc.line(x1, y1, x2, y2);
  };

  // Helper function to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Helper function to get transaction type label
  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'purchase': return 'Purchase';
      case 'sale': return 'Sale';
      case 'adjustment': return 'Adjustment';
      case 'return': return 'Return';
      default: return type;
    }
  };

  // Calculate running balance
  const calculateRunningBalance = (transactions: StockTransaction[]) => {
    let balance = 0;
    return transactions.map(transaction => {
      balance += transaction.quantity_delta;
      return { ...transaction, running_balance: balance };
    });
  };

  const transactionsWithBalance = calculateRunningBalance(transactions);

  // Calculate summary data
  const totalPurchases = transactions
    .filter(t => t.transaction_type === 'purchase')
    .reduce((sum, t) => sum + t.quantity_delta, 0);
  
  const totalSales = Math.abs(transactions
    .filter(t => t.transaction_type === 'sale')
    .reduce((sum, t) => sum + t.quantity_delta, 0));

  // A4 margins - minimum 20mm on all sides for better spacing
  const margin = 20; // 20mm margins for better A4 compliance
  const contentWidth = pageWidth - (margin * 2);
  const leftX = margin;
  const rightX = pageWidth - margin - 80; // 80mm width for summary section

  // Header - Stock Register (H1)
  addText('STOCK REGISTER', pageWidth / 2, yPosition, { 
    fontSize: 24, 
    color: '#1e293b',
    align: 'center'
  });
  yPosition += 30;

  // Product name (left side) and Summary stats (right side)
  // Left side - Product name with proper spacing
  addText(product.name, leftX, yPosition, { fontSize: 18, color: '#1f2937' });
  addText(`SKU: ${product.sku}`, leftX, yPosition + 12, { fontSize: 12, color: '#6b7280' });
  
  // Right side - Summary stats with proper alignment
  addText('SUMMARY', rightX, yPosition, { fontSize: 14, color: '#374151' });
  addText(`Purchases: ${totalPurchases} ${product.unit}`, rightX, yPosition + 12, { fontSize: 11, color: '#059669' });
  addText(`Sales: ${totalSales} ${product.unit}`, rightX, yPosition + 24, { fontSize: 11, color: '#dc2626' });
  addText(`Closing: ${product.current_stock} ${product.unit}`, rightX, yPosition + 36, { fontSize: 11, color: '#1f2937' });
  
  yPosition += 50;

  // Transaction List
  if (transactions.length > 0) {
    // Column headers with proper A4 margins
    const colWidth = contentWidth / 5;
    addText('DATE', leftX, yPosition, { fontSize: 10, color: '#6b7280' });
    addText('INVOICE', leftX + colWidth, yPosition, { fontSize: 10, color: '#6b7280' });
    addText('TYPE', leftX + (colWidth * 2), yPosition, { fontSize: 10, color: '#6b7280' });
    addText('QTY', leftX + (colWidth * 3), yPosition, { fontSize: 10, color: '#6b7280' });
    addText('CLOSING', leftX + (colWidth * 4), yPosition, { fontSize: 10, color: '#6b7280' });
    yPosition += 10;

    transactionsWithBalance.forEach((transaction, index) => {
      // Check if we need a new page
      if (yPosition > pageHeight - margin - 30) {
        doc.addPage();
        yPosition = margin + 20;
      }

      // Transaction row
      const rowY = yPosition;
      
      // Date
      addText(formatDate(transaction.created_at), leftX, rowY, { fontSize: 9, color: '#1f2937' });
      
      // Invoice
      addText(transaction.reference_no || '-', leftX + colWidth, rowY, { fontSize: 9, color: '#1f2937' });
      
      // Type
      addText(getTransactionLabel(transaction.transaction_type), leftX + (colWidth * 2), rowY, { fontSize: 9, color: '#1f2937' });
      
      // Quantity
      const quantityText = `${transaction.quantity_delta > 0 ? '+' : ''}${transaction.quantity_delta} ${product.unit}`;
      addText(quantityText, leftX + (colWidth * 3), rowY, { 
        fontSize: 9, 
        color: transaction.transaction_type === 'sale' ? '#dc2626' : '#059669' 
      });
      
      // Closing Stock
      addText(`${transaction.running_balance} ${product.unit}`, leftX + (colWidth * 4), rowY, { fontSize: 9, color: '#1f2937' });
      
      yPosition += 8; // Space between rows
    });
  } else {
    // No transactions message
    addText('No stock transactions found for this product.', pageWidth / 2, yPosition, { 
      fontSize: 12, 
      color: '#6b7280',
      align: 'center'
    });
  }

  // Footer with proper A4 margins
  const footerY = pageHeight - margin;
  addText('Generated by GST Zen', pageWidth / 2, footerY, { 
    fontSize: 9, 
    color: '#9ca3af',
    align: 'center'
  });

  return doc;
};

export const downloadStockRegisterPDF = (
  product: Product,
  transactions: StockTransaction[]
) => {
  const doc = generateStockRegisterPDF(product, transactions);
  const fileName = `Stock_Register_${product.sku}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

export const generateStockRegisterPDFBlob = async (
  product: Product,
  transactions: StockTransaction[]
): Promise<Blob> => {
  const doc = generateStockRegisterPDF(product, transactions);
  return doc.output('blob');
};
