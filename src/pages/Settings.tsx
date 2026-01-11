import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  User, 
  Settings as SettingsIcon, 
  Key,
  Bell, 
  Shield, 
  Save,
  Building2,
  Warehouse,
  DollarSign,
  Palette
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

const NOTIFICATIONS_KEY = "clawops-notifications";

interface NotificationSettings {
  emailNotifications: boolean;
  lowStockAlerts: boolean;
  dailyReports: boolean;
}

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  emailNotifications: true,
  lowStockAlerts: true,
  dailyReports: false,
};

export default function Settings() {
  const { user } = useAuth();
  const { settings: appSettings, updateSetting, saveSettings, isLoaded } = useAppSettings();
  
  // Profile state
  const [fullName, setFullName] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  
  // App Settings saving state
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  
  // Notification state
  const [notifications, setNotifications] = useState<NotificationSettings>(DEFAULT_NOTIFICATIONS);
  
  // Security state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Load profile from user metadata
  useEffect(() => {
    if (user) {
      setFullName(user.user_metadata?.full_name || "");
    }
  }, [user]);

  // Load notifications from localStorage
  useEffect(() => {
    const savedNotifications = localStorage.getItem(NOTIFICATIONS_KEY);
    if (savedNotifications) {
      try {
        setNotifications({ ...DEFAULT_NOTIFICATIONS, ...JSON.parse(savedNotifications) });
      } catch (e) {
        console.error("Failed to load notifications:", e);
      }
    }
  }, []);

  const handleSaveAppSettings = async () => {
    setIsSavingSettings(true);
    try {
      saveSettings();
      toast({
        title: "Settings Saved",
        description: "Your app settings have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings.",
        variant: "destructive",
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleToggleDarkMode = (checked: boolean) => {
    updateSetting("darkMode", checked);
    toast({
      title: checked ? "Dark Mode Enabled" : "Light Mode Enabled",
      description: `The interface is now in ${checked ? "dark" : "light"} mode.`,
    });
  };

  const handleToggleCompactView = (checked: boolean) => {
    updateSetting("compactView", checked);
    toast({
      title: checked ? "Compact View Enabled" : "Standard View Enabled",
      description: `The interface is now in ${checked ? "compact" : "standard"} mode.`,
    });
  };

  const handleToggleAutoBackup = (checked: boolean) => {
    updateSetting("autoBackup", checked);
    toast({
      title: checked ? "Auto Backup Enabled" : "Auto Backup Disabled",
      description: checked 
        ? "Your data will be automatically backed up." 
        : "Automatic backups have been disabled.",
    });
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setIsUpdatingProfile(true);
    try {
      // Update user metadata in Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: fullName }
      });
      
      if (authError) throw authError;

      // Also update the profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          user_id: user.id,
          full_name: fullName,
          email: user.email,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

      if (profileError) throw profileError;

      toast({
        title: "Profile Updated",
        description: "Your profile has been saved successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const updateNotification = <K extends keyof NotificationSettings>(key: K, value: boolean) => {
    const updated = { ...notifications, [key]: value };
    setNotifications(updated);
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
    toast({
      title: "Preferences Updated",
      description: "Your notification preferences have been saved.",
    });
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast({
        title: "Missing Information",
        description: "Please fill in all password fields.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "New password and confirmation must match.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update password.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      return;
    }

    toast({
      title: "Account Deletion",
      description: "Please contact support to delete your account.",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gold-500 to-gold-600 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your account, business settings, and integrations
        </p>
      </div>

      <Tabs defaultValue="app" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="app" className="gap-2">
            <SettingsIcon className="h-4 w-4" />
            <span className="hidden sm:inline">App</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
        </TabsList>

        {/* App Settings Tab */}
        <TabsContent value="app" className="space-y-6">
          {/* Business Information */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Business Information
              </CardTitle>
              <CardDescription>
                Your business details used in documents and reports
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  value={appSettings.businessName}
                  onChange={(e) => updateSetting("businessName", e.target.value)}
                  placeholder="e.g., Acme Claw Machines LLC"
                  maxLength={100}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessPhone">Business Phone</Label>
                  <Input
                    id="businessPhone"
                    value={appSettings.businessPhone}
                    onChange={(e) => updateSetting("businessPhone", e.target.value)}
                    placeholder="(555) 123-4567"
                    maxLength={20}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessEmail">Business Email</Label>
                  <Input
                    id="businessEmail"
                    type="email"
                    value={appSettings.businessEmail}
                    onChange={(e) => updateSetting("businessEmail", e.target.value)}
                    placeholder="contact@business.com"
                    maxLength={100}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Warehouse Address */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Warehouse className="h-5 w-5 text-primary" />
                Warehouse Address
              </CardTitle>
              <CardDescription>
                Your main warehouse or storage location
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="warehouseAddress">Street Address</Label>
                <Input
                  id="warehouseAddress"
                  value={appSettings.warehouseAddress}
                  onChange={(e) => updateSetting("warehouseAddress", e.target.value)}
                  placeholder="123 Main Street"
                  maxLength={200}
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="warehouseCity">City</Label>
                  <Input
                    id="warehouseCity"
                    value={appSettings.warehouseCity}
                    onChange={(e) => updateSetting("warehouseCity", e.target.value)}
                    placeholder="City"
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="warehouseState">State</Label>
                  <Input
                    id="warehouseState"
                    value={appSettings.warehouseState}
                    onChange={(e) => updateSetting("warehouseState", e.target.value)}
                    placeholder="State"
                    maxLength={50}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="warehouseZip">ZIP Code</Label>
                  <Input
                    id="warehouseZip"
                    value={appSettings.warehouseZip}
                    onChange={(e) => updateSetting("warehouseZip", e.target.value)}
                    placeholder="12345"
                    maxLength={10}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Default Values */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Default Values
              </CardTitle>
              <CardDescription>
                Set defaults for new locations and inventory
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultCommissionRate">Default Commission Rate (%)</Label>
                  <Input
                    id="defaultCommissionRate"
                    type="number"
                    min="0"
                    max="100"
                    value={appSettings.defaultCommissionRate}
                    onChange={(e) => updateSetting("defaultCommissionRate", Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Applied to new locations by default
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                  <Input
                    id="lowStockThreshold"
                    type="number"
                    min="0"
                    value={appSettings.lowStockThreshold}
                    onChange={(e) => updateSetting("lowStockThreshold", Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Items below this count trigger low stock alerts
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select 
                    value={appSettings.currency} 
                    onValueChange={(v) => updateSetting("currency", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="CAD">CAD ($)</SelectItem>
                      <SelectItem value="AUD">AUD ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select 
                    value={appSettings.dateFormat} 
                    onValueChange={(v) => updateSetting("dateFormat", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/dd/yyyy">MM/DD/YYYY</SelectItem>
                      <SelectItem value="dd/MM/yyyy">DD/MM/YYYY</SelectItem>
                      <SelectItem value="yyyy-MM-dd">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Display Preferences */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                Display Preferences
              </CardTitle>
              <CardDescription>
                Customize how the app looks and behaves
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="darkMode">Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Use dark theme for the interface
                  </p>
                </div>
                <Switch
                  id="darkMode"
                  checked={appSettings.darkMode}
                  onCheckedChange={handleToggleDarkMode}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="compactView">Compact View</Label>
                  <p className="text-sm text-muted-foreground">
                    Show more data with less spacing
                  </p>
                </div>
                <Switch
                  id="compactView"
                  checked={appSettings.compactView}
                  onCheckedChange={handleToggleCompactView}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoBackup">Auto Backup</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically backup data to the cloud
                  </p>
                </div>
                <Switch
                  id="autoBackup"
                  checked={appSettings.autoBackup}
                  onCheckedChange={handleToggleAutoBackup}
                />
              </div>
            </CardContent>
          </Card>

          <Button 
            onClick={handleSaveAppSettings} 
            disabled={isSavingSettings}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isSavingSettings ? "Saving..." : "Save App Settings"}
          </Button>
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your personal information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted/50"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  maxLength={100}
                />
              </div>

              <Button 
                onClick={handleSaveProfile} 
                disabled={isUpdatingProfile}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {isUpdatingProfile ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose how you want to be notified
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailNotifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive important updates via email
                  </p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={notifications.emailNotifications}
                  onCheckedChange={(v) => updateNotification("emailNotifications", v)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="lowStockAlerts">Low Stock Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when inventory is running low
                  </p>
                </div>
                <Switch
                  id="lowStockAlerts"
                  checked={notifications.lowStockAlerts}
                  onCheckedChange={(v) => updateNotification("lowStockAlerts", v)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="dailyReports">Daily Reports</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive a daily summary of your operations
                  </p>
                </div>
                <Switch
                  id="dailyReports"
                  checked={notifications.dailyReports}
                  onCheckedChange={(v) => updateNotification("dailyReports", v)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                Password
              </CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <Button 
                className="gap-2" 
                onClick={handleUpdatePassword}
                disabled={isUpdatingPassword}
              >
                <Shield className="h-4 w-4" />
                {isUpdatingPassword ? "Updating..." : "Update Password"}
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card border-destructive/20">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible actions for your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={handleDeleteAccount}>
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
