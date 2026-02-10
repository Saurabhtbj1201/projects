-- Create site_settings table for managing published site details
CREATE TABLE public.site_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    site_name text NOT NULL DEFAULT 'My Projects',
    site_description text NOT NULL DEFAULT 'A collection of my work showcasing web development, design, and problem-solving skills.',
    site_url text,
    og_image text,
    meta_keywords text,
    footer_text text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view site settings" 
ON public.site_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can update site settings" 
ON public.site_settings 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert site settings" 
ON public.site_settings 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default settings
INSERT INTO public.site_settings (site_name, site_description, site_url, meta_keywords)
VALUES (
    'Saurabh Projects',
    'A collection of my work showcasing web development, data analysis, and problem-solving skills across various technologies.',
    'https://www.projects.gu-saurabh.site/',
    'portfolio, projects, web development, full-stack, data analyst, React, TypeScript'
);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();