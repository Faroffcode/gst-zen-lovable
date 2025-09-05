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
import { Edit, Trash2, Eye, Phone, Mail } from "lucide-react";
import { Customer } from "@/hooks/useCustomers";

interface CustomerTableProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onDelete: (customerId: string) => void;
  onView: (customer: Customer) => void;
  onViewInvoices: (customer: Customer) => void;
}

export const CustomerTable = ({ customers, onEdit, onDelete, onView, onViewInvoices }: CustomerTableProps) => {
  if (customers.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground">
          <div className="text-lg font-medium mb-2">No customers found</div>
          <p>No customers match your search criteria.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer Name</TableHead>
            <TableHead className="hidden md:table-cell">Contact</TableHead>
            <TableHead className="hidden lg:table-cell">GSTIN</TableHead>
            <TableHead className="hidden lg:table-cell">Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell>
                <div>
                  <button
                    onClick={() => onViewInvoices(customer)}
                    className="font-medium text-left hover:text-blue-600 hover:underline cursor-pointer transition-colors"
                    title="Click to view customer invoices"
                  >
                    {customer.name}
                  </button>
                  <div className="md:hidden text-sm text-muted-foreground">
                    {customer.email && <div>{customer.email}</div>}
                    {customer.phone && <div>{customer.phone}</div>}
                    {customer.gstin && <div className="font-mono">{customer.gstin}</div>}
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <div className="space-y-1">
                  {customer.email && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {customer.email}
                    </div>
                  )}
                  {customer.phone && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {customer.phone}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {customer.gstin ? (
                  <span className="font-mono text-sm">{customer.gstin}</span>
                ) : (
                  <span className="text-muted-foreground text-sm">Not provided</span>
                )}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <div className="text-sm">
                  {customer.city && customer.state ? (
                    <div>{customer.city}, {customer.state}</div>
                  ) : customer.city || customer.state ? (
                    <div>{customer.city || customer.state}</div>
                  ) : (
                    <span className="text-muted-foreground">Not provided</span>
                  )}
                  {customer.pincode && (
                    <div className="text-muted-foreground">{customer.pincode}</div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={customer.status === 'active' ? 'default' : 'secondary'}>
                  {customer.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end flex-wrap">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onView(customer)}
                    className="hidden sm:inline-flex"
                    title="View Customer"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    <span className="text-xs">View</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(customer)}
                    title="Edit Customer"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    <span className="text-xs">Edit</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(customer.id)}
                    className="text-destructive hover:text-destructive"
                    title="Delete Customer"
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