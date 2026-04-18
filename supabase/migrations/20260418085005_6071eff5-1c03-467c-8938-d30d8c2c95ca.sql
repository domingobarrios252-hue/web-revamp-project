DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Si ya existe, reutilizamos el id
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'rollerzonespain@gmail.com';

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
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
      now(),
      now(),
      '',
      '',
      '',
      ''
    );

    INSERT INTO auth.identities (
      id,
      user_id,
      provider_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_user_id,
      v_user_id::text,
      jsonb_build_object('sub', v_user_id::text, 'email', 'rollerzonespain@gmail.com', 'email_verified', true),
      'email',
      now(),
      now(),
      now()
    );
  END IF;

  -- Asegurar perfil
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (v_user_id, 'RollerZone Spain')
  ON CONFLICT (user_id) DO NOTHING;

  -- Asignar rol admin
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;