-- Create mileage_routes table
CREATE TABLE public.mileage_routes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  total_miles NUMERIC DEFAULT 0,
  is_round_trip BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create mileage_route_stops table
CREATE TABLE public.mileage_route_stops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  route_id UUID NOT NULL REFERENCES public.mileage_routes(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  custom_location_name TEXT,
  stop_order INTEGER NOT NULL DEFAULT 0,
  miles_from_previous NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add route_id to mileage_entries
ALTER TABLE public.mileage_entries 
ADD COLUMN route_id UUID REFERENCES public.mileage_routes(id) ON DELETE SET NULL;

-- Enable RLS on mileage_routes
ALTER TABLE public.mileage_routes ENABLE ROW LEVEL SECURITY;

-- RLS policies for mileage_routes
CREATE POLICY "Users can view their own routes"
ON public.mileage_routes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own routes"
ON public.mileage_routes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own routes"
ON public.mileage_routes FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own routes"
ON public.mileage_routes FOR DELETE
USING (auth.uid() = user_id);

-- Enable RLS on mileage_route_stops
ALTER TABLE public.mileage_route_stops ENABLE ROW LEVEL SECURITY;

-- RLS policies for mileage_route_stops (via route ownership)
CREATE POLICY "Users can view stops of their routes"
ON public.mileage_route_stops FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.mileage_routes 
  WHERE id = route_id AND user_id = auth.uid()
));

CREATE POLICY "Users can create stops for their routes"
ON public.mileage_route_stops FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.mileage_routes 
  WHERE id = route_id AND user_id = auth.uid()
));

CREATE POLICY "Users can update stops of their routes"
ON public.mileage_route_stops FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.mileage_routes 
  WHERE id = route_id AND user_id = auth.uid()
));

CREATE POLICY "Users can delete stops of their routes"
ON public.mileage_route_stops FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.mileage_routes 
  WHERE id = route_id AND user_id = auth.uid()
));

-- Create updated_at trigger for mileage_routes
CREATE TRIGGER update_mileage_routes_updated_at
BEFORE UPDATE ON public.mileage_routes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_mileage_route_stops_route_id ON public.mileage_route_stops(route_id);
CREATE INDEX idx_mileage_routes_user_id ON public.mileage_routes(user_id);
CREATE INDEX idx_mileage_entries_route_id ON public.mileage_entries(route_id);