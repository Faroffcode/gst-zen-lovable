import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Package, TrendingDown } from "lucide-react";
import { Product } from "@/hooks/useProducts";
import { formatCurrency } from "@/lib/template-processor";

interface LowStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
}

export const LowStockDialog = ({ open, onOpenChange, products }: LowStockDialogProps) => {
  // Filter products with low stock or out of stock
  const lowStockProducts = products.filter(product => 
    product.current_stock <= product.min_stock
  );

  const outOfStockProducts = lowStockProducts.filter(product => 
    product.current_stock === 0
  );

  const lowStockOnlyProducts = lowStockProducts.filter(product => 
    product.current_stock > 0 && product.current_stock <= product.min_stock
  );

  const getStockStatus = (product: Product) => {
    if (product.current_stock === 0) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Out of Stock
        </Badge>
      );
    } else if (product.current_stock <= product.min_stock) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1 text-orange-600 bg-orange-100 border-orange-200">
          <TrendingDown className="h-3 w-3" />
          Low Stock
        </Badge>
      );
    }
    return null;
  };

  const getStockPercentage = (product: Product) => {
    if (product.min_stock === 0) return 100;
    return Math.round((product.current_stock / product.min_stock) * 100);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
            Low Stock Products
          </DialogTitle>
          <div className="text-sm text-gray-600 space-y-1">
            <div><span className="font-medium">Total Low Stock:</span> {lowStockProducts.length} products</div>
            <div><span className="font-medium">Out of Stock:</span> {outOfStockProducts.length} products</div>
            <div><span className="font-medium">Low Stock:</span> {lowStockOnlyProducts.length} products</div>
          </div>
        </DialogHeader>

        {lowStockProducts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">No low stock products</p>
            <p>All your products have sufficient stock levels.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Out of Stock Products */}
            {outOfStockProducts.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-red-600 mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Out of Stock ({outOfStockProducts.length})
                </h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Current Stock</TableHead>
                        <TableHead className="text-right">Min Stock</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {outOfStockProducts.map((product) => (
                        <TableRow key={product.id} className="bg-red-50">
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{product.category}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-bold text-red-600">
                            {product.current_stock} {product.unit}
                          </TableCell>
                          <TableCell className="text-right">
                            {product.min_stock} {product.unit}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(product.unit_price)}
                          </TableCell>
                          <TableCell>{getStockStatus(product)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Low Stock Products */}
            {lowStockOnlyProducts.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-orange-600 mb-3 flex items-center gap-2">
                  <TrendingDown className="h-5 w-5" />
                  Low Stock ({lowStockOnlyProducts.length})
                </h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Current Stock</TableHead>
                        <TableHead className="text-right">Min Stock</TableHead>
                        <TableHead className="text-right">Stock %</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lowStockOnlyProducts.map((product) => (
                        <TableRow key={product.id} className="bg-orange-50">
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{product.category}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium text-orange-600">
                            {product.current_stock} {product.unit}
                          </TableCell>
                          <TableCell className="text-right">
                            {product.min_stock} {product.unit}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-orange-500 h-2 rounded-full" 
                                  style={{ width: `${Math.min(getStockPercentage(product), 100)}%` }}
                                />
                              </div>
                              <span className="text-sm text-gray-600">
                                {getStockPercentage(product)}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(product.unit_price)}
                          </TableCell>
                          <TableCell>{getStockStatus(product)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-3">Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Total Products</div>
                  <div className="font-medium">{products.length}</div>
                </div>
                <div>
                  <div className="text-gray-600">Low Stock Products</div>
                  <div className="font-medium text-orange-600">{lowStockProducts.length}</div>
                </div>
                <div>
                  <div className="text-gray-600">Out of Stock</div>
                  <div className="font-medium text-red-600">{outOfStockProducts.length}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
