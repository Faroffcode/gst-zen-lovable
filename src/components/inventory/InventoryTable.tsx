import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Eye, BarChart3 } from "lucide-react";
import { Product } from "@/hooks/useProducts";

interface InventoryTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  onView: (product: Product) => void;
  onStockRegister: (product: Product) => void;
}

export const InventoryTable = ({ products, onEdit, onDelete, onView, onStockRegister }: InventoryTableProps) => {
  const getStockStatus = (product: Product) => {
    if (product.current_stock === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    } else if (product.current_stock <= product.min_stock) {
      return <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">Low Stock</Badge>;
    } else {
      return <Badge variant="outline" className="text-success border-success/20">In Stock</Badge>;
    }
  };


  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground">
          <div className="text-lg font-medium mb-2">No products found</div>
          <p>No products match the selected category filter.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SKU</TableHead>
            <TableHead>Product Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Current Stock</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="font-mono text-sm">{product.sku}</TableCell>
              <TableCell>
                <div>
                  <button
                    onClick={() => onStockRegister(product)}
                    className="font-medium text-left hover:text-blue-600 hover:underline cursor-pointer transition-colors"
                    title="Click to view stock register"
                  >
                    {product.name}
                  </button>
                  {product.hsn_code && (
                    <div className="text-sm text-muted-foreground">
                      HSN: {product.hsn_code}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{product.category}</Badge>
              </TableCell>
              <TableCell className="text-right">
                {product.current_stock} {product.unit}
              </TableCell>
              <TableCell>{getStockStatus(product)}</TableCell>
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onView(product)}
                    title="View Product"
                    className="flex items-center gap-1"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    <span className="text-xs">View</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onStockRegister(product)}
                    title="Stock Register"
                    className="flex items-center gap-1"
                  >
                    <BarChart3 className="h-4 w-4 mr-1" />
                    <span className="text-xs">Register</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(product)}
                    title="Edit Product"
                    className="flex items-center gap-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    <span className="text-xs">Edit</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(product.id)}
                    className="text-destructive hover:text-destructive flex items-center gap-1"
                    title="Delete Product"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    <span className="text-xs">Delete</span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};