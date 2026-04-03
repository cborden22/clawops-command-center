
CREATE TABLE public.inventory_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.inventory_locations(id) ON DELETE CASCADE,
  quantity_on_hand INTEGER NOT NULL DEFAULT 0,
  reorder_point INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (inventory_item_id, location_id)
);

ALTER TABLE public.inventory_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users and team members can view inventory balances"
  ON public.inventory_balances FOR SELECT
  USING (auth.uid() = user_id OR has_team_permission(auth.uid(), user_id, 'inventory'));

CREATE POLICY "Users and team members can create inventory balances"
  ON public.inventory_balances FOR INSERT
  WITH CHECK (user_id = get_effective_owner_id(auth.uid()));

CREATE POLICY "Users and team members can update inventory balances"
  ON public.inventory_balances FOR UPDATE
  USING (auth.uid() = user_id OR has_team_permission(auth.uid(), user_id, 'inventory'));

CREATE POLICY "Users and team members can delete inventory balances"
  ON public.inventory_balances FOR DELETE
  USING (auth.uid() = user_id OR has_team_permission(auth.uid(), user_id, 'inventory'));

CREATE TRIGGER update_inventory_balances_updated_at
  BEFORE UPDATE ON public.inventory_balances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
