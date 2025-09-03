import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  hsn_code: string | null;
  unit: string;
  unit_price: number;
  tax_rate: number;
  current_stock: number;
  min_stock: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export const useProducts = () => {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Product[];
    },
  });
};

export const useProductsByCategory = (category?: string) => {
  return useQuery({
    queryKey: ["products", category],
    queryFn: async () => {
      let query = supabase.from("products").select("*");
      
      if (category && category !== "All") {
        query = query.eq("category", category);
      }
      
      const { data, error } = await query.order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Product[];
    },
  });
};

export const useAddProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (product: Omit<Product, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("products")
        .insert([product])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({
        title: "Success",
        description: "Product added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add product",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Product> & { id: string }) => {
      const { data, error } = await supabase
        .from("products")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update product",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      // First check if product is referenced in any invoices
      const { data: invoiceItems, error: checkError } = await supabase
        .from("invoice_items")
        .select("id, invoice_id")
        .eq("product_id", id)
        .limit(1);
      
      if (checkError) throw checkError;
      
      if (invoiceItems && invoiceItems.length > 0) {
        throw new Error("Cannot delete product that is referenced in existing invoices. Please remove it from all invoices first.");
      }
      
      // If no references, proceed with deletion
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);
      
      if (error) {
        // Handle specific foreign key constraint errors
        if (error.code === '23503') {
          throw new Error("Cannot delete product as it is being used in invoices or other records. Please remove all references first.");
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
    },
    onError: (error: Error) => {
      console.error('Product deletion error:', error);
      let errorMessage = "Failed to delete product";
      
      if (error.message.includes("referenced in existing invoices")) {
        errorMessage = "Cannot delete product that is used in invoices";
      } else if (error.message.includes("being used in invoices")) {
        errorMessage = "Product is referenced in invoices and cannot be deleted";
      } else if (error.code === '23503') {
        errorMessage = "Product cannot be deleted as it's referenced in other records";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Unable to Delete Product",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
};