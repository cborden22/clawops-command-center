-- Add Nayax fields to location_machines table
ALTER TABLE public.location_machines
ADD COLUMN IF NOT EXISTS nayax_machine_id TEXT,
ADD COLUMN IF NOT EXISTS is_card_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_nayax_sync TIMESTAMPTZ;

-- Create nayax_settings table for per-user API configuration
CREATE TABLE IF NOT EXISTS public.nayax_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  is_connected BOOLEAN DEFAULT false,
  last_sync TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on nayax_settings
ALTER TABLE public.nayax_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for nayax_settings
CREATE POLICY "Users can view own nayax settings"
ON public.nayax_settings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own nayax settings"
ON public.nayax_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own nayax settings"
ON public.nayax_settings FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own nayax settings"
ON public.nayax_settings FOR DELETE
USING (auth.uid() = user_id);

-- Create nayax_transactions table for synced transactions
CREATE TABLE IF NOT EXISTS public.nayax_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  machine_id UUID REFERENCES public.location_machines(id) ON DELETE SET NULL,
  nayax_transaction_id TEXT NOT NULL,
  transaction_date TIMESTAMPTZ NOT NULL,
  amount NUMERIC NOT NULL,
  payment_method TEXT,
  nayax_machine_id TEXT,
  raw_data JSONB,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revenue_entry_id UUID REFERENCES public.revenue_entries(id) ON DELETE SET NULL,
  UNIQUE(user_id, nayax_transaction_id)
);

-- Enable RLS on nayax_transactions
ALTER TABLE public.nayax_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for nayax_transactions
CREATE POLICY "Users can view own nayax transactions"
ON public.nayax_transactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own nayax transactions"
ON public.nayax_transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own nayax transactions"
ON public.nayax_transactions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own nayax transactions"
ON public.nayax_transactions FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at on nayax_settings
CREATE TRIGGER update_nayax_settings_updated_at
BEFORE UPDATE ON public.nayax_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();