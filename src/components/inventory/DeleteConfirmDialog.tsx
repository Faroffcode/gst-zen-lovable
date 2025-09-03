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
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";

interface DeleteConfirmDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DeleteConfirmDialog = ({ product, open, onOpenChange }: DeleteConfirmDialogProps) => {
  const deleteProduct = useDeleteProduct();
  
  // Check if product is referenced in invoices
  const { data: invoiceReferences } = useQuery({
    queryKey: ["product-invoice-references", product?.id],
    queryFn: async () => {
      if (!product?.id) return [];
      
      const { data, error } = await supabase
        .from("invoice_items")
        .select(`
          id,
          invoice_id,
          invoices!inner(invoice_number, created_at)
        `)
        .eq("product_id", product.id)
        .limit(5);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!product?.id && open,
  });

  const handleDelete = () => {
    if (!product) return;
    
    deleteProduct.mutate(product.id, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  if (!product) return null;

  const hasInvoiceReferences = invoiceReferences && invoiceReferences.length > 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {hasInvoiceReferences && <AlertTriangle className="h-5 w-5 text-destructive" />}
            Are you sure?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <div>
              This action cannot be undone. This will permanently delete the product
              <span className="font-semibold"> "{product.name}" </span>
              (SKU: {product.sku}) from your inventory.
            </div>
            
            {product.current_stock > 0 && (
              <div className="flex items-center gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <span className="text-warning font-medium">
                  Warning: This product has {product.current_stock} {product.unit} in stock.
                </span>
              </div>
            )}
            
            {hasInvoiceReferences && (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                <div className="text-destructive">
                  <div className="font-medium mb-1">
                    Cannot delete: Product is used in {invoiceReferences.length} invoice(s)
                  </div>
                  <div className="text-sm space-y-1">
                    {invoiceReferences.slice(0, 3).map((ref: { id: string; invoices: { invoice_number: string } }) => (
                      <div key={ref.id}>
                        • Invoice {ref.invoices.invoice_number}
                      </div>
                    ))}
                    {invoiceReferences.length > 3 && (
                      <div>• And {invoiceReferences.length - 3} more...</div>
                    )}
                  </div>
                  <div className="text-sm mt-2">
                    Remove this product from all invoices before deleting.
                  </div>
                </div>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteProduct.isPending || hasInvoiceReferences}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
          >
            {deleteProduct.isPending ? "Deleting..." : "Delete Product"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};