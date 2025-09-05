import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Phone, Building, MapPin, CreditCard, Calendar, Edit } from "lucide-react";
import { Customer } from "@/hooks/useCustomers";

interface ViewCustomerDialogProps {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (customer: Customer) => void;
}

export const ViewCustomerDialog = ({ customer, open, onOpenChange, onEdit }: ViewCustomerDialogProps) => {
  if (!customer) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <DialogTitle className="flex items-center gap-3">
              <User className="h-6 w-6" />
              Customer Details
            </DialogTitle>
            {onEdit && (
              <Button
                variant="outline"
                size="default"
                onClick={() => {
                  onEdit(customer);
                  onOpenChange(false);
                }}
              >
                <Edit className="h-5 w-5 mr-2" />
                Edit Customer
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-3">
                <User className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold">{customer.name}</h3>
                  <p className="text-muted-foreground">Customer ID: {customer.id.slice(0, 8)}...</p>
                </div>
                <Badge variant={customer.status === 'active' ? 'default' : 'secondary'}>
                  {customer.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-3">
                <Mail className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    Email
                  </div>
                  <p className="font-medium">
                    {customer.email || <span className="text-muted-foreground">Not provided</span>}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    Phone
                  </div>
                  <p className="font-medium">
                    {customer.phone || <span className="text-muted-foreground">Not provided</span>}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-3">
                <Building className="h-5 w-5" />
                Business Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CreditCard className="h-3 w-3" />
                  GSTIN
                </div>
                <p className="font-mono font-medium">
                  {customer.gstin || <span className="text-muted-foreground">Not provided</span>}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-3">
                <MapPin className="h-5 w-5" />
                Address Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {customer.address && (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Address</div>
                  <p className="font-medium">{customer.address}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">City</div>
                  <p className="font-medium">
                    {customer.city || <span className="text-muted-foreground">Not provided</span>}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">State</div>
                  <p className="font-medium">
                    {customer.state || <span className="text-muted-foreground">Not provided</span>}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Pincode</div>
                  <p className="font-medium">
                    {customer.pincode || <span className="text-muted-foreground">Not provided</span>}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-3">
                <Calendar className="h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Created</div>
                  <p className="font-medium">{formatDate(customer.created_at)}</p>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Last Updated</div>
                  <p className="font-medium">{formatDate(customer.updated_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};