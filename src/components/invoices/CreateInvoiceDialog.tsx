import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductSearchInput } from "./ProductSearchInput";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, User } from "lucide-react";
import { useCreateInvoice } from "@/hooks/useInvoices";
import { useCustomers } from "@/hooks/useCustomers";
import { useProducts } from "@/hooks/useProducts";

export const CreateInvoiceDialog = () => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: "",
    invoice_date: new Date().toISOString().split('T')[0],
    notes: "",
  });
  const [items, setItems] = useState([{
    product_id: "",
    custom_product_name: "",
    quantity: 1,
    unit_price: 0,
    tax_rate: 18,
  }]);

  const createInvoice = useCreateInvoice();
  const { data: customers = [] } = useCustomers();
  const { data: products = [] } = useProducts();

  const addItem = () => {
    setItems([...items, {
      product_id: "",
      custom_product_name: "",
      quantity: 1,
      unit_price: 0,
      tax_rate: 18,
    }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleProductChange = (index: number, productId: string, customName: string, autoFillData?: { unit_price: number; tax_rate: number }) => {
    const updatedItems = [...items];
    updatedItems[index] = {
      ...updatedItems[index],
      product_id: productId,
      custom_product_name: customName
    };
    
    // Auto-fill unit price and tax rate when product is selected
    if (autoFillData) {
      updatedItems[index].unit_price = autoFillData.unit_price;
      updatedItems[index].tax_rate = autoFillData.tax_rate;
    }
    
    setItems(updatedItems);
  };

  const updateItem = (index: number, field: string, value: string | number, autoFillData?: { unit_price: number; tax_rate: number }) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Auto-fill unit price and tax rate when product is selected
    if (autoFillData) {
      updatedItems[index].unit_price = autoFillData.unit_price;
      updatedItems[index].tax_rate = autoFillData.tax_rate;
    }
    
    // Legacy support for direct product_id selection
    if (field === 'product_id' && value) {
      const product = products.find(p => p.id === value);
      if (product) {
        updatedItems[index].unit_price = product.unit_price;
        updatedItems[index].tax_rate = product.tax_rate;
      }
    }
    
    setItems(updatedItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validItems = items.filter(item => 
      (item.product_id || item.custom_product_name.trim()) && item.quantity > 0 && item.unit_price > 0
    );
    
    if (validItems.length === 0) {
      return;
    }

    const invoiceData = {
      customer_id: formData.customer_id,
      invoice_date: formData.invoice_date,
      notes: formData.notes || undefined,
      items: validItems,
    };

    createInvoice.mutate(invoiceData, {
      onSuccess: () => {
        setOpen(false);
        setFormData({
          customer_id: "",
          invoice_date: new Date().toISOString().split('T')[0],
          notes: "",
        });
        setItems([{
          product_id: "",
          custom_product_name: "",
          quantity: 1,
          unit_price: 0,
          tax_rate: 18,
        }]);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-primary hover:shadow-glow">
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Invoice</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Selection */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 transition-all duration-300">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-blue-800">Customer Selection</h3>
                <p className="text-sm text-blue-600">Select from registered customers</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer_id">Customer *</Label>
                <Select
                  value={formData.customer_id}
                  onValueChange={(value) => setFormData({ ...formData, customer_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoice_date">Invoice Date *</Label>
                <Input
                  id="invoice_date"
                  type="date"
                  value={formData.invoice_date}
                  onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={2}
              />
            </div>
          </div>

          {/* Invoice Items */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-base font-semibold">Invoice Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Add Item</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => {
                const selectedProduct = products.find(p => p.id === item.product_id);
                const rateWithoutGST = item.unit_price / (1 + item.tax_rate / 100);
                const taxableValue = item.quantity * rateWithoutGST;
                const totalAmount = item.quantity * item.unit_price;
                const taxAmount = totalAmount - taxableValue;
                const cgstAmount = taxAmount / 2;
                const sgstAmount = taxAmount / 2;

                return (
                <div key={index} className="p-4 border rounded-lg space-y-4">
                  {/* Product Selection Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-8 gap-3 items-end">
                    <div className="lg:col-span-3 space-y-2">
                      <Label>Product (Description of Goods) *</Label>
                      <ProductSearchInput
                        products={products}
                        value={{
                          product_id: item.product_id,
                          custom_product_name: item.custom_product_name
                        }}
                        onChange={(productId, customName, autoFillData) => 
                          handleProductChange(index, productId, customName, autoFillData)
                        }
                        required
                      />
                    </div>
                    
                    <div className="lg:col-span-1 space-y-2">
                      <Label>HSN</Label>
                      <div className="h-10 flex items-center px-3 border rounded-md bg-muted text-sm">
                        {selectedProduct?.hsn_code || 'N/A'}
                      </div>
                    </div>
                    
                    <div className="lg:col-span-1 space-y-2">
                      <Label>Unit</Label>
                      <div className="h-10 flex items-center px-3 border rounded-md bg-muted text-sm">
                        {selectedProduct?.unit || 'N/A'}
                      </div>
                    </div>
                    
                    <div className="lg:col-span-1 space-y-2">
                      <Label>Quantity *</Label>
                      <Input
                        type="number"
                        step="0.001"
                        min="0.001"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        required
                      />
                    </div>
                    
                    <div className="lg:col-span-1 space-y-2">
                      <Label>Rate/Unit (₹) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unit_price}
                        onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        required
                      />
                    </div>
                    
                    <div className="lg:col-span-1 space-y-2">
                      <Label>Tax Rate (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={item.tax_rate}
                        onChange={(e) => updateItem(index, 'tax_rate', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                  
                  {/* GST Breakdown Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 pt-3 border-t bg-gray-50 rounded p-3">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">Total (Rate×Qty)</Label>
                      <div className="h-8 flex items-center px-2 border rounded-md bg-white text-sm font-medium">
                        ₹{totalAmount.toFixed(2)}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">Taxable Value</Label>
                      <div className="h-8 flex items-center px-2 border rounded-md bg-white text-sm">
                        ₹{taxableValue.toFixed(2)}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">CGST ({(item.tax_rate/2).toFixed(1)}%)</Label>
                      <div className="h-8 flex items-center px-2 border rounded-md bg-white text-sm">
                        ₹{cgstAmount.toFixed(2)}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">SGST ({(item.tax_rate/2).toFixed(1)}%)</Label>
                      <div className="h-8 flex items-center px-2 border rounded-md bg-white text-sm">
                        ₹{sgstAmount.toFixed(2)}
                      </div>
                    </div>
                    
                    <div className="flex items-end justify-center">
                      {items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                );
              })}
            </div>

            {/* Invoice Summary */}
            <div className="border-t pt-4">
              <div className="flex justify-end">
                <div className="w-full sm:w-80 space-y-3">
                  {(() => {
                    // Calculate totals based on GST-compliant method
                    const totalWithGST = items.reduce((sum, item) => 
                      sum + (item.quantity * item.unit_price), 0
                    );
                    
                    const totalTaxableValue = items.reduce((sum, item) => {
                      const rateWithoutGST = item.unit_price / (1 + item.tax_rate / 100);
                      return sum + (item.quantity * rateWithoutGST);
                    }, 0);
                    
                    const totalTaxAmount = totalWithGST - totalTaxableValue;
                    const totalCGST = totalTaxAmount / 2;
                    const totalSGST = totalTaxAmount / 2;

                    return (
                      <>
                        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                          <h4 className="font-semibold text-gray-700 border-b pb-2">Tax Summary</h4>
                          <div className="flex justify-between text-sm">
                            <span>Total Taxable Value:</span>
                            <span className="font-medium">₹{totalTaxableValue.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Total CGST:</span>
                            <span className="font-medium">₹{totalCGST.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Total SGST:</span>
                            <span className="font-medium">₹{totalSGST.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between font-semibold border-t pt-2 text-lg">
                            <span>Grand Total:</span>
                            <span className="text-blue-600">₹{totalWithGST.toFixed(2)}</span>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createInvoice.isPending}>
              {createInvoice.isPending ? "Creating..." : "Create Invoice"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};