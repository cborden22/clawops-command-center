
CREATE TABLE public.recurring_revenue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'monthly',
  category TEXT DEFAULT 'Flat Fee',
  next_due_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.recurring_revenue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recurring revenue"
  ON public.recurring_revenue FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own recurring revenue"
  ON public.recurring_revenue FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recurring revenue"
  ON public.recurring_revenue FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recurring revenue"
  ON public.recurring_revenue FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_recurring_revenue_updated_at
  BEFORE UPDATE ON public.recurring_revenue
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
