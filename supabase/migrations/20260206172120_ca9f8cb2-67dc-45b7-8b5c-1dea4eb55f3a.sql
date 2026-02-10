-- Add reviewed field to form_submissions for marking enquiries as reviewed
ALTER TABLE public.form_submissions ADD COLUMN IF NOT EXISTS reviewed boolean NOT NULL DEFAULT false;
ALTER TABLE public.form_submissions ADD COLUMN IF NOT EXISTS reviewed_at timestamp with time zone;

-- Add UPDATE policy for admins to mark submissions as reviewed
CREATE POLICY "Admins can update form submissions"
ON public.form_submissions
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add UPDATE policy for admins to update reviews
CREATE POLICY "Admins can update reviews"
ON public.reviews
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add DELETE policy for user_roles so admins can delete other admins
CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add image_descriptions column to projects for image captions
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS image_descriptions text[] NOT NULL DEFAULT '{}'::text[];