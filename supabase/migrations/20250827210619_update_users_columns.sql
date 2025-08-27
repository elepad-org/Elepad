------ make displayName not nullable ------
update "public"."users" set "displayName" = 'usuario' where "displayName" is null;

alter table "public"."users" alter column "displayName" set not null;

alter table public.users alter column "displayName" set default 'usuario';

------ drop passwordHash ------
alter table "public"."users" drop column "passwordHash";
