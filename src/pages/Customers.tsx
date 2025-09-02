import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useCustomers, Customer } from "@/hooks/useCustomers";
import { AddCustomerDialog } from "@/components/customers/AddCustomerDialog";
import { EditCustomerDialog } from "@/components/customers/EditCustomerDialog";
import { ViewCustomerDialog } from "@/components/customers/ViewCustomerDialog";
import { DeleteCustomerDialog } from "@/components/customers/DeleteCustomerDialog";
import { CustomerTable } from "@/components/customers/CustomerTable";
import { CustomerStats } from "@/components/customers/CustomerStats";
import { Skeleton } from "@/components/ui/skeleton";

const Customers = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [viewCustomer, setViewCustomer] = useState<Customer | null>(null);
  const [deleteCustomer, setDeleteCustomer] = useState<Customer | null>(null);
  
  const { data: customers = [], isLoading } = useCustomers();

  // Filter customers by search query and status
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (customer.email && customer.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (customer.phone && customer.phone.includes(searchQuery)) ||
      (customer.gstin && customer.gstin.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || customer.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleEdit = (customer: Customer) => {
    setEditCustomer(customer);
  };

  const handleDelete = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setDeleteCustomer(customer);
    }
  };

  const handleView = (customer: Customer) => {
    setViewCustomer(customer);
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
          <h1 className="text-3xl font-bold">Customer Management</h1>
          <p className="text-muted-foreground">
            Manage your customer database and GST information.
          </p>
        </div>
        <AddCustomerDialog />
      </div>

      {/* Customer Statistics */}
      <CustomerStats customers={customers} />

      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers by name, GSTIN, phone..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" className="w-full sm:w-auto">
          <Filter className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Customer Database
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">
                {customers.length === 0 ? "No customers found" : "No matching customers"}
              </p>
              <p className="mb-4">
                {customers.length === 0 
                  ? "Add your first customer to get started with invoicing."
                  : "Try adjusting your search criteria."
                }
              </p>
              {customers.length === 0 && <AddCustomerDialog />}
            </div>
          ) : (
            <CustomerTable
              customers={filteredCustomers}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={handleView}
            />
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <EditCustomerDialog
        customer={editCustomer}
        open={!!editCustomer}
        onOpenChange={(open) => !open && setEditCustomer(null)}
      />
      
      <ViewCustomerDialog
        customer={viewCustomer}
        open={!!viewCustomer}
        onOpenChange={(open) => !open && setViewCustomer(null)}
        onEdit={handleEdit}
      />
      
      <DeleteCustomerDialog
        customer={deleteCustomer}
        open={!!deleteCustomer}
        onOpenChange={(open) => !open && setDeleteCustomer(null)}
      />
    </div>
  );
};

export default Customers;