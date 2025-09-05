import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, Package } from "lucide-react";
import StorageSettingsDialog from "@/components/StorageSettingsDialog";
import ManageUnitsDialog from "@/components/ManageUnitsDialog";

const Settings = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Configure your units, storage settings, and preferences.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-elegant transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Manage Units
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Add, edit, or remove measurement units for your products
            </p>
            <ManageUnitsDialog />
          </CardContent>
        </Card>

        <Card className="hover:shadow-elegant transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Storage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Configure data storage, backup, and synchronization settings
            </p>
            <StorageSettingsDialog />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;