-- Create user_feedback table for bug reporting
CREATE TABLE public.user_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  feedback_type text NOT NULL DEFAULT 'bug',
  description text NOT NULL,
  page_url text,
  user_email text,
  status text DEFAULT 'new',
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

-- Users can create their own feedback
CREATE POLICY "Users can create feedback" ON public.user_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own feedback
CREATE POLICY "Users can view own feedback" ON public.user_feedback
  FOR SELECT USING (auth.uid() = user_id);