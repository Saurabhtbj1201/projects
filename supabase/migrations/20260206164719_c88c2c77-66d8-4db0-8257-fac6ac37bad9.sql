-- Add name and created_at columns to user_roles table
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS name text,
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();