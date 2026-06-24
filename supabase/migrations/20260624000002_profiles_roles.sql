-- Add role flags to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_gm boolean NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- Update the existing auto-create profile trigger to auto-promote the admin email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  v_is_admin := NEW.email = 'macarthur1123@gmail.com';
  INSERT INTO public.profiles (id, display_name, is_gm, is_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    v_is_admin,
    v_is_admin
  )
  ON CONFLICT (id) DO UPDATE
    SET is_gm    = EXCLUDED.is_gm OR profiles.is_gm,
        is_admin = EXCLUDED.is_admin OR profiles.is_admin;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
