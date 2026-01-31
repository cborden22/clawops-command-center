import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, CheckCircle2, Loader2, Sparkles, MapPin, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { z } from "zod";
import { getMachinePublicInfo, submitMaintenanceReport } from "@/hooks/useMaintenanceReports";

const reportSchema = z.object({
  issue_type: z.enum(["not_working", "stuck_prize", "coin_jam", "display_issue", "other"]),
  description: z.string().min(10, "Please provide at least 10 characters").max(1000, "Description too long"),
  severity: z.enum(["low", "medium", "high"]),
  reporter_name: z.string().max(100).optional(),
  reporter_contact: z.string().max(255).optional(),
});

type ReportFormData = z.infer<typeof reportSchema>;

interface MachineInfo {
  machine_type: string;
  custom_label: string | null;
  location_name: string;
}

export default function ReportIssue() {
  const { machineId } = useParams<{ machineId: string }>();
  const navigate = useNavigate();

  const [machineInfo, setMachineInfo] = useState<MachineInfo | null>(null);
  const [isLoadingMachine, setIsLoadingMachine] = useState(true);
  const [machineError, setMachineError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<ReportFormData>({
    issue_type: "other",
    description: "",
    severity: "medium",
    reporter_name: "",
    reporter_contact: "",
  });

  useEffect(() => {
    async function loadMachine() {
      if (!machineId) {
        setMachineError(true);
        setIsLoadingMachine(false);
        return;
      }

      try {
        const info = await getMachinePublicInfo(machineId);
        if (info) {
          setMachineInfo(info);
        } else {
          setMachineError(true);
        }
      } catch (error) {
        console.error("Error loading machine:", error);
        setMachineError(true);
      } finally {
        setIsLoadingMachine(false);
      }
    }

    loadMachine();
  }, [machineId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const result = reportSchema.safeParse(formData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0].toString()] = err.message;
        }
      });
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);

    try {
      await submitMaintenanceReport({
        machine_id: machineId!,
        reporter_name: formData.reporter_name || undefined,
        reporter_contact: formData.reporter_contact || undefined,
        issue_type: formData.issue_type,
        description: formData.description,
        severity: formData.severity,
      });

      setIsSubmitted(true);
    } catch (error) {
      console.error("Error submitting report:", error);
      setFormErrors({ submit: "Failed to submit report. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoadingMachine) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading machine info...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state - invalid machine
  if (machineError || !machineInfo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 rounded-full bg-destructive/10 mb-4">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Machine Not Found</h2>
            <p className="text-muted-foreground mb-6">
              This QR code doesn't match any registered machine. Please check the code and try again.
            </p>
            <Button variant="outline" onClick={() => navigate("/")}>
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 rounded-full bg-green-500/10 mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Thank You!</h2>
            <p className="text-muted-foreground mb-6">
              Your report has been submitted. The operator will be notified and address the issue as soon as possible.
            </p>
            <Button variant="outline" onClick={() => setIsSubmitted(false)}>
              Report Another Issue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const machineName = machineInfo.custom_label || machineInfo.machine_type;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Machine Info Header */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-lg">{machineName}</p>
                <div className="flex items-center gap-1 text-muted-foreground text-sm">
                  <MapPin className="h-3 w-3" />
                  {machineInfo.location_name}
                </div>
              </div>
            </div>
            {/* Read-only date/time display */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-primary/20 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{format(new Date(), "MMMM d, yyyy")}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{format(new Date(), "h:mm a")}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Report an Issue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Issue Type */}
              <div className="space-y-2">
                <Label htmlFor="issue_type">What's the problem?</Label>
                <Select
                  value={formData.issue_type}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, issue_type: value as any }))
                  }
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select issue type" />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    <SelectItem value="not_working">Machine not working</SelectItem>
                    <SelectItem value="stuck_prize">Prize is stuck</SelectItem>
                    <SelectItem value="coin_jam">Coins not accepted</SelectItem>
                    <SelectItem value="display_issue">Display problem</SelectItem>
                    <SelectItem value="other">Other issue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Describe the issue</Label>
                <Textarea
                  id="description"
                  placeholder="Please provide details about what happened..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="min-h-[100px]"
                />
                {formErrors.description && (
                  <p className="text-xs text-destructive">{formErrors.description}</p>
                )}
              </div>

              {/* Severity */}
              <div className="space-y-3">
                <Label>How urgent is this?</Label>
                <RadioGroup
                  value={formData.severity}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, severity: value as any }))
                  }
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="low" id="low" />
                    <Label htmlFor="low" className="font-normal cursor-pointer">
                      Low
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="medium" id="medium" />
                    <Label htmlFor="medium" className="font-normal cursor-pointer">
                      Medium
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="high" id="high" />
                    <Label htmlFor="high" className="font-normal cursor-pointer">
                      High
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Contact Info (Optional) */}
              <div className="space-y-4 pt-4 border-t border-border/50">
                <p className="text-sm text-muted-foreground">
                  Optional: Leave your contact info if you'd like updates
                </p>
                <div className="space-y-2">
                  <Label htmlFor="reporter_name">Your name</Label>
                  <Input
                    id="reporter_name"
                    placeholder="John Doe"
                    value={formData.reporter_name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, reporter_name: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reporter_contact">Phone or email</Label>
                  <Input
                    id="reporter_contact"
                    placeholder="your@email.com or phone"
                    value={formData.reporter_contact}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, reporter_contact: e.target.value }))
                    }
                  />
                </div>
              </div>

              {/* Submit Error */}
              {formErrors.submit && (
                <p className="text-sm text-destructive text-center">{formErrors.submit}</p>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Report"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-xs text-center text-muted-foreground">
          Powered by ClawOps
        </p>
      </div>
    </div>
  );
}
