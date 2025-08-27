CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN
INSERT INTO public.users (id, email, "displayName", "avatarUrl")
VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      -- provider-specific raw metadata keys (Google/gotrue commonly uses 'full_name' and 'avatar_url')
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      -- also try user_metadata if present
      NEW.user_metadata->>'full_name',
      NEW.user_metadata->>'name',
      -- as last resort use email
      NEW.email
    ),
    -- avatar candidates: try common keys returned by providers (google, etc.)
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture',
      NEW.raw_user_meta_data->>'avatarUrl',
      NEW.raw_user_meta_data->>'avatar',
      NEW.user_metadata->>'avatar_url',
      NEW.user_metadata->>'picture',
      NEW.user_metadata->>'avatarUrl',
      NEW.user_metadata->>'avatar'
    )
  ) ON CONFLICT (id) DO NOTHING;
RETURN NEW;
END;
$$;