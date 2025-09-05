import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Unit {
  id: string;
  name: string;
  abbreviation: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateUnitData {
  name: string;
  abbreviation: string;
  description?: string;
}

export interface UpdateUnitData {
  name?: string;
  abbreviation?: string;
  description?: string;
}

export const useUnits = () => {
  return useQuery({
    queryKey: ["units"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("units")
        .select("*")
        .order("name", { ascending: true });
      
      if (error) throw error;
      return data as Unit[];
    },
  });
};

export const useCreateUnit = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (unitData: CreateUnitData) => {
      const { data, error } = await supabase
        .from("units")
        .insert([unitData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
      toast({
        title: "Success",
        description: "Unit created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create unit",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateUnit = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateUnitData }) => {
      const { data: updatedData, error } = await supabase
        .from("units")
        .update(data)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return updatedData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
      toast({
        title: "Success",
        description: "Unit updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update unit",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteUnit = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("units")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
      toast({
        title: "Success",
        description: "Unit deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete unit",
        variant: "destructive",
      });
    },
  });
};
