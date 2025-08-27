set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.users (id, email, "passwordHash", "displayName")
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'passwordHash', NEW.raw_user_meta_data->>'displayName')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$
;


