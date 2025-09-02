import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeleteProduct, Product } from "@/hooks/useProducts";

interface DeleteConfirmDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DeleteConfirmDialog = ({ product, open, onOpenChange }: DeleteConfirmDialogProps) => {
  const deleteProduct = useDeleteProduct();

  const handleDelete = () => {
    if (!product) return;
    
    deleteProduct.mutate(product.id, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  if (!product) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the product
            <span className="font-semibold"> "{product.name}" </span>
            (SKU: {product.sku}) from your inventory.
            {product.current_stock > 0 && (
              <span className="block mt-2 text-warning">
                Warning: This product has {product.current_stock} {product.unit} in stock.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteProduct.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteProduct.isPending ? "Deleting..." : "Delete Product"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};