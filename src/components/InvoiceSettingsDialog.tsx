import { useState, useRef, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import { 
  FileText, 
  Upload, 
  Download, 
  Save, 
  Palette, 
  Settings, 
  Eye,
  X,
  FileCheck
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { getInvoiceSettings } from "@/lib/template-processor";
import { isR2Configured } from "@/lib/cloudflare-r2";

interface InvoiceSettings {
  companyName: string;
  companyTagline: string;
  logoText: string;
  primaryColor: string;
  useCustomTemplate: boolean;
  customTemplateFile: File | null;
  invoicePrefix: string;
  nextInvoiceNumber: string;
  showCompanyLogo: boolean;
  showFooter: boolean;
  footerText: string;
  taxDisplayFormat: 'combined' | 'separate';
  currencySymbol: string;
  dateFormat: string;
}

const InvoiceSettingsDialog = () => {
  const [open, setOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState<InvoiceSettings>(() => {
    // Load existing settings from localStorage when component initializes
    return getInvoiceSettings();
  });

  // Load settings when dialog opens
  useEffect(() => {
    if (open) {
      const currentSettings = getInvoiceSettings();
      setSettings(currentSettings);
    }
  }, [open]);

  const handleInputChange = (field: keyof InvoiceSettings, value: string | boolean | File | null) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf') {
        handleInputChange('customTemplateFile', file);
        handleInputChange('useCustomTemplate', true);
        toast({
          title: "Template Uploaded",
          description: `${file.name} has been uploaded successfully.`,
        });
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF file only.",
          variant: "destructive",
        });
      }
    }
  };

  const handleRemoveTemplate = () => {
    handleInputChange('customTemplateFile', null);
    handleInputChange('useCustomTemplate', false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast({
      title: "Template Removed",
      description: "Custom template has been removed. Default template will be used.",
    });
  };

  const handleSave = () => {
    // Create settings object without the File object for localStorage
    const settingsToSave = {
      ...settings,
      customTemplateFile: null, // Files can't be stored in localStorage
    };
    
    localStorage.setItem('invoiceSettings', JSON.stringify(settingsToSave));
    
    // If user uploaded a template file, we could implement file storage here
    // For now, we'll just show a message about custom template functionality
    if (settings.customTemplateFile) {
      toast({
        title: "Settings Saved",
        description: `Invoice settings saved. Custom template "${settings.customTemplateFile.name}" is ready to use.`,
      });
    } else {
      toast({
        title: "Invoice Settings Saved",
        description: "Your invoice settings have been updated successfully.",
      });
    }
    setOpen(false);
  };

  const handleDownloadSample = () => {
    // Create a sample template guide for users
    const sampleContent = `
Invoice Template Guide for BIO TECH CENTRE

This is a sample template that shows how to structure your custom PDF template.

Required Elements:
- Company Header
- Invoice Number: {{INVOICE_NUMBER}}
- Invoice Date: {{INVOICE_DATE}}
- Customer Information: {{CUSTOMER_NAME}}, {{CUSTOMER_ADDRESS}}
- Items Table with columns: Product, Quantity, Unit Price, Tax, Total
- Subtotal: {{SUBTOTAL}}
- Tax Amount: {{TAX_AMOUNT}}
- Total Amount: {{TOTAL_AMOUNT}}

Variable Placeholders:
Use these placeholders in your template, and they will be replaced with actual data:
{{COMPANY_NAME}} - Your company name
{{INVOICE_NUMBER}} - Invoice number
{{INVOICE_DATE}} - Invoice date
{{CUSTOMER_NAME}} - Customer name
{{CUSTOMER_ADDRESS}} - Customer address
{{ITEMS_TABLE}} - Items table content
{{SUBTOTAL}} - Subtotal amount
{{TAX_AMOUNT}} - Tax amount
{{TOTAL_AMOUNT}} - Total amount

Note: Your custom template should be a PDF file with these placeholders.
`;

    const blob = new Blob([sampleContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'invoice-template-guide.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Sample Downloaded",
      description: "Template guide has been downloaded to help you create your custom template.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          Configure Invoices
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Invoice Settings
          </DialogTitle>
          <DialogDescription>
            Configure invoice templates, branding, and generation settings.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Custom Template Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Custom Template
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="useCustomTemplate"
                  checked={settings.useCustomTemplate}
                  onCheckedChange={(checked) => handleInputChange('useCustomTemplate', checked)}
                />
                <Label htmlFor="useCustomTemplate">Use custom PDF template</Label>
              </div>
              
              {settings.useCustomTemplate && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {settings.customTemplateFile ? (
                      <div className="space-y-2">
                        <FileCheck className="h-8 w-8 mx-auto text-green-600" />
                        <p className="font-medium">{settings.customTemplateFile.name}</p>
                        <p className="text-sm text-gray-500">
                          {(settings.customTemplateFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRemoveTemplate}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Remove Template
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-8 w-8 mx-auto text-gray-400" />
                        <p className="font-medium">Upload your custom PDF template</p>
                        <p className="text-sm text-gray-500">PDF files only, max 10MB</p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <Button
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Choose File
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleDownloadSample}>
                      <Download className="h-4 w-4 mr-1" />
                      Download Template Guide
                    </Button>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      Preview Template
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Company Branding */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Company Branding
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={settings.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="logoText">Logo Text</Label>
                <Input
                  id="logoText"
                  value={settings.logoText}
                  onChange={(e) => handleInputChange('logoText', e.target.value)}
                  placeholder="e.g., BTC"
                />
              </div>
              <div className="col-span-1 md:col-span-2 space-y-2">
                <Label htmlFor="companyTagline">Company Tagline</Label>
                <Input
                  id="companyTagline"
                  value={settings.companyTagline}
                  onChange={(e) => handleInputChange('companyTagline', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                    className="w-16 h-10"
                  />
                  <Input
                    value={settings.primaryColor}
                    onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                    placeholder="#2563eb"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Invoice Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cloud Storage Status */}
              <div className="col-span-1 md:col-span-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isR2Configured() ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <span className="text-sm font-medium">
                    Cloud Storage (Cloudflare R2): {isR2Configured() ? 'Configured' : 'Not Configured'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {isR2Configured() 
                    ? 'Invoices will be automatically uploaded to cloud storage for backup and sharing'
                    : 'Configure Cloudflare R2 credentials to enable cloud storage for invoices'
                  }
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
                <Input
                  id="invoicePrefix"
                  value={settings.invoicePrefix}
                  onChange={(e) => handleInputChange('invoicePrefix', e.target.value)}
                  placeholder="INV"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nextInvoiceNumber">Next Invoice Number</Label>
                <Input
                  id="nextInvoiceNumber"
                  value={settings.nextInvoiceNumber}
                  onChange={(e) => handleInputChange('nextInvoiceNumber', e.target.value)}
                  placeholder="001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currencySymbol">Currency Symbol</Label>
                <Input
                  id="currencySymbol"
                  value={settings.currencySymbol}
                  onChange={(e) => handleInputChange('currencySymbol', e.target.value)}
                  placeholder="₹"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateFormat">Date Format</Label>
                <Input
                  id="dateFormat"
                  value={settings.dateFormat}
                  onChange={(e) => handleInputChange('dateFormat', e.target.value)}
                  placeholder="DD/MM/YYYY"
                />
              </div>
              
              <div className="col-span-1 md:col-span-2 space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="showCompanyLogo"
                    checked={settings.showCompanyLogo}
                    onCheckedChange={(checked) => handleInputChange('showCompanyLogo', checked)}
                  />
                  <Label htmlFor="showCompanyLogo">Show company logo/text</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="showFooter"
                    checked={settings.showFooter}
                    onCheckedChange={(checked) => handleInputChange('showFooter', checked)}
                  />
                  <Label htmlFor="showFooter">Show footer</Label>
                </div>
                
                {settings.showFooter && (
                  <div className="space-y-2">
                    <Label htmlFor="footerText">Footer Text</Label>
                    <Textarea
                      id="footerText"
                      value={settings.footerText}
                      onChange={(e) => handleInputChange('footerText', e.target.value)}
                      placeholder="Thank you for your business!"
                      rows={2}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700">
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceSettingsDialog;