import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, Search, Package, X } from "lucide-react";
import { useProducts, useAddProduct, Product } from "@/hooks/useProducts";
import { useRecordPurchase } from "@/hooks/useStockLedger";
import { useCategories } from "@/hooks/useCategories";
import { useUnits } from "@/hooks/useUnits";

interface PurchaseFormData {
  product_id: string;
  product_name: string;
  sku: string;
  category: string;
  hsn_code: string;
  unit: string;
  tax_rate: number;
  quantity: number;
  reference_no: string;
  notes: string;
  is_new_product: boolean;
}

interface PurchaseFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const PurchaseForm = ({ onSuccess, onCancel }: PurchaseFormProps) => {
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryQuery, setCategoryQuery] = useState("");
  const [unitQuery, setUnitQuery] = useState("");
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  const [showUnitSuggestions, setShowUnitSuggestions] = useState(false);

  const { data: products = [] } = useProducts();
  const addProduct = useAddProduct();
  const recordPurchase = useRecordPurchase();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: units = [], isLoading: unitsLoading } = useUnits();

  // Filter categories based on search query
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(categoryQuery.toLowerCase())
  );

  // Filter units based on search query
  const filteredUnits = units.filter(unit =>
    unit.name.toLowerCase().includes(unitQuery.toLowerCase()) ||
    unit.abbreviation.toLowerCase().includes(unitQuery.toLowerCase())
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<PurchaseFormData>({
    defaultValues: {
      tax_rate: 18,
      unit: "kg",
      category: "General",
      is_new_product: false,
    }
  });

  const watchedProductId = watch("product_id");
  const watchedQuantity = watch("quantity");

  // Filter products based on search query
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Update form when product is selected
  useEffect(() => {
    if (selectedProduct) {
      setValue("product_id", selectedProduct.id);
      setValue("product_name", selectedProduct.name);
      setValue("sku", selectedProduct.sku);
      setValue("category", selectedProduct.category);
      setValue("hsn_code", selectedProduct.hsn_code || "");
      setValue("unit", selectedProduct.unit);
      setValue("tax_rate", selectedProduct.tax_rate);
    }
  }, [selectedProduct, setValue]);

  const onSubmit = async (data: PurchaseFormData) => {
    try {
      let productId = data.product_id;

      // If it's a new product, create it first
      if (isNewProduct) {
        const newProduct = await addProduct.mutateAsync({
          sku: data.sku,
          name: data.product_name,
          category: data.category,
          hsn_code: data.hsn_code || null,
          unit: data.unit,
          unit_price: 0, // Set initial unit price to 0
          tax_rate: data.tax_rate,
          current_stock: 0, // Will be updated by the purchase transaction
          min_stock: 10,
          status: "active",
        });
        productId = newProduct.id;
      }

      // Record the purchase transaction
      await recordPurchase.mutateAsync({
        product_id: productId,
        quantity_delta: data.quantity,
        unit_cost: 0, // Set unit cost to 0
        reference_no: data.reference_no || undefined,
        notes: data.notes || undefined,
      });

      reset();
      setSelectedProduct(null);
      setIsNewProduct(false);
      setSearchQuery("");
      onSuccess?.();
    } catch (error) {
      console.error("Purchase recording failed:", error);
    }
  };

  // Total cost calculation removed since unit cost is not available

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Product Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product Selection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={!isNewProduct ? "default" : "outline"}
              onClick={() => setIsNewProduct(false)}
              className="flex-1"
            >
              Existing Product
            </Button>
            <Button
              type="button"
              variant={isNewProduct ? "default" : "outline"}
              onClick={() => setIsNewProduct(true)}
              className="flex-1"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Product
            </Button>
          </div>

          {!isNewProduct ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="product-search">Search Product</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="product-search"
                    placeholder="Search by product name or SKU..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      // Clear selected product when user starts typing
                      if (selectedProduct) {
                        setSelectedProduct(null);
                        setValue("product_id", "");
                      }
                    }}
                    className="pl-10"
                  />
                </div>
              </div>

              {searchQuery && (
                <div className="max-h-48 overflow-y-auto border rounded-md">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                        onClick={() => {
                          setSelectedProduct(product);
                          setSearchQuery("");
                        }}
                      >
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          SKU: {product.sku} | Stock: {product.current_stock} {product.unit}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-muted-foreground">
                      No products found. Try creating a new product instead.
                    </div>
                  )}
                </div>
              )}

              {selectedProduct && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{selectedProduct.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        SKU: {selectedProduct.sku} | Current Stock: {selectedProduct.current_stock} {selectedProduct.unit}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedProduct(null);
                        setSearchQuery("");
                        setValue("product_id", "");
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="product_name">Product Name *</Label>
                <Input
                  id="product_name"
                  {...register("product_name", { required: "Product name is required" })}
                  placeholder="Enter product name"
                />
                {errors.product_name && (
                  <p className="text-sm text-destructive mt-1">{errors.product_name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  {...register("sku")}
                  placeholder="Enter SKU"
                />
              </div>

              <div className="relative">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={categoryQuery}
                  onChange={(e) => {
                    setCategoryQuery(e.target.value);
                    setValue("category", e.target.value);
                    setShowCategorySuggestions(true);
                  }}
                  onFocus={() => setShowCategorySuggestions(true)}
                  onBlur={() => setTimeout(() => setShowCategorySuggestions(false), 150)}
                  placeholder={categoriesLoading ? "Loading categories..." : "Type or select category"}
                  disabled={categoriesLoading}
                />
                {showCategorySuggestions && filteredCategories.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {filteredCategories.map((category) => (
                      <div
                        key={category.id}
                        className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setCategoryQuery(category.name);
                          setValue("category", category.name);
                          setShowCategorySuggestions(false);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: category.color }}
                          />
                          {category.name}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="hsn_code">HSN Code</Label>
                <Input
                  id="hsn_code"
                  {...register("hsn_code")}
                  placeholder="Enter HSN code"
                />
              </div>

              <div className="relative">
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  value={unitQuery}
                  onChange={(e) => {
                    setUnitQuery(e.target.value);
                    setValue("unit", e.target.value);
                    setShowUnitSuggestions(true);
                  }}
                  onFocus={() => setShowUnitSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowUnitSuggestions(false), 150)}
                  placeholder={unitsLoading ? "Loading units..." : "Type or select unit"}
                  disabled={unitsLoading}
                />
                {showUnitSuggestions && filteredUnits.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {filteredUnits.map((unit) => (
                      <div
                        key={unit.id}
                        className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setUnitQuery(unit.abbreviation);
                          setValue("unit", unit.abbreviation);
                          setShowUnitSuggestions(false);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{unit.abbreviation}</span>
                          <span className="text-muted-foreground">({unit.name})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                <Input
                  id="tax_rate"
                  type="number"
                  step="0.01"
                  {...register("tax_rate", { 
                    required: "Tax rate is required",
                    min: { value: 0, message: "Tax rate must be non-negative" }
                  })}
                  placeholder="18.00"
                />
                {errors.tax_rate && (
                  <p className="text-sm text-destructive mt-1">{errors.tax_rate.message}</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Purchase Details */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                step="0.001"
                {...register("quantity", { 
                  required: "Quantity is required",
                  min: { value: 0.001, message: "Quantity must be greater than 0" }
                })}
                placeholder="Enter quantity"
              />
              {errors.quantity && (
                <p className="text-sm text-destructive mt-1">{errors.quantity.message}</p>
              )}
            </div>


            <div>
              <Label htmlFor="reference_no">Reference Number</Label>
              <Input
                id="reference_no"
                {...register("reference_no")}
                placeholder="Purchase order/Bill number"
              />
            </div>

            <div>
              <Label>Quantity Added</Label>
              <div className="text-2xl font-bold text-green-600">
                {watchedQuantity || 0} {selectedProduct?.unit || 'units'}
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="Additional notes about this purchase..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button 
          type="submit" 
          disabled={addProduct.isPending || recordPurchase.isPending}
          className="min-w-32"
        >
          {addProduct.isPending || recordPurchase.isPending ? "Recording..." : "Record Purchase"}
        </Button>
      </div>
    </form>
  );
};