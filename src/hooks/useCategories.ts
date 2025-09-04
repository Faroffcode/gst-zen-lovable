import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Category {
  id: string;
  name: string;
  description: string | null;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryData {
  name: string;
  description?: string;
  color?: string;
}

export interface UpdateCategoryData {
  id: string;
  name?: string;
  description?: string;
  color?: string;
}

export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true });
      
      if (error) throw error;
      return data as Category[];
    },
  });
};

export const useAddCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (categoryData: CreateCategoryData) => {
      const { data, error } = await supabase
        .from("categories")
        .insert([{
          name: categoryData.name,
          description: categoryData.description || null,
          color: categoryData.color || '#3b82f6',
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({
        title: "Success",
        description: "Category created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create category",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (categoryData: UpdateCategoryData) => {
      const { data, error } = await supabase
        .from("categories")
        .update({
          name: categoryData.name,
          description: categoryData.description,
          color: categoryData.color,
        })
        .eq("id", categoryData.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({
        title: "Success",
        description: "Category updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update category",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (categoryId: string) => {
      // First check if any products are using this category
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("id")
        .eq("category", categoryId);
      
      if (productsError) throw productsError;
      
      if (products && products.length > 0) {
        throw new Error(`Cannot delete category. ${products.length} product(s) are using this category.`);
      }

      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", categoryId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete category",
        variant: "destructive",
      });
    },
  });
};
