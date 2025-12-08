import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  EyeOff
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function Settings() {
  const { user } = useAuth();
  
  // Profile state
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || "");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  
  // Nayax API state
  const [nayaxApiKey, setNayaxApiKey] = useState("");
  const [nayaxOperatorId, setNayaxOperatorId] = useState("");
  const [showNayaxKey, setShowNayaxKey] = useState(false);
  const [nayaxConnected, setNayaxConnected] = useState(false);
  
  // Cantaloupe API state
  const [cantaloupeApiKey, setCantaloupeApiKey] = useState("");
  const [cantaloupeClientId, setCantaloupeClientId] = useState("");
  const [showCantaloupeKey, setShowCantaloupeKey] = useState(false);
  const [cantaloupeConnected, setCantaloupeConnected] = useState(false);
  
  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [lowStockAlerts, setLowStockAlerts] = useState(true);
  const [dailyReports, setDailyReports] = useState(false);

  const handleSaveProfile = async () => {
    setIsUpdatingProfile(true);
    // TODO: Implement profile update with Supabase
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsUpdatingProfile(false);
    toast({
      title: "Profile Updated",
      description: "Your profile has been saved successfully.",
    });
  };

  const handleConnectNayax = async () => {
    if (!nayaxApiKey || !nayaxOperatorId) {
      toast({
        title: "Missing Information",
        description: "Please enter both API Key and Operator ID.",
        variant: "destructive",
      });
      return;
    }
    
    // TODO: Validate and store API credentials securely
    setNayaxConnected(true);
    toast({
      title: "Nayax Connected",
      description: "Your Nayax account has been connected successfully.",
    });
  };

  const handleConnectCantaloupe = async () => {
    if (!cantaloupeApiKey || !cantaloupeClientId) {
      toast({
        title: "Missing Information",
        description: "Please enter both API Key and Client ID.",
        variant: "destructive",
      });
      return;
    }
    
    // TODO: Validate and store API credentials securely
    setCantaloupeConnected(true);
    toast({
      title: "Cantaloupe Connected",
      description: "Your Cantaloupe account has been connected successfully.",
    });
  };

  const handleDisconnectNayax = () => {
    setNayaxConnected(false);
    setNayaxApiKey("");
    setNayaxOperatorId("");
    toast({
      title: "Nayax Disconnected",
      description: "Your Nayax integration has been removed.",
    });
  };

  const handleDisconnectCantaloupe = () => {
    setCantaloupeConnected(false);
    setCantaloupeApiKey("");
    setCantaloupeClientId("");
    toast({
      title: "Cantaloupe Disconnected",
      description: "Your Cantaloupe integration has been removed.",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gold-500 to-gold-600 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and integrations
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
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
                      {nayaxConnected ? (
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
              {!nayaxConnected ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="nayaxOperatorId">Operator ID</Label>
                    <Input
                      id="nayaxOperatorId"
                      value={nayaxOperatorId}
                      onChange={(e) => setNayaxOperatorId(e.target.value)}
                      placeholder="Enter your Nayax Operator ID"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nayaxApiKey">API Key</Label>
                    <div className="relative">
                      <Input
                        id="nayaxApiKey"
                        type={showNayaxKey ? "text" : "password"}
                        value={nayaxApiKey}
                        onChange={(e) => setNayaxApiKey(e.target.value)}
                        placeholder="Enter your Nayax API Key"
                        className="pr-10"
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
                        Operator ID: {nayaxOperatorId}
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
                      {cantaloupeConnected ? (
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
              {!cantaloupeConnected ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="cantaloupeClientId">Client ID</Label>
                    <Input
                      id="cantaloupeClientId"
                      value={cantaloupeClientId}
                      onChange={(e) => setCantaloupeClientId(e.target.value)}
                      placeholder="Enter your Cantaloupe Client ID"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cantaloupeApiKey">API Key</Label>
                    <div className="relative">
                      <Input
                        id="cantaloupeApiKey"
                        type={showCantaloupeKey ? "text" : "password"}
                        value={cantaloupeApiKey}
                        onChange={(e) => setCantaloupeApiKey(e.target.value)}
                        placeholder="Enter your Cantaloupe API Key"
                        className="pr-10"
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
                        Client ID: {cantaloupeClientId}
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
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
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
                  checked={lowStockAlerts}
                  onCheckedChange={setLowStockAlerts}
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
                  checked={dailyReports}
                  onCheckedChange={setDailyReports}
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
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                />
              </div>

              <Button className="gap-2">
                <Shield className="h-4 w-4" />
                Update Password
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
              <Button variant="destructive">Delete Account</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
