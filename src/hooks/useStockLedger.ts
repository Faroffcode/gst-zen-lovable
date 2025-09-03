import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface StockTransaction {
  id: string;
  product_id: string;
  transaction_type: "purchase" | "sale" | "adjustment" | "return";
  quantity_delta: number;
  unit_cost: number | null;
  reference_no: string | null;
  notes: string | null;
  created_at: string;
  product?: {
    name: string;
    sku: string;
    unit: string;
  };
}

export interface PurchaseData {
  product_id: string;
  quantity_delta: number;
  unit_cost: number;
  reference_no?: string;
  notes?: string;
}

export const useStockTransactions = () => {
  return useQuery({
    queryKey: ["stock-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock_ledger")
        .select(`
          *,
          product:products(name, sku, unit)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as StockTransaction[];
    },
  });
};

export const useProductStockTransactions = (productId: string) => {
  return useQuery({
    queryKey: ["stock-transactions", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock_ledger")
        .select(`
          *,
          product:products(name, sku, unit)
        `)
        .eq("product_id", productId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as StockTransaction[];
    },
    enabled: !!productId,
  });
};

export const useAddStockTransaction = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (transaction: Omit<StockTransaction, "id" | "created_at" | "product">) => {
      const { data, error } = await supabase
        .from("stock_ledger")
        .insert([transaction])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({
        title: "Success",
        description: "Stock transaction recorded successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record stock transaction",
        variant: "destructive",
      });
    },
  });
};

export const useRecordPurchase = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (purchaseData: PurchaseData) => {
      const { data, error } = await supabase
        .from("stock_ledger")
        .insert([{
          ...purchaseData,
          transaction_type: "purchase" as const,
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({
        title: "Success",
        description: "Purchase recorded successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record purchase",
        variant: "destructive",
      });
    },
  });
};

export interface SaleData {
  product_id: string;
  quantity_delta: number; // This will be negative for sales
  reference_no?: string;
  notes?: string;
}

export const useRecordSale = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (saleData: SaleData) => {
      const { data, error } = await supabase
        .from("stock_ledger")
        .insert([{
          ...saleData,
          transaction_type: "sale" as const,
          unit_cost: null, // Sale transactions don't have unit cost
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record sale transaction",
        variant: "destructive",
      });
    },
  });
};

export const useRecordMultipleSales = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (salesData: SaleData[]) => {
      const transactionsToInsert = salesData.map(sale => ({
        ...sale,
        transaction_type: "sale" as const,
        unit_cost: null,
      }));

      const { data, error } = await supabase
        .from("stock_ledger")
        .insert(transactionsToInsert)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record sale transactions",
        variant: "destructive",
      });
    },
  });
};