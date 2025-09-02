import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  gstin: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export const useCustomers = () => {
  return useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Customer[];
    },
  });
};

export const useAddCustomer = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (customer: Omit<Customer, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("customers")
        .insert([customer])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({
        title: "Success",
        description: "Customer added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add customer",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Customer> & { id: string }) => {
      const { data, error } = await supabase
        .from("customers")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({
        title: "Success",
        description: "Customer updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update customer",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      // First check if customer is referenced in any invoices
      const { data: invoices, error: checkError } = await supabase
        .from("invoices")
        .select("id, invoice_number")
        .eq("customer_id", id)
        .limit(1);
      
      if (checkError) throw checkError;
      
      if (invoices && invoices.length > 0) {
        throw new Error("Cannot delete customer that has existing invoices. Please delete all invoices for this customer first.");
      }
      
      // If no references, proceed with deletion
      const { error } = await supabase
        .from("customers")
        .delete()
        .eq("id", id);
      
      if (error) {
        // Handle specific foreign key constraint errors
        if (error.code === '23503') {
          throw new Error("Cannot delete customer as they have associated invoices or other records. Please remove all references first.");
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({
        title: "Success",
        description: "Customer deleted successfully",
      });
    },
    onError: (error: any) => {
      console.error('Customer deletion error:', error);
      let errorMessage = "Failed to delete customer";
      
      if (error.message.includes("existing invoices")) {
        errorMessage = "Cannot delete customer with existing invoices";
      } else if (error.message.includes("associated invoices")) {
        errorMessage = "Customer has associated records and cannot be deleted";
      } else if (error.code === '23503') {
        errorMessage = "Customer cannot be deleted as they're referenced in other records";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Unable to Delete Customer",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
};