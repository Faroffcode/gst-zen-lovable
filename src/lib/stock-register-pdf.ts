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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  // Header
  addText('STOCK REGISTER', pageWidth / 2, yPosition, { 
    fontSize: 18, 
    color: '#1e293b',
    align: 'center'
  });
  doc.setFontSize(18);
  doc.setTextColor('#1e293b');
  doc.text('STOCK REGISTER', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Product Information
  addText(`Product: ${product.name}`, 20, yPosition, { fontSize: 14, color: '#374151' });
  yPosition += 8;
  addText(`SKU: ${product.sku}`, 20, yPosition, { fontSize: 12, color: '#6b7280' });
  yPosition += 6;
  addText(`Current Stock: ${product.current_stock} ${product.unit}`, 20, yPosition, { fontSize: 12, color: '#6b7280' });
  yPosition += 6;
  addText(`Unit Price: ${formatCurrency(product.unit_price)}`, 20, yPosition, { fontSize: 12, color: '#6b7280' });
  yPosition += 6;
  addText(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 20, yPosition, { fontSize: 10, color: '#9ca3af' });
  yPosition += 15;

  // Summary Section
  if (transactions.length > 0) {
    addText('SUMMARY', 20, yPosition, { fontSize: 14, color: '#374151' });
    yPosition += 10;

    const totalPurchases = transactions
      .filter(t => t.transaction_type === 'purchase')
      .reduce((sum, t) => sum + t.quantity_delta, 0);
    
    const totalSales = Math.abs(transactions
      .filter(t => t.transaction_type === 'sale')
      .reduce((sum, t) => sum + t.quantity_delta, 0));

    addText(`Total Purchases: ${totalPurchases} ${product.unit}`, 20, yPosition, { fontSize: 11 });
    yPosition += 6;
    addText(`Total Sales: ${totalSales} ${product.unit}`, 20, yPosition, { fontSize: 11 });
    yPosition += 6;
    addText(`Current Balance: ${product.current_stock} ${product.unit}`, 20, yPosition, { fontSize: 11 });
    yPosition += 6;
    addText(`Total Transactions: ${transactions.length}`, 20, yPosition, { fontSize: 11 });
    yPosition += 15;
  }

  // Table Header
  if (transactions.length > 0) {
    addLine(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 5;
    
    // Table headers
    const headers = ['Date', 'Type', 'Ref No', 'Quantity', 'Unit Cost', 'Total Value', 'Balance', 'Notes'];
    const colWidths = [25, 20, 25, 20, 20, 20, 15, 30];
    let xPosition = 20;

    headers.forEach((header, index) => {
      addText(header, xPosition, yPosition, { fontSize: 9, color: '#374151' });
      xPosition += colWidths[index];
    });
    
    yPosition += 8;
    addLine(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 5;

    // Table rows
    transactionsWithBalance.forEach((transaction, index) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 20;
      }

      xPosition = 20;
      
      // Date
      addText(formatDate(transaction.created_at), xPosition, yPosition, { fontSize: 8 });
      xPosition += colWidths[0];
      
      // Type
      addText(getTransactionLabel(transaction.transaction_type), xPosition, yPosition, { fontSize: 8 });
      xPosition += colWidths[1];
      
      // Reference Number
      addText(transaction.reference_no || '-', xPosition, yPosition, { fontSize: 8 });
      xPosition += colWidths[2];
      
      // Quantity
      const quantityText = `${transaction.quantity_delta > 0 ? '+' : ''}${transaction.quantity_delta}`;
      addText(quantityText, xPosition, yPosition, { 
        fontSize: 8, 
        color: transaction.quantity_delta > 0 ? '#059669' : '#dc2626' 
      });
      xPosition += colWidths[3];
      
      // Unit Cost
      addText(transaction.unit_cost ? formatCurrency(transaction.unit_cost) : '-', xPosition, yPosition, { fontSize: 8 });
      xPosition += colWidths[4];
      
      // Total Value
      const totalValue = transaction.unit_cost ? transaction.unit_cost * Math.abs(transaction.quantity_delta) : 0;
      addText(transaction.unit_cost ? formatCurrency(totalValue) : '-', xPosition, yPosition, { fontSize: 8 });
      xPosition += colWidths[5];
      
      // Balance
      addText(`${transaction.running_balance}`, xPosition, yPosition, { fontSize: 8 });
      xPosition += colWidths[6];
      
      // Notes
      const notes = transaction.notes || '-';
      const truncatedNotes = notes.length > 25 ? notes.substring(0, 25) + '...' : notes;
      addText(truncatedNotes, xPosition, yPosition, { fontSize: 8 });
      
      yPosition += 6;
    });

    // Final line
    addLine(20, yPosition, pageWidth - 20, yPosition);
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
