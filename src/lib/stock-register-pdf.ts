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

  // Header - Stock Register
  addText('STOCK REGISTER', pageWidth / 2, yPosition, { 
    fontSize: 20, 
    color: '#1e293b',
    align: 'center'
  });
  yPosition += 20;

  // Product name (left) and Summary stats (right)
  const leftX = 20;
  const rightX = pageWidth - 120;
  
  // Left side - Product name
  addText(product.name, leftX, yPosition, { fontSize: 16, color: '#1f2937' });
  addText(`SKU: ${product.sku}`, leftX, yPosition + 8, { fontSize: 10, color: '#6b7280' });
  
  // Right side - Summary stats
  addText('SUMMARY', rightX, yPosition, { fontSize: 12, color: '#374151' });
  addText(`Purchases: ${totalPurchases} ${product.unit}`, rightX, yPosition + 8, { fontSize: 10, color: '#059669' });
  addText(`Sales: ${totalSales} ${product.unit}`, rightX, yPosition + 16, { fontSize: 10, color: '#dc2626' });
  addText(`Closing: ${product.current_stock} ${product.unit}`, rightX, yPosition + 24, { fontSize: 10, color: '#1f2937' });
  
  yPosition += 35;

  // Transaction List
  if (transactions.length > 0) {
    // Column headers
    const colWidth = (pageWidth - 40) / 5;
    addText('DATE', 20, yPosition, { fontSize: 8, color: '#6b7280' });
    addText('INVOICE', 20 + colWidth, yPosition, { fontSize: 8, color: '#6b7280' });
    addText('TYPE', 20 + (colWidth * 2), yPosition, { fontSize: 8, color: '#6b7280' });
    addText('QTY', 20 + (colWidth * 3), yPosition, { fontSize: 8, color: '#6b7280' });
    addText('CLOSING', 20 + (colWidth * 4), yPosition, { fontSize: 8, color: '#6b7280' });
    yPosition += 8;

    transactionsWithBalance.forEach((transaction, index) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
      }

      // Transaction row
      const rowY = yPosition;
      
      // Date
      addText(formatDate(transaction.created_at), 20, rowY, { fontSize: 8, color: '#1f2937' });
      
      // Invoice
      addText(transaction.reference_no || '-', 20 + colWidth, rowY, { fontSize: 8, color: '#1f2937' });
      
      // Type
      addText(getTransactionLabel(transaction.transaction_type), 20 + (colWidth * 2), rowY, { fontSize: 8, color: '#1f2937' });
      
      // Quantity
      const quantityText = `${transaction.quantity_delta > 0 ? '+' : ''}${transaction.quantity_delta} ${product.unit}`;
      addText(quantityText, 20 + (colWidth * 3), rowY, { 
        fontSize: 8, 
        color: transaction.transaction_type === 'sale' ? '#dc2626' : '#059669' 
      });
      
      // Closing Stock
      addText(`${transaction.running_balance} ${product.unit}`, 20 + (colWidth * 4), rowY, { fontSize: 8, color: '#1f2937' });
      
      yPosition += 6; // Minimal space between rows
    });
  } else {
    // No transactions message
    addText('No stock transactions found for this product.', pageWidth / 2, yPosition, { 
      fontSize: 12, 
      color: '#6b7280',
      align: 'center'
    });
  }

  // Footer
  const footerY = pageHeight - 20;
  addText('Generated by GST Zen', pageWidth / 2, footerY, { 
    fontSize: 8, 
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
