ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS target_install_date date;

CREATE TABLE public.reminder_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  lead_followup_enabled boolean NOT NULL DEFAULT true,
  install_enabled boolean NOT NULL DEFAULT true,
  lead_followup_days_before integer NOT NULL DEFAULT 3,
  install_days_before integer NOT NULL DEFAULT 3,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reminder_preferences TO authenticated;
GRANT ALL ON public.reminder_preferences TO service_role;

ALTER TABLE public.reminder_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own reminder preferences"
  ON public.reminder_preferences FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_reminder_preferences_updated_at
  BEFORE UPDATE ON public.reminder_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.reminder_dismissals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source_type text NOT NULL,
  source_id uuid NOT NULL,
  snoozed_until date,
  dismissed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, source_type, source_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reminder_dismissals TO authenticated;
GRANT ALL ON public.reminder_dismissals TO service_role;

ALTER TABLE public.reminder_dismissals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own reminder dismissals"
  ON public.reminder_dismissals FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_reminder_dismissals_updated_at
  BEFORE UPDATE ON public.reminder_dismissals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
