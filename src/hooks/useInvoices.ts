import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  guest_address: string | null;
  guest_gstin: string | null;
  invoice_date: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  customer?: {
    name: string;
    gstin: string | null;
  };
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  product_id?: string; // Optional for custom products
  quantity: number;
  unit_price: number;
  tax_rate: number;
  line_total: number;
  created_at: string;
  product?: {
    name: string;
    sku: string;
    unit: string;
  };
}

export const useInvoices = () => {
  return useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          customer:customers(name, gstin)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Invoice[];
    },
  });
};

export const useInvoice = (id: string) => {
  return useQuery({
    queryKey: ["invoice", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          customer:customers(*),
          invoice_items(
            *,
            product:products(name, sku, unit)
          )
        `)
        .eq("id", id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateInvoice = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (invoiceData: {
      customer_id?: string;
      guest_name?: string;
      guest_email?: string;
      guest_phone?: string;
      guest_address?: string;
      guest_gstin?: string;
      invoice_date: string;
      notes?: string;
      items: Array<{
        product_id?: string;
        custom_product_name?: string;
        quantity: number;
        unit_price: number;
        tax_rate: number;
      }>;
    }) => {
      // Validate stock availability for products
      const itemsWithProducts = invoiceData.items.filter(item => item.product_id);
      if (itemsWithProducts.length > 0) {
        const productIds = itemsWithProducts.map(item => item.product_id!);
        const { data: products, error: productError } = await supabase
          .from("products")
          .select("id, name, current_stock")
          .in("id", productIds);
        
        if (productError) throw productError;
        
        // Check if any item exceeds available stock
        const stockErrors: string[] = [];
        for (const item of itemsWithProducts) {
          const product = products?.find(p => p.id === item.product_id);
          if (product && item.quantity > product.current_stock) {
            stockErrors.push(`${product.name}: Requested ${item.quantity}, Available ${product.current_stock}`);
          }
        }
        
        if (stockErrors.length > 0) {
          throw new Error(`Insufficient stock:\n${stockErrors.join('\n')}`);
        }
      }
      // Generate invoice number with fallback
      let invoiceNumber: string;
      
      try {
        // Try to use the database function first
        const { data: dbInvoiceNumber, error: numberError } = await supabase
          .rpc('generate_invoice_number');
        
        if (numberError || !dbInvoiceNumber) {
          throw new Error(numberError?.message || 'Database function returned null');
        }
        
        invoiceNumber = dbInvoiceNumber;
        console.log('Generated invoice number using database function:', invoiceNumber);
      } catch (dbError) {
        // Fallback: Generate invoice number locally
        console.warn('Database function failed, generating invoice number locally:', dbError);
        
        try {
          // Get existing invoice numbers to find the next number
          const { data: existingInvoices, error: fetchError } = await supabase
            .from('invoices')
            .select('invoice_number')
            .order('created_at', { ascending: false })
            .limit(1);
          
          if (fetchError) {
            console.warn('Could not fetch existing invoices, starting from 1:', fetchError);
          }
          
          let nextNumber = 1;
          if (existingInvoices && existingInvoices.length > 0) {
            const lastInvoice = existingInvoices[0].invoice_number;
            const match = lastInvoice?.match(/INV-(\d+)/);
            if (match) {
              nextNumber = parseInt(match[1]) + 1;
            }
          }
          
          invoiceNumber = `INV-${nextNumber.toString().padStart(4, '0')}`;
          console.log('Generated invoice number locally:', invoiceNumber);
        } catch (fallbackError) {
          // Final fallback: use timestamp
          const timestamp = Date.now().toString().slice(-4);
          invoiceNumber = `INV-${timestamp}`;
          console.warn('Using timestamp-based invoice number:', invoiceNumber);
        }
      }

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert([{
          invoice_number: invoiceNumber,
          customer_id: invoiceData.customer_id || null,
          guest_name: invoiceData.guest_name || null,
          guest_email: invoiceData.guest_email || null,
          guest_phone: invoiceData.guest_phone || null,
          guest_address: invoiceData.guest_address || null,
          guest_gstin: invoiceData.guest_gstin || null,
          invoice_date: invoiceData.invoice_date,
          notes: invoiceData.notes,
        }])
        .select()
        .single();
      
      if (invoiceError) throw invoiceError;

      // Create invoice items
      const itemsToInsert = invoiceData.items.map(item => ({
        invoice_id: invoice.id,
        product_id: item.product_id || null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate,
      }));

      const { error: itemsError } = await supabase
        .from("invoice_items")
        .insert(itemsToInsert);
      
      if (itemsError) throw itemsError;

      // Record stock transactions for products (only for items with product_id)
      const stockTransactions = invoiceData.items
        .filter(item => item.product_id) // Only process items with actual product IDs
        .map(item => ({
          product_id: item.product_id!,
          transaction_type: "sale" as const,
          quantity_delta: -item.quantity, // Negative for sales (reduce stock)
          unit_cost: null,
          reference_no: invoiceNumber,
          notes: `Sale from invoice ${invoiceNumber}`,
        }));

      if (stockTransactions.length > 0) {
        const { error: stockError } = await supabase
          .from("stock_ledger")
          .insert(stockTransactions);
        
        if (stockError) throw stockError;
      }

      return invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast({
        title: "Success",
        description: "Invoice created successfully",
      });
    },
    onError: (error: any) => {
      console.error('Invoice creation failed:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        full: error
      });
      
      toast({
        title: "Error",
        description: error.message || "Failed to create invoice",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateInvoice = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Invoice> & { id: string }) => {
      const { data, error } = await supabase
        .from("invoices")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast({
        title: "Success",
        description: "Invoice updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update invoice",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteInvoice = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      // First, get the invoice details with items to restore inventory
      const { data: invoiceDetails, error: fetchError } = await supabase
        .from("invoices")
        .select(`
          *,
          invoice_items(
            id,
            product_id,
            quantity
          )
        `)
        .eq("id", id)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Create inventory restoration transactions for products
      const inventoryRestorations = invoiceDetails.invoice_items
        .filter((item: any) => item.product_id) // Only for actual products
        .map((item: any) => ({
          product_id: item.product_id,
          transaction_type: "adjustment" as const,
          quantity_delta: item.quantity, // Positive to restore stock
          unit_cost: null,
          reference_no: invoiceDetails.invoice_number,
          notes: `Stock restored from deleted invoice ${invoiceDetails.invoice_number}`,
        }));
      
      // Delete the invoice (cascade will delete items)
      const { error } = await supabase
        .from("invoices")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      
      // Restore inventory
      if (inventoryRestorations.length > 0) {
        const { error: stockError } = await supabase
          .from("stock_ledger")
          .insert(inventoryRestorations);
        
        if (stockError) throw stockError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["stock-transactions"] });
      toast({
        title: "Success",
        description: "Invoice deleted and inventory restored successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete invoice",
        variant: "destructive",
      });
    },
  });
};