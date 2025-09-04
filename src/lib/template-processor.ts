import { Invoice, InvoiceItem } from "@/hooks/useInvoices";

export interface InvoiceSettings {
  companyName: string;
  companyTagline: string;
  logoText: string;
  primaryColor: string;
  useCustomTemplate: boolean;
  customTemplateFile: File | null;
  invoicePrefix: string;
  nextInvoiceNumber: string;
  showCompanyLogo: boolean;
  showFooter: boolean;
  footerText: string;
  taxDisplayFormat: 'combined' | 'separate';
  currencySymbol: string;
  dateFormat: string;
}

// Get saved invoice settings from localStorage
export const getInvoiceSettings = (): InvoiceSettings => {
  const defaultSettings: InvoiceSettings = {
    companyName: "BIO TECH CENTRE",
    companyTagline: "Professional",
    logoText: "BTC",
    primaryColor: "#2563eb",
    useCustomTemplate: false,
    customTemplateFile: null,
    invoicePrefix: "INV",
    nextInvoiceNumber: "001",
    showCompanyLogo: true,
    showFooter: true,
    footerText: "Thank you for your business!",
    taxDisplayFormat: 'separate',
    currencySymbol: "₹",
    dateFormat: "DD/MM/YYYY",
  };

  try {
    const saved = localStorage.getItem('invoiceSettings');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...defaultSettings, ...parsed };
    }
  } catch (error) {
    console.error('Error loading invoice settings:', error);
  }

  return defaultSettings;
};

// Format currency based on settings
export const formatCurrency = (amount: number, settings?: InvoiceSettings) => {
  const invoiceSettings = settings || getInvoiceSettings();
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: invoiceSettings.currencySymbol === '₹' ? 'INR' : 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
};

// Format date based on settings
export const formatDate = (dateString: string, settings?: InvoiceSettings) => {
  const invoiceSettings = settings || getInvoiceSettings();
  const date = new Date(dateString);
  
  switch (invoiceSettings.dateFormat) {
    case 'MM/DD/YYYY':
      return date.toLocaleDateString('en-US');
    case 'YYYY-MM-DD':
      return date.toISOString().split('T')[0];
    case 'DD/MM/YYYY':
    default:
      return date.toLocaleDateString('en-GB');
  }
};

// Process custom template with invoice data
export const processCustomTemplate = async (
  templateFile: File,
  invoice: Invoice,
  invoiceItems: InvoiceItem[],
  settings: InvoiceSettings
): Promise<string> => {
  try {
    // For now, we'll return a message about custom template processing
    // In a real implementation, you would:
    // 1. Read the PDF template file
    // 2. Extract text content or use PDF manipulation library
    // 3. Replace placeholders with actual data
    // 4. Generate new PDF
    
    // Processing custom template: templateFile.name
    
    // Placeholder for custom template processing
    return `
      <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
        <h2>Custom Template Processing</h2>
        <p>Template: ${templateFile.name}</p>
        <p>Invoice: ${invoice.invoice_number}</p>
        <p>Total: ${formatCurrency(invoice.total_amount, settings)}</p>
        <p><em>Custom template processing would replace placeholders with actual invoice data.</em></p>
        <p><em>This feature requires PDF manipulation libraries like PDF-lib or similar.</em></p>
      </div>
    `;
  } catch (error) {
    console.error('Error processing custom template:', error);
    throw new Error('Failed to process custom template. Using default template instead.');
  }
};

// Replace placeholders in template content
export const replacePlaceholders = (
  content: string,
  invoice: Invoice,
  invoiceItems: InvoiceItem[],
  settings: InvoiceSettings
): string => {
  const placeholders = {
    '{{COMPANY_NAME}}': settings.companyName,
    '{{COMPANY_TAGLINE}}': settings.companyTagline,
    '{{LOGO_TEXT}}': settings.logoText,
    '{{INVOICE_NUMBER}}': invoice.invoice_number,
    '{{INVOICE_DATE}}': formatDate(invoice.invoice_date, settings),
    '{{CUSTOMER_NAME}}': invoice.customer?.name || invoice.guest_name || "Guest Customer",
    '{{CUSTOMER_EMAIL}}': (invoice.customer as { email?: string })?.email || invoice.guest_email || '',
    '{{CUSTOMER_PHONE}}': (invoice.customer as { phone?: string })?.phone || invoice.guest_phone || '',
    '{{CUSTOMER_ADDRESS}}': (invoice.customer as { address?: string })?.address || invoice.guest_address || '',
    '{{CUSTOMER_CITY}}': (invoice.customer as { city?: string })?.city || '',
    '{{CUSTOMER_STATE}}': (invoice.customer as { state?: string })?.state || '',
    '{{CUSTOMER_PINCODE}}': (invoice.customer as { pincode?: string })?.pincode || '',
    '{{CUSTOMER_GSTIN}}': invoice.customer?.gstin || invoice.guest_gstin || '',
    '{{SUBTOTAL}}': formatCurrency(invoice.subtotal, settings),
    '{{TAX_AMOUNT}}': formatCurrency(invoice.tax_amount, settings),
    '{{TOTAL_AMOUNT}}': formatCurrency(invoice.total_amount, settings),
    '{{FOOTER_TEXT}}': settings.footerText,
    '{{PRIMARY_COLOR}}': settings.primaryColor,
  };

  // Generate items table
  const itemsTable = invoiceItems.map(item => {
    const totalAmount = item.quantity * item.unit_price;
    return `
    <tr>
      <td>${item.product?.name}</td>
      <td>${item.quantity} ${item.product?.unit}</td>
      <td>${formatCurrency(item.unit_price, settings)}</td>
      <td>${item.tax_rate}%</td>
      <td>${formatCurrency(totalAmount, settings)}</td>
    </tr>
  `;
  }).join('');

  placeholders['{{ITEMS_TABLE}}'] = itemsTable;

  // Replace all placeholders
  let processedContent = content;
  Object.entries(placeholders).forEach(([placeholder, value]) => {
    processedContent = processedContent.replace(new RegExp(placeholder, 'g'), value);
  });

  return processedContent;
};