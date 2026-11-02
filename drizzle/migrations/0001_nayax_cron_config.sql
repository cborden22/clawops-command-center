CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE TABLE public.nayax_cron_config (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  secret text NOT NULL DEFAULT encode(extensions.gen_random_bytes(32), 'hex')
);
GRANT ALL ON public.nayax_cron_config TO service_role;
ALTER TABLE public.nayax_cron_config ENABLE ROW LEVEL SECURITY;
INSERT INTO public.nayax_cron_config (id) VALUES (1) ON CONFLICT DO NOTHING;