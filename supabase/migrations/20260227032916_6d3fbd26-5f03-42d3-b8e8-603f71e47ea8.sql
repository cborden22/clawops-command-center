
-- Create storage bucket for machine/location photos
INSERT INTO storage.buckets (id, name, public) VALUES ('location-photos', 'location-photos', true);

-- Storage policies for location photos
CREATE POLICY "Authenticated users can upload photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'location-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can view location photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'location-photos');

CREATE POLICY "Users can delete their own photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'location-photos' AND auth.uid() IS NOT NULL);

-- Create expense_budgets table for budget tracking
CREATE TABLE public.expense_budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  monthly_budget NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.expense_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own budgets"
ON public.expense_budgets FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own budgets"
ON public.expense_budgets FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budgets"
ON public.expense_budgets FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own budgets"
ON public.expense_budgets FOR DELETE
USING (auth.uid() = user_id);

-- Add unique constraint on user_id + category
CREATE UNIQUE INDEX idx_expense_budgets_user_category ON public.expense_budgets(user_id, category);

-- Trigger for updated_at
CREATE TRIGGER update_expense_budgets_updated_at
BEFORE UPDATE ON public.expense_budgets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
