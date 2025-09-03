import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, CalendarIcon } from "lucide-react";
import { useCustomers } from "@/hooks/useCustomers";
import { useProducts } from "@/hooks/useProducts";
import { useUpdateInvoice, Invoice } from "@/hooks/useInvoices";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ProductSearchInput } from "./ProductSearchInput";

interface EditInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
}

interface InvoiceItemData {
  id?: string;
  product_id: string;
  custom_product_name: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
}

export const EditInvoiceDialog = ({ open, onOpenChange, invoice }: EditInvoiceDialogProps) => {
  const [formData, setFormData] = useState({
    customer_id: "",
    guest_name: "",
    guest_email: "",
    guest_phone: "",
    guest_address: "",
    guest_gstin: "",
    invoice_date: "",
    notes: "",
  });
  
  const [items, setItems] = useState<InvoiceItemData[]>([{
    product_id: "",
    custom_product_name: "",
    quantity: 1,
    unit_price: 0,
    tax_rate: 18,
  }]);

  const [originalItems, setOriginalItems] = useState<Array<{ id: string; product_id: string | null; quantity: number; unit_price: number; tax_rate: number }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const updateInvoice = useUpdateInvoice();
  const { data: customers = [] } = useCustomers();
  const { data: products = [] } = useProducts();
  const { toast } = useToast();

  // Load invoice data when dialog opens
  useEffect(() => {
    if (invoice && open) {
      setIsLoading(true);
      
      // Fetch detailed invoice data including items
      const fetchInvoiceDetails = async () => {
        try {
          const { data: detailedInvoice, error } = await supabase
            .from("invoices")
            .select(`
              *,
              invoice_items(
                id,
                product_id,
                quantity,
                unit_price,
                tax_rate,
                line_total
              )
            `)
            .eq("id", invoice.id)
            .single();
          
          if (error) throw error;

          // Set form data
          setFormData({
            customer_id: detailedInvoice.customer_id || "",
            guest_name: detailedInvoice.guest_name || "",
            guest_email: detailedInvoice.guest_email || "",
            guest_phone: detailedInvoice.guest_phone || "",
            guest_address: detailedInvoice.guest_address || "",
            guest_gstin: detailedInvoice.guest_gstin || "",
            invoice_date: detailedInvoice.invoice_date,
            notes: detailedInvoice.notes || "",
          });

          // Set items data
          if (detailedInvoice.invoice_items && detailedInvoice.invoice_items.length > 0) {
            setItems(detailedInvoice.invoice_items.map((item: { id: string; product_id: string | null; quantity: number; unit_price: number; tax_rate: number }) => ({
              id: item.id,
              product_id: item.product_id,
              custom_product_name: "", // Will be filled from product name if needed
              quantity: item.quantity,
              unit_price: item.unit_price,
              tax_rate: item.tax_rate,
            })));
            setOriginalItems(detailedInvoice.invoice_items);
          }
        } catch (error) {
          console.error("Failed to fetch invoice details:", error);
          toast({
            title: "Error",
            description: "Failed to load invoice details",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      };

      fetchInvoiceDetails();
    }
  }, [invoice, open, toast]);

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

  const updateItem = (index: number, field: string, value: string | number) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Auto-fill unit price when product is selected
    if (field === 'product_id' && value) {
      const product = products.find(p => p.id === value);
      if (product) {
        updatedItems[index].unit_price = product.unit_price;
        updatedItems[index].tax_rate = product.tax_rate;
      }
    }
    
    setItems(updatedItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validItems = items.filter(item => 
      (item.product_id || item.custom_product_name.trim()) && item.quantity > 0 && item.unit_price > 0
    );
    
    if (validItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one valid item",
        variant: "destructive",
      });
      return;
    }

    if (!invoice) return;

    try {
      setIsLoading(true);

      // Calculate inventory adjustments needed
      const currentProductItems = validItems.filter(item => item.product_id);
      const originalProductItems = originalItems.filter(item => item.product_id);
      
      // Validate stock availability for new/increased quantities
      if (currentProductItems.length > 0) {
        const productIds = currentProductItems.map(item => item.product_id!);
        const { data: products, error: productError } = await supabase
          .from("products")
          .select("id, name, current_stock")
          .in("id", productIds);
        
        if (productError) throw productError;
        
        const stockErrors: string[] = [];
        for (const item of currentProductItems) {
          const product = products?.find(p => p.id === item.product_id);
          const originalItem = originalProductItems.find(orig => orig.product_id === item.product_id);
          const originalQuantity = originalItem ? originalItem.quantity : 0;
          const quantityIncrease = item.quantity - originalQuantity;
          
          if (product && quantityIncrease > 0 && quantityIncrease > product.current_stock) {
            stockErrors.push(`${product.name}: Need ${quantityIncrease} more, Available ${product.current_stock}`);
          }
        }
        
        if (stockErrors.length > 0) {
          throw new Error(`Insufficient stock for increases:\n${stockErrors.join('\n')}`);
        }
      }

      // Update invoice basic data
      await updateInvoice.mutateAsync({
        id: invoice.id,
        customer_id: formData.customer_id || null,
        guest_name: formData.guest_name || null,
        guest_email: formData.guest_email || null,
        guest_phone: formData.guest_phone || null,
        guest_address: formData.guest_address || null,
        guest_gstin: formData.guest_gstin || null,
        invoice_date: formData.invoice_date,
        notes: formData.notes || null,
      });

      // Calculate inventory adjustments
      const inventoryAdjustments: Array<{
        product_id: string;
        quantity_delta: number;
        transaction_type: "adjustment";
        reference_no: string;
        notes: string;
      }> = [];

      // Handle existing products (adjust quantities)
      for (const originalItem of originalProductItems) {
        const currentItem = currentProductItems.find(item => item.product_id === originalItem.product_id);
        const originalQty = originalItem.quantity;
        const currentQty = currentItem ? currentItem.quantity : 0;
        const quantityDiff = currentQty - originalQty;

        if (quantityDiff !== 0) {
          inventoryAdjustments.push({
            product_id: originalItem.product_id,
            quantity_delta: -quantityDiff, // Negative because we're adjusting from sale perspective
            transaction_type: "adjustment",
            reference_no: invoice.invoice_number,
            notes: `Invoice edit adjustment: ${originalQty} → ${currentQty}`,
          });
        }
      }

      // Handle new products (deduct from stock)
      for (const currentItem of currentProductItems) {
        const isNewProduct = !originalProductItems.find(orig => orig.product_id === currentItem.product_id);
        if (isNewProduct) {
          inventoryAdjustments.push({
            product_id: currentItem.product_id!,
            quantity_delta: -currentItem.quantity,
            transaction_type: "adjustment",
            reference_no: invoice.invoice_number,
            notes: `New product added to invoice: ${currentItem.quantity} units`,
          });
        }
      }

      // Handle removed products (add back to stock)
      for (const originalItem of originalProductItems) {
        const stillExists = currentProductItems.find(item => item.product_id === originalItem.product_id);
        if (!stillExists) {
          inventoryAdjustments.push({
            product_id: originalItem.product_id,
            quantity_delta: originalItem.quantity, // Positive to add back to stock
            transaction_type: "adjustment",
            reference_no: invoice.invoice_number,
            notes: `Product removed from invoice: returning ${originalItem.quantity} units`,
          });
        }
      }

      // Handle invoice items updates
      // Delete all existing items first, then recreate (simpler approach)
      await supabase
        .from("invoice_items")
        .delete()
        .eq("invoice_id", invoice.id);

      // Insert new items
      const itemsToInsert = validItems.map(item => ({
        invoice_id: invoice.id,
        product_id: item.product_id || null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate,
      }));

      const { error: itemsError } = await supabase
        .from("invoice_items")
        .insert(itemsToInsert);
      
      if (itemsError) throw itemsError;

      // Apply inventory adjustments
      if (inventoryAdjustments.length > 0) {
        const { error: stockError } = await supabase
          .from("stock_ledger")
          .insert(inventoryAdjustments);
        
        if (stockError) throw stockError;
      }

      toast({
        title: "Success",
        description: "Invoice updated successfully",
      });
      
      onOpenChange(false);
    } catch (error: Error) {
      console.error('Invoice update failed:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update invoice",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      customer_id: "",
      guest_name: "",
      guest_email: "",
      guest_phone: "",
      guest_address: "",
      guest_gstin: "",
      invoice_date: "",
      notes: "",
    });
    setItems([{
      product_id: "",
      custom_product_name: "",
      quantity: 1,
      unit_price: 0,
      tax_rate: 18,
    }]);
    setOriginalItems([]);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Edit Invoice {invoice.invoice_number}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-2 text-muted-foreground">Loading invoice details...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="customer">Select Customer (Optional)</Label>
                  <Select
                    value={formData.customer_id}
                    onValueChange={(value) => {
                      setFormData({ ...formData, customer_id: value });
                      if (value) {
                        // Clear guest fields when customer is selected
                        setFormData(prev => ({
                          ...prev,
                          customer_id: value,
                          guest_name: "",
                          guest_email: "",
                          guest_phone: "",
                          guest_address: "",
                          guest_gstin: "",
                        }));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose existing customer or add guest details below" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Guest Customer</SelectItem>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name} {customer.gstin && `(${customer.gstin})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {!formData.customer_id && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="guest_name">Guest Name *</Label>
                      <Input
                        id="guest_name"
                        value={formData.guest_name}
                        onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
                        placeholder="Enter customer name"
                        required={!formData.customer_id}
                      />
                    </div>
                    <div>
                      <Label htmlFor="guest_email">Email</Label>
                      <Input
                        id="guest_email"
                        type="email"
                        value={formData.guest_email}
                        onChange={(e) => setFormData({ ...formData, guest_email: e.target.value })}
                        placeholder="customer@example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="guest_phone">Phone</Label>
                      <Input
                        id="guest_phone"
                        value={formData.guest_phone}
                        onChange={(e) => setFormData({ ...formData, guest_phone: e.target.value })}
                        placeholder="+91-9876543210"
                      />
                    </div>
                    <div>
                      <Label htmlFor="guest_gstin">GSTIN</Label>
                      <Input
                        id="guest_gstin"
                        value={formData.guest_gstin}
                        onChange={(e) => setFormData({ ...formData, guest_gstin: e.target.value })}
                        placeholder="22AAAAA0000A1Z5"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="guest_address">Address</Label>
                      <Textarea
                        id="guest_address"
                        value={formData.guest_address}
                        onChange={(e) => setFormData({ ...formData, guest_address: e.target.value })}
                        placeholder="Enter customer address"
                        rows={3}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Invoice Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Invoice Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
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
              </CardContent>
            </Card>

            {/* Invoice Items */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-lg">Invoice Items</CardTitle>
                <Button type="button" onClick={addItem} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div key={index} className="grid grid-cols-1 lg:grid-cols-6 gap-4 p-4 border rounded-lg">
                      <div className="lg:col-span-2 space-y-2">
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
                      
                      <div className="space-y-2">
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
                      
                      <div className="space-y-2">
                        <Label>Unit Price (₹) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unit_price}
                          onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
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
                      
                      <div className="space-y-2">
                        <Label>Total</Label>
                        <div className="h-10 flex items-center px-3 border rounded-md bg-muted text-sm">
                          ₹{(item.quantity * item.unit_price * (1 + item.tax_rate / 100)).toFixed(2)}
                        </div>
                      </div>
                      
                      {items.length > 1 && (
                        <div className="flex justify-center lg:justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Invoice Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Invoice Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-end">
                  <div className="w-full sm:w-64 space-y-2">
                    {(() => {
                      const subtotal = items.reduce((sum, item) => 
                        sum + (item.quantity * item.unit_price), 0
                      );
                      const taxAmount = items.reduce((sum, item) => 
                        sum + (item.quantity * item.unit_price * item.tax_rate / 100), 0
                      );
                      const total = subtotal + taxAmount;

                      return (
                        <>
                          <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>₹{subtotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>CGST:</span>
                            <span>₹{(taxAmount / 2).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>SGST:</span>
                            <span>₹{(taxAmount / 2).toFixed(2)}</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between text-lg font-semibold">
                            <span>Total:</span>
                            <span>₹{total.toFixed(2)}</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes or terms..."
                rows={3}
              />
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                className="flex-1 sm:flex-initial"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 sm:flex-initial"
              >
                {isLoading ? "Updating..." : "Update Invoice"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};