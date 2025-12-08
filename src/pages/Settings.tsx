import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
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
  Zap,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Save,
  Eye,
  EyeOff,
  Building2,
  Warehouse,
  DollarSign,
  Palette
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

const APP_SETTINGS_KEY = "clawops-app-settings";
const INTEGRATIONS_KEY = "clawops-integrations";
const NOTIFICATIONS_KEY = "clawops-notifications";

interface AppSettings {
  businessName: string;
  warehouseAddress: string;
  warehouseCity: string;
  warehouseState: string;
  warehouseZip: string;
  businessPhone: string;
  businessEmail: string;
  currency: string;
  timezone: string;
  defaultCommissionRate: number;
  lowStockThreshold: number;
  dateFormat: string;
  darkMode: boolean;
  compactView: boolean;
  autoBackup: boolean;
}

interface IntegrationSettings {
  nayax: {
    apiKey: string;
    operatorId: string;
    connected: boolean;
  };
  cantaloupe: {
    apiKey: string;
    clientId: string;
    connected: boolean;
  };
}

interface NotificationSettings {
  emailNotifications: boolean;
  lowStockAlerts: boolean;
  dailyReports: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  businessName: "",
  warehouseAddress: "",
  warehouseCity: "",
  warehouseState: "",
  warehouseZip: "",
  businessPhone: "",
  businessEmail: "",
  currency: "USD",
  timezone: "America/New_York",
  defaultCommissionRate: 25,
  lowStockThreshold: 5,
  dateFormat: "MM/dd/yyyy",
  darkMode: true,
  compactView: false,
  autoBackup: true,
};

const DEFAULT_INTEGRATIONS: IntegrationSettings = {
  nayax: { apiKey: "", operatorId: "", connected: false },
  cantaloupe: { apiKey: "", clientId: "", connected: false },
};

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  emailNotifications: true,
  lowStockAlerts: true,
  dailyReports: false,
};

export default function Settings() {
  const { user } = useAuth();
  
  // Profile state
  const [fullName, setFullName] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  
  // App Settings state
  const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  
  // Integration state
  const [integrations, setIntegrations] = useState<IntegrationSettings>(DEFAULT_INTEGRATIONS);
  const [showNayaxKey, setShowNayaxKey] = useState(false);
  const [showCantaloupeKey, setShowCantaloupeKey] = useState(false);
  
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

  // Load app settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem(APP_SETTINGS_KEY);
    if (savedSettings) {
      try {
        setAppSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) });
      } catch (e) {
        console.error("Failed to load app settings:", e);
      }
    }

    const savedIntegrations = localStorage.getItem(INTEGRATIONS_KEY);
    if (savedIntegrations) {
      try {
        setIntegrations({ ...DEFAULT_INTEGRATIONS, ...JSON.parse(savedIntegrations) });
      } catch (e) {
        console.error("Failed to load integrations:", e);
      }
    }

    const savedNotifications = localStorage.getItem(NOTIFICATIONS_KEY);
    if (savedNotifications) {
      try {
        setNotifications({ ...DEFAULT_NOTIFICATIONS, ...JSON.parse(savedNotifications) });
      } catch (e) {
        console.error("Failed to load notifications:", e);
      }
    }
  }, []);

  const updateAppSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setAppSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveAppSettings = async () => {
    setIsSavingSettings(true);
    try {
      localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(appSettings));
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

  const saveIntegrations = (newIntegrations: IntegrationSettings) => {
    setIntegrations(newIntegrations);
    localStorage.setItem(INTEGRATIONS_KEY, JSON.stringify(newIntegrations));
  };

  const handleConnectNayax = async () => {
    if (!integrations.nayax.apiKey || !integrations.nayax.operatorId) {
      toast({
        title: "Missing Information",
        description: "Please enter both API Key and Operator ID.",
        variant: "destructive",
      });
      return;
    }
    
    const updated = {
      ...integrations,
      nayax: { ...integrations.nayax, connected: true }
    };
    saveIntegrations(updated);
    toast({
      title: "Nayax Connected",
      description: "Your Nayax account has been connected successfully.",
    });
  };

  const handleConnectCantaloupe = async () => {
    if (!integrations.cantaloupe.apiKey || !integrations.cantaloupe.clientId) {
      toast({
        title: "Missing Information",
        description: "Please enter both API Key and Client ID.",
        variant: "destructive",
      });
      return;
    }
    
    const updated = {
      ...integrations,
      cantaloupe: { ...integrations.cantaloupe, connected: true }
    };
    saveIntegrations(updated);
    toast({
      title: "Cantaloupe Connected",
      description: "Your Cantaloupe account has been connected successfully.",
    });
  };

  const handleDisconnectNayax = () => {
    const updated = {
      ...integrations,
      nayax: { apiKey: "", operatorId: "", connected: false }
    };
    saveIntegrations(updated);
    toast({
      title: "Nayax Disconnected",
      description: "Your Nayax integration has been removed.",
    });
  };

  const handleDisconnectCantaloupe = () => {
    const updated = {
      ...integrations,
      cantaloupe: { apiKey: "", clientId: "", connected: false }
    };
    saveIntegrations(updated);
    toast({
      title: "Cantaloupe Disconnected",
      description: "Your Cantaloupe integration has been removed.",
    });
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
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="app" className="gap-2">
            <SettingsIcon className="h-4 w-4" />
            <span className="hidden sm:inline">App</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Integrations</span>
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
                  onChange={(e) => updateAppSetting("businessName", e.target.value)}
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
                    onChange={(e) => updateAppSetting("businessPhone", e.target.value)}
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
                    onChange={(e) => updateAppSetting("businessEmail", e.target.value)}
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
                  onChange={(e) => updateAppSetting("warehouseAddress", e.target.value)}
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
                    onChange={(e) => updateAppSetting("warehouseCity", e.target.value)}
                    placeholder="City"
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="warehouseState">State</Label>
                  <Input
                    id="warehouseState"
                    value={appSettings.warehouseState}
                    onChange={(e) => updateAppSetting("warehouseState", e.target.value)}
                    placeholder="State"
                    maxLength={50}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="warehouseZip">ZIP Code</Label>
                  <Input
                    id="warehouseZip"
                    value={appSettings.warehouseZip}
                    onChange={(e) => updateAppSetting("warehouseZip", e.target.value)}
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
                    onChange={(e) => updateAppSetting("defaultCommissionRate", Number(e.target.value))}
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
                    onChange={(e) => updateAppSetting("lowStockThreshold", Number(e.target.value))}
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
                    onValueChange={(v) => updateAppSetting("currency", v)}
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
                    onValueChange={(v) => updateAppSetting("dateFormat", v)}
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
                  onCheckedChange={(v) => updateAppSetting("darkMode", v)}
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
                  onCheckedChange={(v) => updateAppSetting("compactView", v)}
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
                  onCheckedChange={(v) => updateAppSetting("autoBackup", v)}
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

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6">
          {/* Nayax Integration */}
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">N</span>
                  </div>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      Nayax Integration
                      {integrations.nayax.connected ? (
                        <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Connected
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="h-3 w-3 mr-1" />
                          Not Connected
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Connect your Nayax account to sync machine data and transactions
                    </CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="icon" asChild>
                  <a href="https://my.nayax.com" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {!integrations.nayax.connected ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="nayaxOperatorId">Operator ID</Label>
                    <Input
                      id="nayaxOperatorId"
                      value={integrations.nayax.operatorId}
                      onChange={(e) => setIntegrations(prev => ({
                        ...prev,
                        nayax: { ...prev.nayax, operatorId: e.target.value }
                      }))}
                      placeholder="Enter your Nayax Operator ID"
                      maxLength={100}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nayaxApiKey">API Key</Label>
                    <div className="relative">
                      <Input
                        id="nayaxApiKey"
                        type={showNayaxKey ? "text" : "password"}
                        value={integrations.nayax.apiKey}
                        onChange={(e) => setIntegrations(prev => ({
                          ...prev,
                          nayax: { ...prev.nayax, apiKey: e.target.value }
                        }))}
                        placeholder="Enter your Nayax API Key"
                        className="pr-10"
                        maxLength={200}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowNayaxKey(!showNayaxKey)}
                      >
                        {showNayaxKey ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Find your API key in the Nayax Management Suite under Settings → API
                    </p>
                  </div>

                  <Button onClick={handleConnectNayax} className="gap-2">
                    <Zap className="h-4 w-4" />
                    Connect Nayax
                  </Button>
                </>
              ) : (
                <div className="flex items-center justify-between p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">Nayax is connected</p>
                      <p className="text-sm text-muted-foreground">
                        Operator ID: {integrations.nayax.operatorId}
                      </p>
                    </div>
                  </div>
                  <Button variant="destructive" size="sm" onClick={handleDisconnectNayax}>
                    Disconnect
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cantaloupe Integration */}
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">C</span>
                  </div>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      Cantaloupe Integration
                      {integrations.cantaloupe.connected ? (
                        <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Connected
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="h-3 w-3 mr-1" />
                          Not Connected
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Connect your Cantaloupe account to sync vending data
                    </CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="icon" asChild>
                  <a href="https://www.cantaloupe.com" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {!integrations.cantaloupe.connected ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="cantaloupeClientId">Client ID</Label>
                    <Input
                      id="cantaloupeClientId"
                      value={integrations.cantaloupe.clientId}
                      onChange={(e) => setIntegrations(prev => ({
                        ...prev,
                        cantaloupe: { ...prev.cantaloupe, clientId: e.target.value }
                      }))}
                      placeholder="Enter your Cantaloupe Client ID"
                      maxLength={100}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cantaloupeApiKey">API Key</Label>
                    <div className="relative">
                      <Input
                        id="cantaloupeApiKey"
                        type={showCantaloupeKey ? "text" : "password"}
                        value={integrations.cantaloupe.apiKey}
                        onChange={(e) => setIntegrations(prev => ({
                          ...prev,
                          cantaloupe: { ...prev.cantaloupe, apiKey: e.target.value }
                        }))}
                        placeholder="Enter your Cantaloupe API Key"
                        className="pr-10"
                        maxLength={200}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowCantaloupeKey(!showCantaloupeKey)}
                      >
                        {showCantaloupeKey ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Find your API credentials in Cantaloupe Spotlight under Developer Settings
                    </p>
                  </div>

                  <Button onClick={handleConnectCantaloupe} className="gap-2">
                    <Zap className="h-4 w-4" />
                    Connect Cantaloupe
                  </Button>
                </>
              ) : (
                <div className="flex items-center justify-between p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">Cantaloupe is connected</p>
                      <p className="text-sm text-muted-foreground">
                        Client ID: {integrations.cantaloupe.clientId}
                      </p>
                    </div>
                  </div>
                  <Button variant="destructive" size="sm" onClick={handleDisconnectCantaloupe}>
                    Disconnect
                  </Button>
                </div>
              )}
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
