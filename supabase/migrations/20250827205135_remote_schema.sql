drop extension if exists "pg_net";

alter table "public"."familyGroups" add column "code" text;

alter table "public"."users" alter column "email" set not null;

alter table "public"."users" alter column "id" drop default;

alter table "public"."users" add constraint "users_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) not valid;

alter table "public"."users" validate constraint "users_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.users (id, email, "displayName")
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'displayName')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$
;


  create policy "Can update own user data."
  on "public"."users"
  as permissive
  for update
  to public
using ((auth.uid() = id))
with check ((auth.uid() = id));



  create policy "Can view own user data."
  on "public"."users"
  as permissive
  for select
  to public
using ((auth.uid() = id));



