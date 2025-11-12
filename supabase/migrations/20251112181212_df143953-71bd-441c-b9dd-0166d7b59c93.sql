-- Update the handle_new_user function to use a whitelist array
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_whitelist TEXT[] := ARRAY['broboxadmin@gmail.com'];
  user_role app_role;
BEGIN
  -- Check if email is in admin whitelist
  IF NEW.email = ANY(admin_whitelist) THEN
    user_role := 'admin'::app_role;
  ELSE
    user_role := 'student'::app_role;
  END IF;

  -- Insert profile
  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    user_role
  );
  
  -- Insert role into user_roles table
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);
  
  RETURN NEW;
END;
$$;