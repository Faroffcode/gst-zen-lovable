import { supabase } from "@/integrations/supabase/client";

export interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

// Upload invoice PDF to Cloudflare R2
export const uploadInvoicePDF = async (
  invoiceNumber: string,
  pdfBlob: Blob
): Promise<UploadResult> => {
  try {
    // Convert blob to base64
    const buffer = await pdfBlob.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);
    const base64String = btoa(String.fromCharCode.apply(null, Array.from(uint8Array)));

    const { data, error } = await supabase.functions.invoke('invoice-storage', {
      body: {
        operation: 'upload',
        invoiceNumber,
        pdfData: base64String,
        contentType: 'application/pdf',
      },
    });

    if (error) {
      console.error('Failed to upload invoice to R2:', error);
      return {
        success: false,
        error: error.message || 'Upload failed',
      };
    }

    return data;
  } catch (error: any) {
    console.error('Failed to upload invoice to R2:', error);
    return {
      success: false,
      error: error.message || 'Upload failed',
    };
  }
};

// Generate a signed URL for downloading invoice
export const getInvoiceDownloadUrl = async (
  invoiceNumber: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<string | null> => {
  try {
    const { data, error } = await supabase.functions.invoke('invoice-storage', {
      body: {
        operation: 'getDownloadUrl',
        invoiceNumber,
        expiresIn,
      },
    });

    if (error) {
      console.error('Failed to generate download URL:', error);
      return null;
    }

    return data.success ? data.url : null;
  } catch (error: any) {
    console.error('Failed to generate download URL:', error);
    return null;
  }
};

// Delete invoice from R2 storage
export const deleteInvoicePDF = async (invoiceNumber: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke('invoice-storage', {
      body: {
        operation: 'delete',
        invoiceNumber,
      },
    });

    if (error) {
      console.error('Failed to delete invoice from R2:', error);
      return false;
    }

    return data.success || false;
  } catch (error: any) {
    console.error('Failed to delete invoice from R2:', error);
    return false;
  }
};

// Check if R2 is configured
export const isR2Configured = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke('invoice-storage', {
      body: {
        operation: 'checkConfig',
      },
    });

    if (error) {
      console.error('Failed to check R2 configuration:', error);
      return false;
    }

    return data.configured || false;
  } catch (error: any) {
    console.error('Failed to check R2 configuration:', error);
    return false;
  }
};

// Convert HTML content to PDF blob (using browser's print functionality)
export const htmlToPdfBlob = async (htmlContent: string): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    // Create a hidden iframe for PDF generation
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    iframe.style.width = '210mm'; // A4 width
    iframe.style.height = '297mm'; // A4 height
    
    document.body.appendChild(iframe);
    
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      document.body.removeChild(iframe);
      reject(new Error('Failed to access iframe document'));
      return;
    }
    
    iframeDoc.open();
    iframeDoc.write(htmlContent);
    iframeDoc.close();
    
    // Wait for content to load
    iframe.onload = () => {
      try {
        // Use the browser's print functionality to generate PDF
        // Note: This is a simplified approach. For production, consider using libraries like jsPDF or Puppeteer
        const printWindow = iframe.contentWindow;
        if (printWindow) {
          // For now, we'll create a simple blob with the HTML content
          // In a real implementation, you'd use a proper HTML-to-PDF conversion
          const blob = new Blob([htmlContent], { type: 'text/html' });
          document.body.removeChild(iframe);
          resolve(blob);
        } else {
          document.body.removeChild(iframe);
          reject(new Error('Failed to access iframe window'));
        }
      } catch (error) {
        document.body.removeChild(iframe);
        reject(error);
      }
    };
    
    iframe.onerror = () => {
      document.body.removeChild(iframe);
      reject(new Error('Failed to load iframe content'));
    };
  });
};