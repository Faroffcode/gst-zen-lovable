import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCategories, useAddCategory, useUpdateCategory, useDeleteCategory, Category } from "@/hooks/useCategories";
import { Plus, Edit, Trash2, Tag, Palette } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface CategoryManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const predefinedColors = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4',
  '#84cc16', '#f97316', '#ec4899', '#6366f1', '#14b8a6', '#f43f5e'
];

export const CategoryManagementDialog = ({ open, onOpenChange }: CategoryManagementDialogProps) => {
  const [activeTab, setActiveTab] = useState("list");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3b82f6"
  });

  const { data: categories = [], isLoading } = useCategories();
  const addCategory = useAddCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) return;

    try {
      if (editingCategory) {
        await updateCategory.mutateAsync({
          id: editingCategory.id,
          name: formData.name,
          description: formData.description || null,
          color: formData.color
        });
      } else {
        await addCategory.mutateAsync({
          name: formData.name,
          description: formData.description || null,
          color: formData.color
        });
      }
      
      resetForm();
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      color: category.color
    });
    setActiveTab("form");
  };

  const handleDelete = async () => {
    if (!deleteCategory) return;
    
    try {
      await deleteCategoryMutation.mutateAsync(deleteCategory.id);
      setDeleteCategory(null);
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const resetForm = () => {
    setFormData({ name: "", description: "", color: "#3b82f6" });
    setEditingCategory(null);
    setActiveTab("list");
  };

  const handleCancel = () => {
    resetForm();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Tag className="h-6 w-6" />
              Category Management
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="list">All Categories</TabsTrigger>
              <TabsTrigger value="form">
                {editingCategory ? "Edit Category" : "Add Category"}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {categories.map((category) => (
                    <Card key={category.id} className="relative">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <div 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: category.color }}
                            />
                            {category.name}
                          </CardTitle>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(category)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteCategory(category)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {category.description && (
                          <p className="text-sm text-muted-foreground">
                            {category.description}
                          </p>
                        )}
                        <div className="mt-2">
                          <Badge 
                            variant="outline" 
                            style={{ 
                              borderColor: category.color,
                              color: category.color 
                            }}
                          >
                            {category.name}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {categories.length === 0 && (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      <Tag className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p>No categories found. Create your first category!</p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="form" className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Category Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter category name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter category description (optional)"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Category Color</Label>
                  <div className="flex flex-wrap gap-2">
                    {predefinedColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 ${
                          formData.color === color ? 'border-gray-900' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setFormData({ ...formData, color })}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    <Input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-20 h-8"
                    />
                    <span className="text-sm text-muted-foreground">
                      {formData.color}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={addCategory.isPending || updateCategory.isPending}>
                    {editingCategory ? "Update Category" : "Create Category"}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteCategory} onOpenChange={() => setDeleteCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the category "{deleteCategory?.name}"? 
              This action cannot be undone. Make sure no products are using this category.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteCategoryMutation.isPending}
            >
              {deleteCategoryMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
