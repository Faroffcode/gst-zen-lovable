import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useAddProduct } from "@/hooks/useProducts";

export const AddProductDialog = () => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    category: "General",
    hsn_code: "",
    unit: "kg",
    unit_price: "",
    tax_rate: "18.00",
    current_stock: "",
    min_stock: "10",
    status: "active",
  });

  const addProduct = useAddProduct();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addProduct.mutate({
      ...formData,
      unit_price: parseFloat(formData.unit_price) || 0,
      tax_rate: parseFloat(formData.tax_rate) || 0,
      current_stock: parseInt(formData.current_stock) || 0,
      min_stock: parseInt(formData.min_stock) || 10,
    }, {
      onSuccess: () => {
        setOpen(false);
        setFormData({
          sku: "",
          name: "",
          category: "General",
          hsn_code: "",
          unit: "kg",
          unit_price: "",
          tax_rate: "18.00",
          current_stock: "",
          min_stock: "10",
          status: "active",
        });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-primary hover:shadow-glow">
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="e.g., NPK001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., NPK 19:19:19 Fertilizer"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fertilizers">Fertilizers</SelectItem>
                  <SelectItem value="Micronutrients">Micronutrients</SelectItem>
                  <SelectItem value="Bio-fertilizers">Bio-fertilizers</SelectItem>
                  <SelectItem value="Pesticides">Pesticides</SelectItem>
                  <SelectItem value="General">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hsn_code">HSN Code</Label>
              <Input
                id="hsn_code"
                value={formData.hsn_code}
                onChange={(e) => setFormData({ ...formData, hsn_code: e.target.value })}
                placeholder="e.g., 31051000"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Select
                value={formData.unit}
                onValueChange={(value) => setFormData({ ...formData, unit: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="ltr">ltr</SelectItem>
                  <SelectItem value="pkt">pkt</SelectItem>
                  <SelectItem value="pcs">pcs</SelectItem>
                  <SelectItem value="bag">bag</SelectItem>
                  <SelectItem value="box">box</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit_price">Unit Price (₹) *</Label>
              <Input
                id="unit_price"
                type="number"
                step="0.01"
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax_rate">Tax Rate (%)</Label>
              <Input
                id="tax_rate"
                type="number"
                step="0.01"
                value={formData.tax_rate}
                onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                placeholder="18.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="current_stock">Current Stock *</Label>
              <Input
                id="current_stock"
                type="number"
                value={formData.current_stock}
                onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })}
                placeholder="0"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="min_stock">Minimum Stock</Label>
              <Input
                id="min_stock"
                type="number"
                value={formData.min_stock}
                onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                placeholder="10"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addProduct.isPending}>
              {addProduct.isPending ? "Adding..." : "Add Product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};