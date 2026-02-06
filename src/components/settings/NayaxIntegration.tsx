import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  CreditCard, 
  RefreshCw, 
  Unplug, 
  Check, 
  AlertCircle,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { useNayaxIntegration } from "@/hooks/useNayaxIntegration";
import { formatDistanceToNow } from "date-fns";

export function NayaxIntegration() {
  const {
    settings,
    isLoading,
    isSyncing,
    linkedMachinesCount,
    isConnected,
    connect,
    disconnect,
    syncTransactions,
  } = useNayaxIntegration();

  const [apiToken, setApiToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const handleConnect = async () => {
    if (!apiToken.trim()) return;
    
    setIsConnecting(true);
    const success = await connect(apiToken);
    if (success) {
      setApiToken("");
    }
    setIsConnecting(false);
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect from Nayax? This will stop syncing card transactions.")) {
      return;
    }
    
    setIsDisconnecting(true);
    await disconnect();
    setIsDisconnecting(false);
  };

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          Nayax Integration
        </CardTitle>
        <CardDescription>
          Connect your Nayax account to automatically sync credit card transactions from your machines.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connection Status */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Status:</span>
          {isConnected ? (
            <Badge variant="default" className="bg-primary hover:bg-primary/90">
              <Check className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          ) : (
            <Badge variant="secondary">
              <AlertCircle className="h-3 w-3 mr-1" />
              Not Connected
            </Badge>
          )}
        </div>

        {isConnected ? (
          <>
            {/* Connected State */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Last Sync</p>
                  <p className="font-medium">
                    {settings?.lastSync 
                      ? formatDistanceToNow(new Date(settings.lastSync), { addSuffix: true })
                      : "Never"
                    }
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Machines Linked</p>
                  <p className="font-medium">{linkedMachinesCount}</p>
                </div>
              </div>

              {linkedMachinesCount === 0 && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                  <p className="text-sm text-destructive">
                    No machines have Nayax IDs configured yet. Edit your machines and add their Telemetry IDs to sync transactions.
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={syncTransactions} 
                  disabled={isSyncing || linkedMachinesCount === 0}
                  className="gap-2"
                >
                  {isSyncing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Sync Now
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleDisconnect}
                  disabled={isDisconnecting}
                  className="gap-2"
                >
                  {isDisconnecting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Unplug className="h-4 w-4" />
                  )}
                  Disconnect
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Not Connected State */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiToken">API Token</Label>
                <div className="relative">
                  <Input
                    id="apiToken"
                    type={showToken ? "text" : "password"}
                    value={apiToken}
                    onChange={(e) => setApiToken(e.target.value)}
                    placeholder="Paste your Nayax API token here"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowToken(!showToken)}
                  >
                    {showToken ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <Button 
                onClick={handleConnect} 
                disabled={!apiToken.trim() || isConnecting}
                className="w-full gap-2"
              >
                {isConnecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                Connect to Nayax
              </Button>
            </div>

            <Separator />

            {/* Instructions */}
            <div className="space-y-3">
              <p className="text-sm font-medium">How to get your API Token:</p>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Log in to <a href="https://my.nayax.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">Nayax Core <ExternalLink className="h-3 w-3" /></a></li>
                <li>Click on your name → Settings</li>
                <li>Go to the "Security and Login" tab</li>
                <li>Under "User Tokens", click "Show Token"</li>
                <li>Copy and paste the token here</li>
              </ol>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
