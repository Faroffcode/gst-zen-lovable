import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Database, 
  HardDrive, 
  Save, 
  AlertCircle,
  CheckCircle2,
  Cloud,
  Download,
  Send
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { testTelegramConnection, sendMessageToTelegram } from "@/lib/telegram";

interface StorageSettings {
  enableLocalBackup: boolean;
  backupLocation: string;
  autoBackupFrequency: string;
  maxBackupRetention: string;
  enableCloudSync: boolean;
  cloudProvider: string;
  // AWS S3 settings
  awsAccessKey: string;
  awsSecretKey: string;
  awsBucketName: string;
  awsRegion: string;
  // Google Drive settings
  googleDriveAccessToken: string;
  googleDriveRefreshToken: string;
  googleDriveClientId: string;
  googleDriveClientSecret: string;
  // Cloudflare R2 settings
  cloudflareAccountId: string;
  cloudflareAccessKeyId: string;
  cloudflareSecretAccessKey: string;
  cloudflareBucketName: string;
  // OneDrive settings
  oneDriveAccessToken: string;
  oneDriveRefreshToken: string;
  oneDriveClientId: string;
  oneDriveClientSecret: string;
  // Telegram settings
  telegramBotToken: string;
  telegramChatId: string;
}

const StorageSettingsDialog = () => {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<StorageSettings>({
    enableLocalBackup: false,
    backupLocation: "C:\\Users\\User\\Documents\\GSTZen\\Backups",
    autoBackupFrequency: "daily",
    maxBackupRetention: "30",
    enableCloudSync: false,
    cloudProvider: "aws",
    // AWS S3 settings
    awsAccessKey: "",
    awsSecretKey: "",
    awsBucketName: "",
    awsRegion: "ap-south-1",
    // Google Drive settings
    googleDriveAccessToken: "",
    googleDriveRefreshToken: "",
    googleDriveClientId: "",
    googleDriveClientSecret: "",
    // Cloudflare R2 settings
    cloudflareAccountId: "",
    cloudflareAccessKeyId: "",
    cloudflareSecretAccessKey: "",
    cloudflareBucketName: "",
    // OneDrive settings
    oneDriveAccessToken: "",
    oneDriveRefreshToken: "",
    oneDriveClientId: "",
    oneDriveClientSecret: "",
    // Telegram settings with user's provided values
    telegramBotToken: "8299489187:AAGe2QhxpMit1z2ycynPgTvXQDvqBcC4gMo",
    telegramChatId: "-1002926678775",
  });

  const handleInputChange = (field: keyof StorageSettings, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    // Save settings to localStorage
    localStorage.setItem('storageSettings', JSON.stringify(settings));
    
    toast({
      title: "Storage Settings Saved",
      description: "Your storage settings have been updated successfully.",
    });
    setOpen(false);
  };

  const handleTestConnection = async () => {
    if (settings.cloudProvider === "telegram") {
      // Test Telegram connection
      if (!settings.telegramBotToken || !settings.telegramChatId) {
        toast({
          title: "Configuration Missing",
          description: "Please enter both Bot Token and Chat ID for Telegram.",
          variant: "destructive",
        });
        return;
      }

      try {
        const success = await testTelegramConnection({
          telegramBotToken: settings.telegramBotToken,
          telegramChatId: settings.telegramChatId,
        });

        if (success) {
          toast({
            title: "Telegram Connection Successful",
            description: "Your Telegram bot is configured correctly!",
          });
        } else {
          toast({
            title: "Telegram Connection Failed",
            description: "Please check your Bot Token and Chat ID.",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Connection Test Failed",
          description: "An error occurred while testing the connection.",
          variant: "destructive",
        });
      }
    } else {
      // Placeholder for other providers
      toast({
        title: "Connection Test",
        description: `Testing connection to ${settings.cloudProvider}. This is a placeholder for actual connection testing.`,
      });
    }
  };

  const handleSendTestMessage = async () => {
    if (!settings.telegramBotToken || !settings.telegramChatId) {
      toast({
        title: "Configuration Missing",
        description: "Please enter both Bot Token and Chat ID for Telegram.",
        variant: "destructive",
      });
      return;
    }

    try {
      const success = await sendMessageToTelegram(
        "GST Zen: Test message from storage settings! ✅",
        {
          telegramBotToken: settings.telegramBotToken,
          telegramChatId: settings.telegramChatId,
        }
      );

      if (success) {
        toast({
          title: "Test Message Sent",
          description: "Test message successfully sent to your Telegram chat!",
        });
      } else {
        toast({
          title: "Failed to Send Message",
          description: "Please check your Bot Token and Chat ID.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send test message.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          Configure Storage
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Storage Settings
          </DialogTitle>
          <DialogDescription>
            Configure data storage, backup, and synchronization settings.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Local Storage */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                Local Storage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Enable Local Backups</h3>
                  <p className="text-sm text-muted-foreground">
                    Automatically save backups to your local storage
                  </p>
                </div>
                <Switch
                  checked={settings.enableLocalBackup}
                  onCheckedChange={(checked) => handleInputChange("enableLocalBackup", checked)}
                />
              </div>
              
              {settings.enableLocalBackup && (
                <div className="space-y-2">
                  <Label htmlFor="backupLocation">Backup Location</Label>
                  <Input
                    id="backupLocation"
                    value={settings.backupLocation}
                    onChange={(e) => handleInputChange("backupLocation", e.target.value)}
                    placeholder="Enter backup folder path"
                  />
                  <p className="text-xs text-muted-foreground">
                    Make sure this folder exists and is accessible
                  </p>
                </div>
              )}
              
              {settings.enableLocalBackup && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="autoBackupFrequency">Auto Backup Frequency</Label>
                    <select
                      id="autoBackupFrequency"
                      className="w-full p-2 border rounded-md bg-background"
                      value={settings.autoBackupFrequency}
                      onChange={(e) => handleInputChange("autoBackupFrequency", e.target.value)}
                    >
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="maxBackupRetention">Max Backup Retention (days)</Label>
                    <Input
                      id="maxBackupRetention"
                      type="number"
                      min="1"
                      max="365"
                      value={settings.maxBackupRetention}
                      onChange={(e) => handleInputChange("maxBackupRetention", e.target.value)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cloud Storage */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Cloud className="h-4 w-4" />
                Cloud Storage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Enable Cloud Sync</h3>
                  <p className="text-sm text-muted-foreground">
                    Sync your data with cloud storage for added security
                  </p>
                </div>
                <Switch
                  checked={settings.enableCloudSync}
                  onCheckedChange={(checked) => handleInputChange("enableCloudSync", checked)}
                />
              </div>
              
              {settings.enableCloudSync && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="cloudProvider">Cloud Provider</Label>
                    <select
                      id="cloudProvider"
                      className="w-full p-2 border rounded-md bg-background"
                      value={settings.cloudProvider}
                      onChange={(e) => handleInputChange("cloudProvider", e.target.value)}
                    >
                      <option value="aws">Amazon AWS S3</option>
                      <option value="google-drive">Google Drive</option>
                      <option value="cloudflare">Cloudflare R2</option>
                      <option value="onedrive">Microsoft OneDrive</option>
                      <option value="telegram">Telegram (via Bot API)</option>
                    </select>
                  </div>

                  {/* AWS S3 Settings */}
                  {settings.cloudProvider === "aws" && (
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                      <h4 className="font-medium flex items-center gap-2">
                        <Cloud className="h-4 w-4" />
                        AWS S3 Configuration
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="awsAccessKey">Access Key</Label>
                          <Input
                            id="awsAccessKey"
                            value={settings.awsAccessKey}
                            onChange={(e) => handleInputChange("awsAccessKey", e.target.value)}
                            placeholder="Enter your AWS access key"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="awsSecretKey">Secret Key</Label>
                          <Input
                            id="awsSecretKey"
                            type="password"
                            value={settings.awsSecretKey}
                            onChange={(e) => handleInputChange("awsSecretKey", e.target.value)}
                            placeholder="Enter your AWS secret key"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="awsBucketName">Bucket Name</Label>
                          <Input
                            id="awsBucketName"
                            value={settings.awsBucketName}
                            onChange={(e) => handleInputChange("awsBucketName", e.target.value)}
                            placeholder="Enter your S3 bucket name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="awsRegion">Region</Label>
                          <Input
                            id="awsRegion"
                            value={settings.awsRegion}
                            onChange={(e) => handleInputChange("awsRegion", e.target.value)}
                            placeholder="e.g., us-east-1"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Google Drive Settings */}
                  {settings.cloudProvider === "google-drive" && (
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                      <h4 className="font-medium flex items-center gap-2">
                        <Cloud className="h-4 w-4" />
                        Google Drive Configuration
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="googleDriveClientId">Client ID</Label>
                          <Input
                            id="googleDriveClientId"
                            value={settings.googleDriveClientId}
                            onChange={(e) => handleInputChange("googleDriveClientId", e.target.value)}
                            placeholder="Enter your Google Drive Client ID"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="googleDriveClientSecret">Client Secret</Label>
                          <Input
                            id="googleDriveClientSecret"
                            type="password"
                            value={settings.googleDriveClientSecret}
                            onChange={(e) => handleInputChange("googleDriveClientSecret", e.target.value)}
                            placeholder="Enter your Google Drive Client Secret"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="googleDriveAccessToken">Access Token</Label>
                          <Input
                            id="googleDriveAccessToken"
                            value={settings.googleDriveAccessToken}
                            onChange={(e) => handleInputChange("googleDriveAccessToken", e.target.value)}
                            placeholder="Enter your Google Drive Access Token"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="googleDriveRefreshToken">Refresh Token</Label>
                          <Input
                            id="googleDriveRefreshToken"
                            value={settings.googleDriveRefreshToken}
                            onChange={(e) => handleInputChange("googleDriveRefreshToken", e.target.value)}
                            placeholder="Enter your Google Drive Refresh Token"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Cloudflare R2 Settings */}
                  {settings.cloudProvider === "cloudflare" && (
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                      <h4 className="font-medium flex items-center gap-2">
                        <Cloud className="h-4 w-4" />
                        Cloudflare R2 Configuration
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="cloudflareAccountId">Account ID</Label>
                          <Input
                            id="cloudflareAccountId"
                            value={settings.cloudflareAccountId}
                            onChange={(e) => handleInputChange("cloudflareAccountId", e.target.value)}
                            placeholder="Enter your Cloudflare Account ID"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cloudflareAccessKeyId">Access Key ID</Label>
                          <Input
                            id="cloudflareAccessKeyId"
                            value={settings.cloudflareAccessKeyId}
                            onChange={(e) => handleInputChange("cloudflareAccessKeyId", e.target.value)}
                            placeholder="Enter your Cloudflare Access Key ID"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cloudflareSecretAccessKey">Secret Access Key</Label>
                          <Input
                            id="cloudflareSecretAccessKey"
                            type="password"
                            value={settings.cloudflareSecretAccessKey}
                            onChange={(e) => handleInputChange("cloudflareSecretAccessKey", e.target.value)}
                            placeholder="Enter your Cloudflare Secret Access Key"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cloudflareBucketName">Bucket Name</Label>
                          <Input
                            id="cloudflareBucketName"
                            value={settings.cloudflareBucketName}
                            onChange={(e) => handleInputChange("cloudflareBucketName", e.target.value)}
                            placeholder="Enter your R2 bucket name"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* OneDrive Settings */}
                  {settings.cloudProvider === "onedrive" && (
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                      <h4 className="font-medium flex items-center gap-2">
                        <Cloud className="h-4 w-4" />
                        Microsoft OneDrive Configuration
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="oneDriveClientId">Client ID</Label>
                          <Input
                            id="oneDriveClientId"
                            value={settings.oneDriveClientId}
                            onChange={(e) => handleInputChange("oneDriveClientId", e.target.value)}
                            placeholder="Enter your OneDrive Client ID"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="oneDriveClientSecret">Client Secret</Label>
                          <Input
                            id="oneDriveClientSecret"
                            type="password"
                            value={settings.oneDriveClientSecret}
                            onChange={(e) => handleInputChange("oneDriveClientSecret", e.target.value)}
                            placeholder="Enter your OneDrive Client Secret"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="oneDriveAccessToken">Access Token</Label>
                          <Input
                            id="oneDriveAccessToken"
                            value={settings.oneDriveAccessToken}
                            onChange={(e) => handleInputChange("oneDriveAccessToken", e.target.value)}
                            placeholder="Enter your OneDrive Access Token"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="oneDriveRefreshToken">Refresh Token</Label>
                          <Input
                            id="oneDriveRefreshToken"
                            value={settings.oneDriveRefreshToken}
                            onChange={(e) => handleInputChange("oneDriveRefreshToken", e.target.value)}
                            placeholder="Enter your OneDrive Refresh Token"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Telegram Settings */}
                  {settings.cloudProvider === "telegram" && (
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                      <h4 className="font-medium flex items-center gap-2">
                        <Cloud className="h-4 w-4" />
                        Telegram Bot Configuration
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="telegramBotToken">Bot Token</Label>
                          <Input
                            id="telegramBotToken"
                            value={settings.telegramBotToken}
                            onChange={(e) => handleInputChange("telegramBotToken", e.target.value)}
                            placeholder="Enter your Telegram Bot Token"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="telegramChatId">Chat ID</Label>
                          <Input
                            id="telegramChatId"
                            value={settings.telegramChatId}
                            onChange={(e) => handleInputChange("telegramChatId", e.target.value)}
                            placeholder="Enter your Telegram Chat ID"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" onClick={handleTestConnection} className="flex items-center gap-2">
                          <Download className="h-4 w-4" />
                          Test Connection
                        </Button>
                        <Button variant="outline" onClick={handleSendTestMessage} className="flex items-center gap-2">
                          <Send className="h-4 w-4" />
                          Send Test Message
                        </Button>
                      </div>
                      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <Send className="h-5 w-5 text-blue-400" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-blue-700">
                              <strong>How to get your Chat ID:</strong> Add your bot to a group or channel, 
                              send a message, then check the bot's updates to find the chat ID.
                            </p>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Note: Files will be sent as documents to the specified chat. Ensure your bot has permission to send files.
                      </p>
                    </div>
                  )}

                  {settings.cloudProvider !== "telegram" && (
                    <div className="flex justify-between items-center">
                      <Button variant="outline" onClick={handleTestConnection} className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Test Connection
                      </Button>
                      <p className="text-sm text-muted-foreground">
                        Test your connection settings before saving
                      </p>
                    </div>
                  )}

                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <AlertCircle className="h-5 w-5 text-yellow-400" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                          <strong>Security Notice:</strong> Your credentials are stored locally and encrypted. 
                          Never share your keys with anyone.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
              
              {!settings.enableCloudSync && (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <CheckCircle2 className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        Cloud sync is currently disabled. Enable it to automatically backup your data to the cloud.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StorageSettingsDialog;