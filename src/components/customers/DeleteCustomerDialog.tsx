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
import { useDeleteCustomer, Customer } from "@/hooks/useCustomers";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, FileText } from "lucide-react";

interface DeleteCustomerDialogProps {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DeleteCustomerDialog = ({ customer, open, onOpenChange }: DeleteCustomerDialogProps) => {
  const deleteCustomer = useDeleteCustomer();
  
  // Check if customer is referenced in invoices
  const { data: invoiceReferences } = useQuery({
    queryKey: ["customer-invoice-references", customer?.id],
    queryFn: async () => {
      if (!customer?.id) return [];
      
      const { data, error } = await supabase
        .from("invoices")
        .select("id, invoice_number, total_amount, created_at")
        .eq("customer_id", customer.id)
        .limit(5);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!customer?.id && open,
  });

  const handleDelete = () => {
    if (!customer) return;
    
    deleteCustomer.mutate(customer.id, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  if (!customer) return null;

  const hasInvoiceReferences = invoiceReferences && invoiceReferences.length > 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

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
              This action cannot be undone. This will permanently delete the customer
              <span className="font-semibold"> "{customer.name}" </span>
              and all associated data.
            </div>
            
            {hasInvoiceReferences && (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                <div className="text-destructive">
                  <div className="font-medium mb-1 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Cannot delete: Customer has {invoiceReferences.length} invoice(s)
                  </div>
                  <div className="text-sm space-y-1">
                    {invoiceReferences.slice(0, 3).map((invoice: { id: string; invoice_number: string; total_amount: number }) => (
                      <div key={invoice.id} className="flex justify-between">
                        <span>• {invoice.invoice_number}</span>
                        <span>{formatCurrency(invoice.total_amount)}</span>
                      </div>
                    ))}
                    {invoiceReferences.length > 3 && (
                      <div>• And {invoiceReferences.length - 3} more...</div>
                    )}
                  </div>
                  <div className="text-sm mt-2">
                    Delete all invoices for this customer before deleting the customer record.
                  </div>
                </div>
              </div>
            )}
            
            {!hasInvoiceReferences && customer.status === 'active' && (
              <div className="flex items-center gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <span className="text-warning">
                  This is an active customer. Consider setting status to 'inactive' instead.
                </span>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteCustomer.isPending || hasInvoiceReferences}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
          >
            {deleteCustomer.isPending ? "Deleting..." : "Delete Customer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};