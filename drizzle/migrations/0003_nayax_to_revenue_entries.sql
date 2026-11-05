ALTER TABLE public.revenue_entries ADD COLUMN IF NOT EXISTS nayax_day date;
CREATE UNIQUE INDEX IF NOT EXISTS revenue_entries_nayax_day_uidx ON public.revenue_entries(user_id, location_id, nayax_day) WHERE nayax_day IS NOT NULL;

CREATE OR REPLACE FUNCTION public.refresh_nayax_revenue(_user uuid, _machine uuid, _day date)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _loc uuid; _sum numeric; _cnt int;
BEGIN
  IF _machine IS NULL OR _day IS NULL THEN RETURN; END IF;
  SELECT location_id INTO _loc FROM location_machines WHERE id = _machine;
  IF _loc IS NULL THEN RETURN; END IF;
  SELECT COALESCE(SUM(t.amount),0), COUNT(*) INTO _sum, _cnt
  FROM nayax_transactions t JOIN location_machines lm ON lm.id = t.machine_id
  WHERE t.user_id = _user AND lm.location_id = _loc
    AND (t.transaction_date AT TIME ZONE 'America/New_York')::date = _day;
  IF _cnt = 0 THEN
    DELETE FROM revenue_entries WHERE user_id=_user AND location_id=_loc AND nayax_day=_day;
  ELSE
    INSERT INTO revenue_entries(user_id, location_id, type, amount, category, notes, date, nayax_day)
    VALUES (_user, _loc, 'income', _sum, 'Card Sales (Nayax)', 'Nayax card sales: ' || _cnt || ' vends',
            ((_day::timestamp + interval '12 hours') AT TIME ZONE 'America/New_York'), _day)
    ON CONFLICT (user_id, location_id, nayax_day) WHERE nayax_day IS NOT NULL
    DO UPDATE SET amount = EXCLUDED.amount, notes = EXCLUDED.notes;
  END IF;
END $$;
REVOKE EXECUTE ON FUNCTION public.refresh_nayax_revenue(uuid,uuid,date) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.nayax_tx_revenue_trigger()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP IN ('UPDATE','DELETE') THEN
    PERFORM refresh_nayax_revenue(OLD.user_id, OLD.machine_id, (OLD.transaction_date AT TIME ZONE 'America/New_York')::date);
  END IF;
  IF TG_OP IN ('INSERT','UPDATE') THEN
    PERFORM refresh_nayax_revenue(NEW.user_id, NEW.machine_id, (NEW.transaction_date AT TIME ZONE 'America/New_York')::date);
  END IF;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS nayax_tx_revenue ON public.nayax_transactions;
CREATE TRIGGER nayax_tx_revenue AFTER INSERT OR UPDATE OR DELETE ON public.nayax_transactions
FOR EACH ROW EXECUTE FUNCTION public.nayax_tx_revenue_trigger();

-- backfill existing linked sales
SELECT public.refresh_nayax_revenue(x.user_id, x.machine_id, x.d)
FROM (SELECT DISTINCT user_id, machine_id, (transaction_date AT TIME ZONE 'America/New_York')::date d
      FROM public.nayax_transactions WHERE machine_id IS NOT NULL) x;