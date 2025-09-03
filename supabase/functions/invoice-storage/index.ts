import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "https://esm.sh/@aws-sdk/client-s3@3.879.0";
import { getSignedUrl } from "https://esm.sh/@aws-sdk/s3-request-presigner@3.879.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const accountId = Deno.env.get('CLOUDFLARE_R2_ACCOUNT_ID');
    const accessKeyId = Deno.env.get('CLOUDFLARE_R2_ACCESS_KEY_ID');
    const secretAccessKey = Deno.env.get('CLOUDFLARE_R2_SECRET_ACCESS_KEY');
    const bucketName = Deno.env.get('CLOUDFLARE_R2_BUCKET_NAME');

    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
      console.error('Missing Cloudflare R2 configuration');
      return new Response(
        JSON.stringify({ error: 'Cloudflare R2 configuration is missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Cloudflare R2 client
    const r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const { operation, invoiceNumber, expiresIn = 3600 } = await req.json();

    switch (operation) {
      case 'upload': {
        const { pdfData, contentType = 'application/pdf' } = await req.json();
        
        if (!pdfData) {
          return new Response(
            JSON.stringify({ error: 'PDF data is required for upload' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const key = `invoices/${invoiceNumber}.pdf`;
        
        // Convert base64 to buffer
        const buffer = Uint8Array.from(atob(pdfData), c => c.charCodeAt(0));

        const command = new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: buffer,
          ContentType: contentType,
          Metadata: {
            'invoice-number': invoiceNumber,
            'uploaded-at': new Date().toISOString(),
          },
        });

        await r2Client.send(command);

        // Generate public URL
        const publicUrl = `https://${bucketName}.${accountId}.r2.cloudflarestorage.com/${key}`;

        console.log(`Successfully uploaded invoice ${invoiceNumber} to R2`);

        return new Response(JSON.stringify({
          success: true,
          url: publicUrl,
          key: key,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'getDownloadUrl': {
        const key = `invoices/${invoiceNumber}.pdf`;
        
        const command = new GetObjectCommand({
          Bucket: bucketName,
          Key: key,
        });

        const signedUrl = await getSignedUrl(r2Client, command, { expiresIn });
        
        console.log(`Generated download URL for invoice ${invoiceNumber}`);

        return new Response(JSON.stringify({
          success: true,
          url: signedUrl,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'delete': {
        const key = `invoices/${invoiceNumber}.pdf`;
        
        const command = new DeleteObjectCommand({
          Bucket: bucketName,
          Key: key,
        });

        await r2Client.send(command);
        
        console.log(`Successfully deleted invoice ${invoiceNumber} from R2`);

        return new Response(JSON.stringify({
          success: true,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'checkConfig': {
        // If we reach here, all config is available
        return new Response(JSON.stringify({
          configured: true,
          accountId: accountId.slice(0, 8) + '...',
          bucketName,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid operation. Supported: upload, getDownloadUrl, delete, checkConfig' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error: any) {
    console.error('Error in invoice-storage function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'An error occurred',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});