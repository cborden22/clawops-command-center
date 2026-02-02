-- Create leads table for CRM
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  business_name TEXT NOT NULL,
  address TEXT,
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  priority TEXT DEFAULT 'warm',
  estimated_machines INTEGER,
  estimated_revenue NUMERIC,
  source TEXT,
  next_follow_up TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  converted_location_id UUID REFERENCES public.locations(id)
);

-- Create lead_activities table for activity timeline
CREATE TABLE public.lead_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL DEFAULT 'note',
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

-- RLS policies for leads table
CREATE POLICY "Users can view own leads"
ON public.leads
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own leads"
ON public.leads
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own leads"
ON public.leads
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own leads"
ON public.leads
FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for lead_activities table
CREATE POLICY "Users can view activities for own leads"
ON public.lead_activities
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.leads
  WHERE leads.id = lead_activities.lead_id
  AND leads.user_id = auth.uid()
));

CREATE POLICY "Users can create activities for own leads"
ON public.lead_activities
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.leads
  WHERE leads.id = lead_activities.lead_id
  AND leads.user_id = auth.uid()
));

CREATE POLICY "Users can update activities for own leads"
ON public.lead_activities
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.leads
  WHERE leads.id = lead_activities.lead_id
  AND leads.user_id = auth.uid()
));

CREATE POLICY "Users can delete activities for own leads"
ON public.lead_activities
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.leads
  WHERE leads.id = lead_activities.lead_id
  AND leads.user_id = auth.uid()
));

-- Create trigger for updated_at on leads
CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_leads_user_id ON public.leads(user_id);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_next_follow_up ON public.leads(next_follow_up);
CREATE INDEX idx_lead_activities_lead_id ON public.lead_activities(lead_id);