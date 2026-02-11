INSERT INTO public.user_roles (user_id, role, name, email)
SELECT id, 'admin', raw_user_meta_data->>'Saurabh', email
FROM auth.users
WHERE email = 'saurabhtbj143@gmail.com'
ON CONFLICT DO NOTHING;
