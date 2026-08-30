ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS terms_accepted_version text,
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamp with time zone;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, terms_accepted_version, terms_accepted_at)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'terms_accepted_version',
    CASE WHEN NEW.raw_user_meta_data ->> 'terms_accepted_version' IS NOT NULL THEN now() ELSE NULL END
  );
  RETURN NEW;
END;
$function$;