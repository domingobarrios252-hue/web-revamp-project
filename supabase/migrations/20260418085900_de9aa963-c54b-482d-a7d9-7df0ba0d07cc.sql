-- Reset y recreación limpia de la cuenta admin rollerzonespain@gmail.com
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Borrar identidades, roles y usuario previo si existen
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'rollerzonespain@gmail.com';

  IF v_user_id IS NOT NULL THEN
    DELETE FROM auth.identities WHERE user_id = v_user_id;
    DELETE FROM public.user_roles WHERE user_id = v_user_id;
    DELETE FROM public.profiles WHERE user_id = v_user_id;
    DELETE FROM auth.users WHERE id = v_user_id;
  END IF;

  -- Crear usuario nuevo
  v_user_id := gen_random_uuid();

  INSERT INTO auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token,
    is_super_admin, is_sso_user, is_anonymous
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    'rollerzonespain@gmail.com',
    crypt('SDasturias2026', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"RollerZone Spain"}'::jsonb,
    now(), now(),
    '', '', '', '',
    false, false, false
  );

  INSERT INTO auth.identities (
    id, user_id, provider_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(),
    v_user_id,
    v_user_id::text,
    jsonb_build_object(
      'sub', v_user_id::text,
      'email', 'rollerzonespain@gmail.com',
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    now(), now(), now()
  );

  -- El trigger handle_new_user normalmente crearía el profile,
  -- pero por si acaso lo aseguramos
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (v_user_id, 'RollerZone Spain')
  ON CONFLICT (user_id) DO NOTHING;

  -- Asignar rol admin
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;