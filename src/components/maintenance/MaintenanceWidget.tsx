import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  Wrench,
  CheckCircle2,
  Clock,
  ArrowRight,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useMaintenanceReports, MaintenanceReport } from "@/hooks/useMaintenanceReports";
import { toast } from "@/hooks/use-toast";

const ISSUE_TYPE_LABELS: Record<string, string> = {
  not_working: "Not Working",
  stuck_prize: "Stuck Prize",
  coin_jam: "Coin Jam",
  display_issue: "Display Issue",
  other: "Other",
};

const SEVERITY_CONFIG: Record<string, { label: string; className: string }> = {
  low: { label: "Low", className: "bg-slate-500/10 text-slate-600 border-slate-500/20" },
  medium: { label: "Medium", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  high: { label: "High", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  open: { label: "Open", icon: AlertTriangle, className: "text-amber-600" },
  in_progress: { label: "In Progress", icon: Wrench, className: "text-blue-600" },
  resolved: { label: "Resolved", icon: CheckCircle2, className: "text-green-600" },
};

export function MaintenanceWidget() {
  const navigate = useNavigate();
  const { openReports, inProgressReports, isLoaded, error, refetch, updateReport } = useMaintenanceReports();

  const handleStatusChange = async (report: MaintenanceReport, newStatus: string) => {
    const updates: Partial<MaintenanceReport> = { status: newStatus };
    if (newStatus === "resolved") {
      updates.resolved_at = new Date().toISOString();
    }

    const success = await updateReport(report.id, updates);
    if (success) {
      toast({
        title: "Status Updated",
        description: `Report marked as ${STATUS_CONFIG[newStatus]?.label || newStatus}`,
      });
    } else {
      toast({
        title: "Update Failed",
        description: "Could not update the report status.",
        variant: "destructive",
      });
    }
  };

  const activeReports = [...openReports, ...inProgressReports].slice(0, 5);
  const totalActive = openReports.length + inProgressReports.length;

  if (!isLoaded) {
    return (
      <Card className="glass-card">
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="glass-card border-destructive/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wrench className="h-5 w-5 text-muted-foreground" />
            Maintenance
          </CardTitle>
        </CardHeader>
        <CardContent className="py-6 text-center">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-destructive" />
          <p className="text-sm text-destructive mb-3">Failed to load</p>
          <Button variant="outline" size="sm" onClick={refetch}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "glass-card",
      openReports.length > 0 && "border-amber-500/30"
    )}>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Wrench className={cn(
            "h-5 w-5",
            openReports.length > 0 ? "text-amber-500" : "text-muted-foreground"
          )} />
          Maintenance
          {totalActive > 0 && (
            <Badge variant="secondary" className="ml-1">
              {totalActive} active
            </Badge>
          )}
        </CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/maintenance")}
        >
          View All
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-3">
        {activeReports.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-green-500/50" />
            <p className="text-sm font-medium text-green-600">All clear!</p>
            <p className="text-xs">No maintenance issues reported</p>
          </div>
        ) : (
          activeReports.map((report) => {
            const StatusIcon = STATUS_CONFIG[report.status]?.icon || AlertTriangle;
            const severityConfig = SEVERITY_CONFIG[report.severity] || SEVERITY_CONFIG.medium;

            return (
              <div
                key={report.id}
                className="p-3 rounded-lg border border-border/50 bg-muted/20 space-y-2"
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <StatusIcon className={cn("h-4 w-4 shrink-0", STATUS_CONFIG[report.status]?.className)} />
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        {report.machine_label || report.machine_type}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {report.location_name}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className={cn("shrink-0 text-xs", severityConfig.className)}>
                    {severityConfig.label}
                  </Badge>
                </div>

                {/* Issue Info */}
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    {ISSUE_TYPE_LABELS[report.issue_type] || report.issue_type}
                  </p>
                  <p className="text-sm line-clamp-2">{report.description}</p>
                </div>

                {/* Footer Row */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {format(new Date(report.created_at), "MMM d, h:mm a")}
                    {report.reporter_name && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {report.reporter_name}
                      </span>
                    )}
                  </div>

                  {/* Quick Status Change */}
                  <Select
                    value={report.status}
                    onValueChange={(value) => handleStatusChange(report, value)}
                  >
                    <SelectTrigger className="h-7 w-[110px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background">
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            );
          })
        )}

        {totalActive > 5 && (
          <p className="text-xs text-center text-muted-foreground">
            +{totalActive - 5} more issues
          </p>
        )}
      </CardContent>
    </Card>
  );
}
