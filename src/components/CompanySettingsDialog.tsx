import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Building2, 
  Save, 
  Settings, 
  CreditCard,
  MapPin,
  Phone,
  Mail,
  FileText
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { getCompanySettings, saveCompanySettings, CompanySettings } from "@/lib/company-settings";

const CompanySettingsDialog = () => {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<CompanySettings>(() => {
    return getCompanySettings();
  });

  // Load settings when dialog opens
  useEffect(() => {
    if (open) {
      setSettings(getCompanySettings());
    }
  }, [open]);

  const handleInputChange = (field: keyof CompanySettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    try {
      saveCompanySettings(settings);
      toast({
        title: "Settings Saved",
        description: "Company settings have been updated successfully.",
      });
      setOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReset = () => {
    const defaultSettings = getCompanySettings();
    setSettings(defaultSettings);
    toast({
      title: "Settings Reset",
      description: "Company settings have been reset to default values.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Building2 className="h-4 w-4 mr-2" />
          Company Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company Settings
          </DialogTitle>
          <DialogDescription>
            Update your company information, address, and bank details that will be used in invoices.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Company Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Company Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={settings.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    placeholder="Enter company name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyTagline">Company Tagline</Label>
                  <Input
                    id="companyTagline"
                    value={settings.companyTagline}
                    onChange={(e) => handleInputChange('companyTagline', e.target.value)}
                    placeholder="Enter company tagline"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="proprietorName">Proprietor Name *</Label>
                <Input
                  id="proprietorName"
                  value={settings.proprietorName}
                  onChange={(e) => handleInputChange('proprietorName', e.target.value)}
                  placeholder="Enter proprietor name"
                />
              </div>
            </CardContent>
          </Card>

          {/* Company Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Company Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Textarea
                  id="address"
                  value={settings.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter complete address"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={settings.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Enter city"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={settings.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    placeholder="Enter state"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode *</Label>
                  <Input
                    id="pincode"
                    value={settings.pincode}
                    onChange={(e) => handleInputChange('pincode', e.target.value)}
                    placeholder="Enter pincode"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country *</Label>
                  <Input
                    id="country"
                    value={settings.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    placeholder="Enter country"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={settings.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={settings.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="Enter website URL"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tax Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Tax Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gstin">GSTIN *</Label>
                  <Input
                    id="gstin"
                    value={settings.gstin}
                    onChange={(e) => handleInputChange('gstin', e.target.value.toUpperCase())}
                    placeholder="Enter GSTIN"
                    maxLength={15}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pan">PAN *</Label>
                  <Input
                    id="pan"
                    value={settings.pan}
                    onChange={(e) => handleInputChange('pan', e.target.value.toUpperCase())}
                    placeholder="Enter PAN"
                    maxLength={10}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bank Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Bank Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name *</Label>
                  <Input
                    id="bankName"
                    value={settings.bankName}
                    onChange={(e) => handleInputChange('bankName', e.target.value)}
                    placeholder="Enter bank name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountName">Account Name *</Label>
                  <Input
                    id="accountName"
                    value={settings.accountName}
                    onChange={(e) => handleInputChange('accountName', e.target.value)}
                    placeholder="Enter account holder name"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number *</Label>
                  <Input
                    id="accountNumber"
                    value={settings.accountNumber}
                    onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                    placeholder="Enter account number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ifscCode">IFSC Code *</Label>
                  <Input
                    id="ifscCode"
                    value={settings.ifscCode}
                    onChange={(e) => handleInputChange('ifscCode', e.target.value.toUpperCase())}
                    placeholder="Enter IFSC code"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="accountType">Account Type *</Label>
                  <Input
                    id="accountType"
                    value={settings.accountType}
                    onChange={(e) => handleInputChange('accountType', e.target.value)}
                    placeholder="e.g., Current, Savings"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branchName">Branch Name</Label>
                  <Input
                    id="branchName"
                    value={settings.branchName}
                    onChange={(e) => handleInputChange('branchName', e.target.value)}
                    placeholder="Enter branch name"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Additional Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="footerMessage">Footer Message</Label>
                <Input
                  id="footerMessage"
                  value={settings.footerMessage}
                  onChange={(e) => handleInputChange('footerMessage', e.target.value)}
                  placeholder="Enter footer message for invoices"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="currencySymbol">Currency Symbol</Label>
                <Input
                  id="currencySymbol"
                  value={settings.currencySymbol}
                  onChange={(e) => handleInputChange('currencySymbol', e.target.value)}
                  placeholder="Enter currency symbol"
                  maxLength={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between pt-6">
          <Button variant="outline" onClick={handleReset}>
            Reset to Default
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CompanySettingsDialog;
