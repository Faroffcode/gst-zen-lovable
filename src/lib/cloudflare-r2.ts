import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Cloudflare R2 configuration
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: import.meta.env.VITE_CLOUDFLARE_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_CLOUDFLARE_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = import.meta.env.VITE_CLOUDFLARE_BUCKET_NAME;

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
    if (!BUCKET_NAME || !import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID) {
      throw new Error('Cloudflare R2 configuration is missing');
    }

    const key = `invoices/${invoiceNumber}.pdf`;
    const buffer = await pdfBlob.arrayBuffer();

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: new Uint8Array(buffer),
      ContentType: 'application/pdf',
      Metadata: {
        'invoice-number': invoiceNumber,
        'uploaded-at': new Date().toISOString(),
      },
    });

    await r2Client.send(command);

    // Generate public URL
    const publicUrl = `https://${BUCKET_NAME}.${import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;

    return {
      success: true,
      url: publicUrl,
      key: key,
    };
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
    if (!BUCKET_NAME || !import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID) {
      throw new Error('Cloudflare R2 configuration is missing');
    }

    const key = `invoices/${invoiceNumber}.pdf`;
    
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const signedUrl = await getSignedUrl(r2Client, command, { expiresIn });
    return signedUrl;
  } catch (error: any) {
    console.error('Failed to generate download URL:', error);
    return null;
  }
};

// Delete invoice from R2 storage
export const deleteInvoicePDF = async (invoiceNumber: string): Promise<boolean> => {
  try {
    if (!BUCKET_NAME || !import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID) {
      throw new Error('Cloudflare R2 configuration is missing');
    }

    const key = `invoices/${invoiceNumber}.pdf`;
    
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await r2Client.send(command);
    return true;
  } catch (error: any) {
    console.error('Failed to delete invoice from R2:', error);
    return false;
  }
};

// Check if R2 is configured
export const isR2Configured = (): boolean => {
  return !!(
    import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID &&
    import.meta.env.VITE_CLOUDFLARE_ACCESS_KEY_ID &&
    import.meta.env.VITE_CLOUDFLARE_SECRET_ACCESS_KEY &&
    import.meta.env.VITE_CLOUDFLARE_BUCKET_NAME
  );
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