import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings as SettingsIcon, Building2, FileText, Users, Shield } from "lucide-react";

const Settings = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Configure your company profile, GST settings, and preferences.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="hover:shadow-elegant transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Company Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Update company details, GSTIN, and business information
            </p>
            <Button variant="outline" className="w-full">
              Manage Company Profile
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-elegant transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Invoice Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Configure invoice templates, numbering, and PDF settings
            </p>
            <Button variant="outline" className="w-full">
              Configure Invoices
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-elegant transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Manage user accounts and access permissions
            </p>
            <Button variant="outline" className="w-full">
              Manage Users
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-elegant transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security & Backup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Security settings and data backup configuration
            </p>
            <Button variant="outline" className="w-full">
              Security Settings
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Database Connection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <SettingsIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Connect to Database</p>
            <p className="mb-4">
              To enable full functionality including data storage, user management, and advanced features, 
              connect your project to Supabase.
            </p>
            <Button className="bg-gradient-primary">
              Connect to Supabase
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;