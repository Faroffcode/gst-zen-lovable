import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface StockRegisterEntry {
  id: string;
  product_id: string;
  date: string;
  invoice: string;
  type: 'purchase' | 'sale';
  opening_stock: number;
  quantity: number;
  closing_stock: number;
  created_at: string;
}

export interface CreateStockRegisterEntry {
  product_id: string;
  date: string;
  invoice: string;
  type: 'purchase' | 'sale';
  quantity: number;
}

// Get stock register entries for a product with pagination
export const useStockRegister = (productId: string, page: number = 1, pageSize: number = 10) => {
  return useQuery({
    queryKey: ["stock-register", productId, page, pageSize],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      const { data, error, count } = await supabase
        .from("stock_register")
        .select("*", { count: 'exact' })
        .eq("product_id", productId)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
        .range(from, to);
      
      if (error) throw error;
      
      return {
        data: data as StockRegisterEntry[],
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
        currentPage: page,
        pageSize
      };
    },
    enabled: !!productId,
  });
};

// Get last closing stock for a product
export const useLastClosingStock = (productId: string) => {
  return useQuery({
    queryKey: ["last-closing-stock", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc("get_last_closing_stock", { p_product_id: productId });
      
      if (error) throw error;
      return data as number;
    },
    enabled: !!productId,
  });
};

// Add new stock register entry
export const useAddStockRegisterEntry = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (entry: CreateStockRegisterEntry) => {
      // First, try to insert using the database function
      const { data, error } = await supabase
        .rpc("insert_stock_register_entry", {
          p_product_id: entry.product_id,
          p_date: entry.date,
          p_invoice: entry.invoice,
          p_type: entry.type,
          p_quantity: entry.quantity
        });
      
      if (error) {
        // If the function fails, try manual approach
        console.error('Database function failed, trying manual approach:', error);
        
        // Get current stock
        const { data: currentProduct } = await supabase
          .from('products')
          .select('current_stock')
          .eq('id', entry.product_id)
          .single();
        
        const opening_stock = currentProduct?.current_stock || 0;
        const closing_stock = entry.type === 'purchase' 
          ? opening_stock + entry.quantity 
          : opening_stock - entry.quantity;
        
        if (closing_stock < 0) {
          throw new Error(`Insufficient stock. Available: ${opening_stock}, Required: ${entry.quantity}`);
        }
        
        // Insert stock register entry manually
        const { data: insertData, error: insertError } = await supabase
          .from('stock_register')
          .insert({
            product_id: entry.product_id,
            date: entry.date,
            invoice: entry.invoice,
            type: entry.type,
            opening_stock,
            quantity: entry.quantity,
            closing_stock
          })
          .select()
          .single();
        
        if (insertError) throw insertError;
        
        // Update product stock manually
        const { error: updateError } = await supabase
          .from('products')
          .update({ current_stock: closing_stock })
          .eq('id', entry.product_id);
        
        if (updateError) throw updateError;
        
        return insertData.id;
      }
      
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate all related queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ["stock-register", variables.product_id] });
      queryClient.invalidateQueries({ queryKey: ["last-closing-stock", variables.product_id] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products", variables.product_id] });
      
      // Force refetch of products to ensure current stock is updated
      queryClient.refetchQueries({ queryKey: ["products"] });
      
      toast({
        title: "Success",
        description: "Stock register entry added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add stock register entry",
        variant: "destructive",
      });
    },
  });
};
