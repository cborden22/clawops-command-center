-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create locations table
CREATE TABLE public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  contact_person TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  commission_rate DECIMAL(5,2),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create location_machines table
CREATE TABLE public.location_machines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE NOT NULL,
  machine_type TEXT NOT NULL,
  count INTEGER DEFAULT 1
);

-- Create revenue_entries table
CREATE TABLE public.revenue_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(10,2) NOT NULL,
  category TEXT,
  notes TEXT,
  machine_type TEXT,
  date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create inventory_items table
CREATE TABLE public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  quantity INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 5,
  location TEXT,
  last_updated TIMESTAMPTZ DEFAULT now()
);

-- Create commission_summaries table
CREATE TABLE public.commission_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_revenue DECIMAL(10,2),
  commission_percentage DECIMAL(5,2),
  commission_amount DECIMAL(10,2),
  machine_count INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create location_agreements table
CREATE TABLE public.location_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE NOT NULL,
  agreement_date DATE,
  start_date DATE,
  end_date DATE,
  provider_name TEXT,
  provider_address TEXT,
  provider_contact TEXT,
  payment_type TEXT,
  revenue_share_percentage DECIMAL(5,2),
  flat_fee_amount DECIMAL(10,2),
  payment_method TEXT,
  notice_period TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_preferences table
CREATE TABLE public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  dashboard_layout JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for locations
CREATE POLICY "Users can view own locations" ON public.locations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own locations" ON public.locations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own locations" ON public.locations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own locations" ON public.locations
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for location_machines (through location ownership)
CREATE POLICY "Users can view own location machines" ON public.location_machines
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.locations WHERE locations.id = location_machines.location_id AND locations.user_id = auth.uid())
  );

CREATE POLICY "Users can create own location machines" ON public.location_machines
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.locations WHERE locations.id = location_machines.location_id AND locations.user_id = auth.uid())
  );

CREATE POLICY "Users can update own location machines" ON public.location_machines
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.locations WHERE locations.id = location_machines.location_id AND locations.user_id = auth.uid())
  );

CREATE POLICY "Users can delete own location machines" ON public.location_machines
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.locations WHERE locations.id = location_machines.location_id AND locations.user_id = auth.uid())
  );

-- RLS Policies for revenue_entries
CREATE POLICY "Users can view own revenue entries" ON public.revenue_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own revenue entries" ON public.revenue_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own revenue entries" ON public.revenue_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own revenue entries" ON public.revenue_entries
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for inventory_items
CREATE POLICY "Users can view own inventory" ON public.inventory_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own inventory" ON public.inventory_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own inventory" ON public.inventory_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own inventory" ON public.inventory_items
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for commission_summaries (through location ownership)
CREATE POLICY "Users can view own commission summaries" ON public.commission_summaries
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.locations WHERE locations.id = commission_summaries.location_id AND locations.user_id = auth.uid())
  );

CREATE POLICY "Users can create own commission summaries" ON public.commission_summaries
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.locations WHERE locations.id = commission_summaries.location_id AND locations.user_id = auth.uid())
  );

CREATE POLICY "Users can delete own commission summaries" ON public.commission_summaries
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.locations WHERE locations.id = commission_summaries.location_id AND locations.user_id = auth.uid())
  );

-- RLS Policies for location_agreements (through location ownership)
CREATE POLICY "Users can view own location agreements" ON public.location_agreements
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.locations WHERE locations.id = location_agreements.location_id AND locations.user_id = auth.uid())
  );

CREATE POLICY "Users can create own location agreements" ON public.location_agreements
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.locations WHERE locations.id = location_agreements.location_id AND locations.user_id = auth.uid())
  );

CREATE POLICY "Users can delete own location agreements" ON public.location_agreements
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.locations WHERE locations.id = location_agreements.location_id AND locations.user_id = auth.uid())
  );

-- RLS Policies for user_preferences
CREATE POLICY "Users can view own preferences" ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own preferences" ON public.user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON public.user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updating timestamps
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE ON public.locations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();