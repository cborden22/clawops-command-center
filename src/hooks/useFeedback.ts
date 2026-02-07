import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export type FeedbackType = "bug" | "feature" | "other";

interface SubmitFeedbackParams {
  type: FeedbackType;
  description: string;
  email?: string;
}

export function useFeedback() {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitFeedback = async ({ type, description, email }: SubmitFeedbackParams): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to submit feedback.",
        variant: "destructive",
      });
      return false;
    }

    if (!description.trim()) {
      toast({
        title: "Error",
        description: "Please enter a description.",
        variant: "destructive",
      });
      return false;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("user_feedback").insert({
        user_id: user.id,
        feedback_type: type,
        description: description.trim(),
        page_url: window.location.pathname,
        user_email: email?.trim() || user.email || null,
      });

      if (error) throw error;

      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback! We'll review it shortly.",
      });

      return true;
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { submitFeedback, isSubmitting };
}
