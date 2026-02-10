-- Add source column to differentiate between project enquiries and contact form submissions
ALTER TABLE public.form_submissions 
ADD COLUMN source text NOT NULL DEFAULT 'enquiry' CHECK (source IN ('enquiry', 'contact'));

-- Update existing entries: those with project_id are enquiries, those without are contacts
UPDATE public.form_submissions 
SET source = CASE 
  WHEN project_id IS NOT NULL THEN 'enquiry'
  ELSE 'contact'
END;