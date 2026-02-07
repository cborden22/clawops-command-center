import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MessageSquare, Bug, Lightbulb, HelpCircle } from "lucide-react";
import { useFeedback, FeedbackType } from "@/hooks/useFeedback";
import { useAuth } from "@/contexts/AuthContext";

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const feedbackTypes: { value: FeedbackType; label: string; icon: React.ReactNode; description: string }[] = [
  {
    value: "bug",
    label: "Bug Report",
    icon: <Bug className="h-4 w-4" />,
    description: "Something isn't working correctly",
  },
  {
    value: "feature",
    label: "Feature Request",
    icon: <Lightbulb className="h-4 w-4" />,
    description: "Suggest a new feature or improvement",
  },
  {
    value: "other",
    label: "Other",
    icon: <HelpCircle className="h-4 w-4" />,
    description: "General feedback or question",
  },
];

export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  const { user } = useAuth();
  const { submitFeedback, isSubmitting } = useFeedback();
  const [type, setType] = useState<FeedbackType>("bug");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = async () => {
    const success = await submitFeedback({
      type,
      description,
      email: email || user?.email,
    });

    if (success) {
      setDescription("");
      setEmail("");
      setType("bug");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Report an Issue
          </DialogTitle>
          <DialogDescription>
            Let us know about bugs, feature requests, or anything else.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Feedback Type */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Type</Label>
            <RadioGroup
              value={type}
              onValueChange={(value) => setType(value as FeedbackType)}
              className="grid grid-cols-3 gap-2"
            >
              {feedbackTypes.map((ft) => (
                <Label
                  key={ft.value}
                  htmlFor={ft.value}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border cursor-pointer transition-colors ${
                    type === ft.value
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <RadioGroupItem value={ft.value} id={ft.value} className="sr-only" />
                  {ft.icon}
                  <span className="text-xs mt-1 font-medium">{ft.label}</span>
                </Label>
              ))}
            </RadioGroup>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder={
                type === "bug"
                  ? "Please describe the issue. What happened? What did you expect?"
                  : type === "feature"
                  ? "What feature would you like to see? How would it help you?"
                  : "Tell us what's on your mind..."
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Contact Email (optional) */}
          <div className="space-y-2">
            <Label htmlFor="email">Contact Email (optional)</Label>
            <Input
              id="email"
              type="email"
              placeholder={user?.email || "your@email.com"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              We'll use this to follow up if needed
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !description.trim()}
          >
            {isSubmitting ? "Submitting..." : "Submit Feedback"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
