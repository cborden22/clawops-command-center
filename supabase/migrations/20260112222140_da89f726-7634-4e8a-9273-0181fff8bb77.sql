-- Create stock_run_history table
CREATE TABLE public.stock_run_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  run_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  total_items INTEGER NOT NULL DEFAULT 0,
  total_products INTEGER NOT NULL DEFAULT 0,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  returned_items JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.stock_run_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own stock run history"
ON public.stock_run_history
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own stock run history"
ON public.stock_run_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stock run history"
ON public.stock_run_history
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stock run history"
ON public.stock_run_history
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_stock_run_history_user_id ON public.stock_run_history(user_id);
CREATE INDEX idx_stock_run_history_run_date ON public.stock_run_history(run_date DESC);