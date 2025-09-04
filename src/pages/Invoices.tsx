import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Search, Filter, Download, CalendarIcon, X, Trash2, CheckSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { useInvoices, Invoice, useInvoice, useDeleteInvoice } from "@/hooks/useInvoices";
import { CreateInvoiceDialog } from "@/components/invoices/CreateInvoiceDialog";
import { InvoiceTable } from "@/components/invoices/InvoiceTable";
import { ViewInvoiceDialog } from "@/components/invoices/ViewInvoiceDialog";
import { DeleteInvoiceDialog } from "@/components/invoices/DeleteInvoiceDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { generateInvoicePDF, downloadInvoiceHTML } from "@/lib/invoice-pdf";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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

const Invoices = () => {
  // State for search and pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [deleteInvoice, setDeleteInvoice] = useState<{ id: string; number: string } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Bulk selection state
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  
  // Filter states - Date range, amount range, customer type, and GSTIN status
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [amountRange, setAmountRange] = useState({ min: "", max: "" });
  const [customerType, setCustomerType] = useState<"all" | "registered" | "guest">("all");
  const [hasGSTIN, setHasGSTIN] = useState<"all" | "yes" | "no">("all");
  
  const { data: invoices = [], isLoading } = useInvoices();
  const deleteInvoiceMutation = useDeleteInvoice();
  const { toast } = useToast();

  // Filter invoices by search query and filter criteria with memoization for performance
  // Searches across: invoice numbers, customer names (registered & guest), 
  // email, phone, GSTIN (registered & guest), and invoice notes
  const filteredInvoices = useMemo(() => {
    let filtered = invoices;

    // Apply search filter
    if (searchQuery.trim()) {
      const searchTerm = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(invoice => {
        // Search by invoice number
        if (invoice.invoice_number.toLowerCase().includes(searchTerm)) {
          return true;
        }
        
        // Search by customer name (for registered customers)
        if (invoice.customer?.name && invoice.customer.name.toLowerCase().includes(searchTerm)) {
          return true;
        }
        
        // Search by guest customer name (for guest invoices)
        if (invoice.guest_name && invoice.guest_name.toLowerCase().includes(searchTerm)) {
          return true;
        }
        
        // Search by customer GSTIN (for registered customers)
        if (invoice.customer?.gstin && invoice.customer.gstin.toLowerCase().includes(searchTerm)) {
          return true;
        }
        
        // Search by guest GSTIN (for guest invoices)
        if (invoice.guest_gstin && invoice.guest_gstin.toLowerCase().includes(searchTerm)) {
          return true;
        }
        
        // Search by guest email
        if (invoice.guest_email && invoice.guest_email.toLowerCase().includes(searchTerm)) {
          return true;
        }
        
        // Search by guest phone
        if (invoice.guest_phone && invoice.guest_phone.toLowerCase().includes(searchTerm)) {
          return true;
        }
        
        // Search by invoice notes
        if (invoice.notes && invoice.notes.toLowerCase().includes(searchTerm)) {
          return true;
        }
        
        return false;
      });
    }

    // Apply date range filter
    if (dateRange.from) {
      filtered = filtered.filter(invoice => 
        new Date(invoice.invoice_date) >= new Date(dateRange.from)
      );
    }
    if (dateRange.to) {
      filtered = filtered.filter(invoice => 
        new Date(invoice.invoice_date) <= new Date(dateRange.to)
      );
    }

    // Apply amount range filter
    if (amountRange.min) {
      filtered = filtered.filter(invoice => 
        invoice.total_amount >= parseFloat(amountRange.min)
      );
    }
    if (amountRange.max) {
      filtered = filtered.filter(invoice => 
        invoice.total_amount <= parseFloat(amountRange.max)
      );
    }

    // Apply customer type filter
    if (customerType !== "all") {
      filtered = filtered.filter(invoice => {
        if (customerType === "registered") {
          return !!invoice.customer_id;
        } else if (customerType === "guest") {
          return !invoice.customer_id;
        }
        return true;
      });
    }

    // Apply GSTIN filter
    if (hasGSTIN !== "all") {
      filtered = filtered.filter(invoice => {
        const hasGstinValue = !!(invoice.customer?.gstin || invoice.guest_gstin);
        if (hasGSTIN === "yes") {
          return hasGstinValue;
        } else if (hasGSTIN === "no") {
          return !hasGstinValue;
        }
        return true;
      });
    }

    return filtered;
  }, [invoices, searchQuery, dateRange, amountRange, customerType, hasGSTIN]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return dateRange.from || dateRange.to || amountRange.min || amountRange.max || 
           customerType !== "all" || hasGSTIN !== "all";
  }, [dateRange, amountRange, customerType, hasGSTIN]);

  // Bulk selection handlers
  const handleSelectAll = () => {
    if (selectedInvoices.size === filteredInvoices.length) {
      setSelectedInvoices(new Set());
    } else {
      setSelectedInvoices(new Set(filteredInvoices.map(invoice => invoice.id)));
    }
  };

  const handleSelectInvoice = (invoiceId: string) => {
    const newSelected = new Set(selectedInvoices);
    if (newSelected.has(invoiceId)) {
      newSelected.delete(invoiceId);
    } else {
      newSelected.add(invoiceId);
    }
    setSelectedInvoices(newSelected);
  };

  // Bulk download handler
  const handleBulkDownload = async () => {
    if (selectedInvoices.size === 0) return;

    try {
      // Process each selected invoice
      for (const invoiceId of Array.from(selectedInvoices)) {
        const { data: detailedInvoice, error } = await supabase
          .from("invoices")
          .select(`
            *,
            customer:customers(*),
            invoice_items(
              *,
              product:products(name, sku, unit, hsn_code)
            )
          `)
          .eq("id", invoiceId)
          .single();
        
        if (error || !detailedInvoice) {
          throw new Error(`Failed to fetch invoice ${invoiceId}`);
        }

        // Generate PDF for each invoice
        const result = await generateInvoicePDF(
          detailedInvoice, 
          detailedInvoice.invoice_items || []
        );
        
        if (!result.success) {
          throw new Error(`Failed to generate PDF for invoice ${detailedInvoice.invoice_number}`);
        }
      }

      toast({
        title: "Success",
        description: `${selectedInvoices.size} invoice${selectedInvoices.size > 1 ? 's' : ''} downloaded successfully`,
      });

      // Clear selection after download
      setSelectedInvoices(new Set());
    } catch (error: Error) {
      console.error('Bulk download failed:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to download selected invoices",
        variant: "destructive",
      });
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setDateRange({ from: "", to: "" });
    setAmountRange({ min: "", max: "" });
    setCustomerType("all");
    setHasGSTIN("all");
  };

  // Handle delete invoice
  const handleDelete = (id: string) => {
    // We need to find the invoice to get its number for the delete dialog
    const invoice = invoices.find(inv => inv.id === id);
    if (invoice) {
      setDeleteInvoice({ id, number: invoice.invoice_number });
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    try {
      // Delete each selected invoice
      for (const invoiceId of Array.from(selectedInvoices)) {
        await deleteInvoiceMutation.mutateAsync(invoiceId);
      }

      // Clear selection and close dialog
      setSelectedInvoices(new Set());
      setShowBulkDeleteDialog(false);

      toast({
        title: "Success",
        description: `${selectedInvoices.size} invoice${selectedInvoices.size > 1 ? 's' : ''} deleted successfully`,
      });
    } catch (error: Error) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete selected invoices",
        variant: "destructive",
      });
    }
  };


  // Handle view invoice
  const handleView = (invoice: Invoice) => {
    setViewInvoice(invoice);
  };

  // Handle download invoice
  const handleDownload = async (invoice: Invoice) => {
    try {
      // Fetch detailed invoice data with items and product information
      const { data: detailedInvoice, error } = await supabase
        .from("invoices")
        .select(`
          *,
          customer:customers(*),
          invoice_items(
            *,
            product:products(name, sku, unit, hsn_code)
          )
        `)
        .eq("id", invoice.id)
        .single();
      
      if (error || !detailedInvoice) {
        throw new Error('Failed to fetch invoice details');
      }

      // Generate PDF without cloud upload
      const result = await generateInvoicePDF(
        detailedInvoice, 
        detailedInvoice.invoice_items || []
      );
      
      if (result.success) {
        toast({
          title: "Success", 
          description: "Invoice PDF downloaded successfully!",
        });
      } else {
        // Fallback to HTML download
        downloadInvoiceHTML(detailedInvoice, detailedInvoice.invoice_items || []);
        toast({
          title: "Downloaded",
          description: "Invoice downloaded as HTML file",
        });
      }
    } catch (error: Error) {
      console.error('Download failed:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to download invoice",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Invoice Management</h1>
          <p className="text-muted-foreground">
            Create, manage, and track your GST invoices.
          </p>
        </div>
        <CreateInvoiceDialog />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by invoice number, customer, email, phone, GSTIN, or notes..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Dialog open={showFilters} onOpenChange={setShowFilters}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto relative">
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <Badge 
                  variant="secondary" 
                  className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-purple-100 text-purple-700"
                >
                  !
                </Badge>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filter Invoices
              </DialogTitle>
              <DialogDescription>
                Apply filters to narrow down your invoice list.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Date Range Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Date Range</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">From</Label>
                    <Input
                      type="date"
                      value={dateRange.from}
                      onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">To</Label>
                    <Input
                      type="date"
                      value={dateRange.to}
                      onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Amount Range Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Amount Range (₹)</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Min</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={amountRange.min}
                      onChange={(e) => setAmountRange(prev => ({ ...prev, min: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Max</Label>
                    <Input
                      type="number"
                      placeholder="10000"
                      value={amountRange.max}
                      onChange={(e) => setAmountRange(prev => ({ ...prev, max: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Customer Type Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Customer Type</Label>
                <Select value={customerType} onValueChange={(value: "all" | "registered" | "guest") => setCustomerType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Customers</SelectItem>
                    <SelectItem value="registered">Registered Customers</SelectItem>
                    <SelectItem value="guest">Guest Customers</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* GSTIN Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">GSTIN Status</Label>
                <Select value={hasGSTIN} onValueChange={(value: "all" | "yes" | "no") => setHasGSTIN(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="yes">Has GSTIN</SelectItem>
                    <SelectItem value="no">No GSTIN</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={clearFilters}
                className="flex-1"
                disabled={!hasActiveFilters}
              >
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
              <Button 
                onClick={() => setShowFilters(false)}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                Apply Filters
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {selectedInvoices.size > 0 ? (
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              onClick={handleBulkDownload}
              className="flex-1 sm:flex-none"
            >
              <Download className="h-4 w-4 mr-2" />
              Download ({selectedInvoices.size})
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => setShowBulkDeleteDialog(true)}
              className="flex-1 sm:flex-none"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete ({selectedInvoices.size})
            </Button>
          </div>
        ) : (
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              className="w-full sm:w-auto"
            >
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-bold">
              Invoices
              {filteredInvoices.length > 0 && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({filteredInvoices.length} total)
                </span>
              )}
            </CardTitle>
            {selectedInvoices.size > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <CheckSquare className="h-4 w-4" />
                <span>{selectedInvoices.size} selected</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">
                {invoices.length === 0 ? "No invoices found" : "No matching invoices"}
              </p>
              <p className="mb-4">
                {invoices.length === 0 
                  ? "Create your first GST compliant invoice."
                  : hasActiveFilters 
                    ? "No invoices match your current search and filter criteria. Try adjusting your filters."
                    : "Try adjusting your search criteria."
                }
              </p>
              {invoices.length === 0 && <CreateInvoiceDialog />}
            </div>
          ) : (
            <InvoiceTable
              invoices={filteredInvoices}
              onDelete={handleDelete}
              onView={handleView}
              onDownload={handleDownload}
              selectedInvoices={selectedInvoices}
              onSelectInvoice={handleSelectInvoice}
              onSelectAll={handleSelectAll}
            />
          )}
        </CardContent>
      </Card>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Invoices</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedInvoices.size} selected invoice{selectedInvoices.size > 1 ? 's' : ''}? 
              This action cannot be undone and will restore inventory for the deleted invoices.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete {selectedInvoices.size} Invoice{selectedInvoices.size > 1 ? 's' : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <ViewInvoiceDialog
        open={!!viewInvoice}
        onOpenChange={(open) => !open && setViewInvoice(null)}
        invoice={viewInvoice}
        onDownload={handleDownload}
      />
      
      
      <DeleteInvoiceDialog
        open={!!deleteInvoice}
        onOpenChange={(open) => !open && setDeleteInvoice(null)}
        invoiceId={deleteInvoice?.id || null}
        invoiceNumber={deleteInvoice?.number || null}
      />
    </div>
  );
};

export default Invoices;