import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Package, IndianRupee, Hash, Tag, Scale, AlertTriangle } from "lucide-react";
import { Product } from "@/hooks/useProducts";

interface ViewProductDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ViewProductDialog = ({ product, open, onOpenChange }: ViewProductDialogProps) => {
  if (!product) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStockStatus = () => {
    if (product.current_stock === 0) {
      return { label: "Out of Stock", variant: "destructive" as const };
    } else if (product.current_stock <= product.min_stock) {
      return { label: "Low Stock", variant: "secondary" as const };
    } else {
      return { label: "In Stock", variant: "outline" as const };
    }
  };

  const stockStatus = getStockStatus();
  const stockValue = product.current_stock * product.unit_price;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">{product.name}</h3>
                <p className="text-sm text-muted-foreground font-mono">{product.sku}</p>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">{product.category}</Badge>
                <Badge variant={stockStatus.variant}>{stockStatus.label}</Badge>
                <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                  {product.status}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Product Details Grid */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">HSN Code</p>
                  <p className="text-sm text-muted-foreground">
                    {product.hsn_code || "Not specified"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Scale className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Unit</p>
                  <p className="text-sm text-muted-foreground">{product.unit}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Unit Price</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(product.unit_price)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Tax Rate</p>
                  <p className="text-sm text-muted-foreground">{product.tax_rate}%</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Current Stock</p>
                  <p className="text-sm text-muted-foreground">
                    {product.current_stock} {product.unit}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Minimum Stock</p>
                  <p className="text-sm text-muted-foreground">
                    {product.min_stock} {product.unit}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Stock Value</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(stockValue)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Last Updated</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(product.updated_at)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stock Alert */}
          {product.current_stock <= product.min_stock && (
            <>
              <Separator />
              <div className="flex items-center gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-warning">Stock Alert</p>
                  <p className="text-xs text-warning/80">
                    {product.current_stock === 0 
                      ? "This product is out of stock" 
                      : "Stock level is below minimum threshold"}
                  </p>
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end pt-4">
            <Button onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};