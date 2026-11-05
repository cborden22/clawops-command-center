ALTER TABLE public.revenue_entries ADD COLUMN IF NOT EXISTS nayax_kind text;
UPDATE public.revenue_entries SET nayax_kind = 'card' WHERE nayax_day IS NOT NULL AND nayax_kind IS NULL;
DROP INDEX IF EXISTS public.revenue_entries_nayax_day_uidx;
CREATE UNIQUE INDEX revenue_entries_nayax_day_kind_uidx ON public.revenue_entries (user_id, location_id, nayax_day, nayax_kind) WHERE nayax_day IS NOT NULL;

ALTER TABLE public.location_machines ADD COLUMN IF NOT EXISTS cash_collected_at timestamptz;

CREATE OR REPLACE FUNCTION public.refresh_nayax_revenue(_user uuid, _machine uuid, _day date)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _loc uuid; _kind text; _sum numeric; _cnt int;
BEGIN
  IF _machine IS NULL OR _day IS NULL THEN RETURN; END IF;
  SELECT location_id INTO _loc FROM location_machines WHERE id = _machine;
  IF _loc IS NULL THEN RETURN; END IF;
  FOREACH _kind IN ARRAY ARRAY['card','cash'] LOOP
    SELECT COALESCE(SUM(t.amount),0), COUNT(*) INTO _sum, _cnt
    FROM nayax_transactions t JOIN location_machines lm ON lm.id = t.machine_id
    WHERE t.user_id = _user AND lm.location_id = _loc
      AND (t.transaction_date AT TIME ZONE 'America/New_York')::date = _day
      AND (CASE WHEN COALESCE(t.payment_method,'') ILIKE '%cash%' THEN 'cash' ELSE 'card' END) = _kind;
    IF _cnt = 0 THEN
      DELETE FROM revenue_entries WHERE user_id=_user AND location_id=_loc AND nayax_day=_day AND nayax_kind=_kind;
    ELSE
      INSERT INTO revenue_entries(user_id, location_id, type, amount, category, notes, date, nayax_day, nayax_kind)
      VALUES (_user, _loc, 'income', _sum,
              CASE WHEN _kind='cash' THEN 'Cash Sales (Nayax)' ELSE 'Card Sales (Nayax)' END,
              'Nayax ' || _kind || ' sales: ' || _cnt || ' vends',
              ((_day::timestamp + interval '12 hours') AT TIME ZONE 'America/New_York'), _day, _kind)
      ON CONFLICT (user_id, location_id, nayax_day, nayax_kind) WHERE nayax_day IS NOT NULL
      DO UPDATE SET amount = EXCLUDED.amount, notes = EXCLUDED.notes, category = EXCLUDED.category;
    END IF;
  END LOOP;
END $$;

DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT DISTINCT user_id, machine_id, (transaction_date AT TIME ZONE 'America/New_York')::date d
           FROM nayax_transactions WHERE machine_id IS NOT NULL LOOP
    PERFORM public.refresh_nayax_revenue(r.user_id, r.machine_id, r.d);
  END LOOP;
END $$;