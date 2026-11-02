ALTER TABLE public.nayax_transactions ADD COLUMN IF NOT EXISTS machine_name text, ADD COLUMN IF NOT EXISTS card_brand text;
CREATE UNIQUE INDEX IF NOT EXISTS nayax_transactions_txid_key ON public.nayax_transactions(nayax_transaction_id);
GRANT ALL ON public.nayax_transactions TO service_role;

CREATE TABLE public.nayax_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  trigger text NOT NULL DEFAULT 'manual',
  status text NOT NULL DEFAULT 'running',
  rows_upserted integer NOT NULL DEFAULT 0,
  machines_checked integer NOT NULL DEFAULT 0,
  error text,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);
GRANT SELECT ON public.nayax_sync_runs TO authenticated;
GRANT ALL ON public.nayax_sync_runs TO service_role;
ALTER TABLE public.nayax_sync_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read own sync runs" ON public.nayax_sync_runs FOR SELECT TO authenticated
USING (user_id = public.get_effective_owner_id(auth.uid()));

CREATE VIEW public.nayax_daily_rollup WITH (security_invoker = true) AS
SELECT user_id, machine_id, nayax_machine_id, max(machine_name) AS machine_name,
  (transaction_date AT TIME ZONE 'America/New_York')::date AS sale_day,
  sum(amount) AS revenue, count(*) AS vend_count
FROM public.nayax_transactions
GROUP BY user_id, machine_id, nayax_machine_id, (transaction_date AT TIME ZONE 'America/New_York')::date;
GRANT SELECT ON public.nayax_daily_rollup TO authenticated, service_role;