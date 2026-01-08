CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN
INSERT INTO public.users (id, email, "displayName", "avatarUrl", elder)
VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      -- First try displayName from custom metadata (our app)
      NEW.raw_user_meta_data->>'displayName',
      -- Then provider-specific raw metadata keys (Google/gotrue commonly uses 'full_name' and 'avatar_url')
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NEW.email
    ),
    -- avatar candidates: try common keys returned by providers (google, etc.)
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture',
      NEW.raw_user_meta_data->>'avatarUrl',
      NEW.raw_user_meta_data->>'avatar'
    ),
    -- elder: check if user is an elder (default to false if not specified)
    COALESCE(
      (NEW.raw_user_meta_data->>'elder')::boolean,
      false
    )
  ) ON CONFLICT (id) DO NOTHING;
RETURN NEW;
END;
$$;