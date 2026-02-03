import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  AlertTriangle,
  Wrench,
  CheckCircle2,
  Clock,
  User,
  Phone,
  Trash2,
  MapPin,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Plus,
} from "lucide-react";
import { AddMaintenanceReportDialog } from "@/components/maintenance/AddMaintenanceReportDialog";
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

interface ReportCardProps {
  report: MaintenanceReport;
  onStatusChange: (report: MaintenanceReport, newStatus: string) => void;
  onResolutionNotesChange: (report: MaintenanceReport, notes: string) => void;
  onDelete: (report: MaintenanceReport) => void;
}

function ReportCard({ report, onStatusChange, onResolutionNotesChange, onDelete }: ReportCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState(report.resolution_notes || "");
  const [isSaving, setIsSaving] = useState(false);

  const StatusIcon = STATUS_CONFIG[report.status]?.icon || AlertTriangle;
  const severityConfig = SEVERITY_CONFIG[report.severity] || SEVERITY_CONFIG.medium;

  const handleSaveNotes = async () => {
    setIsSaving(true);
    await onResolutionNotesChange(report, resolutionNotes);
    setIsSaving(false);
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className={cn(
              "p-2 rounded-lg shrink-0",
              report.status === "open" && "bg-amber-500/10",
              report.status === "in_progress" && "bg-blue-500/10",
              report.status === "resolved" && "bg-green-500/10"
            )}>
              <StatusIcon className={cn("h-5 w-5", STATUS_CONFIG[report.status]?.className)} />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base font-semibold">
                {report.machine_label || report.machine_type}
              </CardTitle>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                <MapPin className="h-3 w-3" />
                {report.location_name}
              </div>
            </div>
          </div>
          <Badge variant="outline" className={cn("shrink-0", severityConfig.className)}>
            {severityConfig.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Issue Details */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {ISSUE_TYPE_LABELS[report.issue_type] || report.issue_type}
            </Badge>
          </div>
          <p className="text-sm">{report.description}</p>
        </div>

        {/* Reporter Info & Timestamps */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Reported: {format(new Date(report.created_at), "MMM d, yyyy h:mm a")}
          </span>
          {report.resolved_at && (
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Resolved: {format(new Date(report.resolved_at), "MMM d, yyyy h:mm a")}
            </span>
          )}
        </div>

        {(report.reporter_name || report.reporter_contact) && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {report.reporter_name && (
              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4 text-muted-foreground" />
                {report.reporter_name}
              </span>
            )}
            {report.reporter_contact && (
              <span className="flex items-center gap-1.5">
                <Phone className="h-4 w-4 text-muted-foreground" />
                {report.reporter_contact}
              </span>
            )}
          </div>
        )}

        {/* Expandable Resolution Notes */}
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between text-muted-foreground hover:text-foreground"
            onClick={() => setExpanded(!expanded)}
          >
            <span className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Resolution Notes
            </span>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>

          {expanded && (
            <div className="space-y-2 pl-2">
              <Textarea
                placeholder="Add notes about how this issue was resolved..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                rows={3}
              />
              <Button
                size="sm"
                onClick={handleSaveNotes}
                disabled={isSaving || resolutionNotes === (report.resolution_notes || "")}
              >
                {isSaving ? "Saving..." : "Save Notes"}
              </Button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <Select
            value={report.status}
            onValueChange={(value) => onStatusChange(report, value)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background">
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Report</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this maintenance report? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => onDelete(report)}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Maintenance() {
  const {
    openReports,
    inProgressReports,
    resolvedReports,
    isLoaded,
    updateReport,
    deleteReport,
    refetch,
  } = useMaintenanceReports();

  const [showAddDialog, setShowAddDialog] = useState(false);

  const handleStatusChange = async (report: MaintenanceReport, newStatus: string) => {
    const updates: Partial<MaintenanceReport> = { status: newStatus };
    if (newStatus === "resolved" && !report.resolved_at) {
      updates.resolved_at = new Date().toISOString();
    }
    if (newStatus !== "resolved") {
      updates.resolved_at = null;
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

  const handleResolutionNotesChange = async (report: MaintenanceReport, notes: string) => {
    const success = await updateReport(report.id, { resolution_notes: notes });
    if (success) {
      toast({
        title: "Notes Saved",
        description: "Resolution notes have been updated.",
      });
    } else {
      toast({
        title: "Save Failed",
        description: "Could not save resolution notes.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (report: MaintenanceReport) => {
    const success = await deleteReport(report.id);
    if (success) {
      toast({
        title: "Report Deleted",
        description: "The maintenance report has been removed.",
      });
    } else {
      toast({
        title: "Delete Failed",
        description: "Could not delete the report.",
        variant: "destructive",
      });
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading maintenance reports...</div>
      </div>
    );
  }

  const totalOpen = openReports.length;
  const totalInProgress = inProgressReports.length;
  const totalResolved = resolvedReports.length;

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Maintenance Reports</h1>
          <p className="text-muted-foreground">Manage and track machine issues reported by customers</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Report Issue
        </Button>
      </div>

      {/* Add Report Dialog */}
      <AddMaintenanceReportDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={refetch}
      />

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalOpen}</p>
                <p className="text-xs text-muted-foreground">Open</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Wrench className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalInProgress}</p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalResolved}</p>
                <p className="text-xs text-muted-foreground">Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Interface */}
      <Tabs defaultValue="open" className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="open" className="flex items-center gap-2">
            Open
            {totalOpen > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                {totalOpen}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="in_progress" className="flex items-center gap-2">
            In Progress
            {totalInProgress > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                {totalInProgress}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="resolved" className="flex items-center gap-2">
            Resolved
            {totalResolved > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                {totalResolved}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="space-y-4 mt-4">
          {openReports.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500/50" />
                <p className="font-medium text-green-600">All Clear!</p>
                <p className="text-sm text-muted-foreground">No open issues to address</p>
              </CardContent>
            </Card>
          ) : (
            openReports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onStatusChange={handleStatusChange}
                onResolutionNotesChange={handleResolutionNotesChange}
                onDelete={handleDelete}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="in_progress" className="space-y-4 mt-4">
          {inProgressReports.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="py-12 text-center">
                <Wrench className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="font-medium">No Reports In Progress</p>
                <p className="text-sm text-muted-foreground">Move open issues here when you start working on them</p>
              </CardContent>
            </Card>
          ) : (
            inProgressReports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onStatusChange={handleStatusChange}
                onResolutionNotesChange={handleResolutionNotesChange}
                onDelete={handleDelete}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4 mt-4">
          {resolvedReports.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="font-medium">No Resolved Reports Yet</p>
                <p className="text-sm text-muted-foreground">Completed issues will appear here</p>
              </CardContent>
            </Card>
          ) : (
            resolvedReports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onStatusChange={handleStatusChange}
                onResolutionNotesChange={handleResolutionNotesChange}
                onDelete={handleDelete}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
