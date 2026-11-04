ALTER TABLE public.nayax_settings ADD COLUMN IF NOT EXISTS ingest_token text;
CREATE UNIQUE INDEX IF NOT EXISTS nayax_settings_ingest_token_key ON public.nayax_settings(ingest_token);
CREATE UNIQUE INDEX IF NOT EXISTS nayax_settings_user_id_key ON public.nayax_settings(user_id);
COMMENT ON TABLE public.nayax_cron_config IS 'DEPRECATED: Nayax API sync removed; replaced by CSV/email ingestion';