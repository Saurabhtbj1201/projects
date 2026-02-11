-- Create enum for open source project status
CREATE TYPE public.opensource_status AS ENUM ('active', 'completed', 'on_hold', 'archived');

-- Create enum for contributor status
CREATE TYPE public.contributor_status AS ENUM ('pending', 'approved', 'rejected');

-- Create enum for professional status
CREATE TYPE public.professional_type AS ENUM ('student', 'professional', 'freelancer', 'hobbyist', 'other');

-- Create open_source_projects table
CREATE TABLE public.open_source_projects (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    status opensource_status NOT NULL DEFAULT 'active',
    github_repo_link TEXT NOT NULL,
    doc_link TEXT,
    
    -- Section-wise Rich Editor Content (stored as JSONB)
    overview TEXT,
    problem_statement TEXT,
    tech_stack TEXT[] NOT NULL DEFAULT '{}',
    features TEXT,
    installation_guide TEXT,
    contribution_guidelines TEXT,
    roadmap TEXT,
    custom_contribution_instructions TEXT,
    
    skills_required TEXT[] NOT NULL DEFAULT '{}',
    images TEXT[] NOT NULL DEFAULT '{}',
    
    -- Metadata
    contributor_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contributors table
CREATE TABLE public.contributors (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.open_source_projects(id) ON DELETE CASCADE NOT NULL,
    
    -- Personal Information
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    professional_type professional_type NOT NULL,
    github_profile TEXT NOT NULL,
    linkedin_profile TEXT,
    portfolio_url TEXT,
    
    -- Contribution Details
    improvement_description TEXT NOT NULL,
    importance_reason TEXT NOT NULL,
    implementation_plan TEXT NOT NULL,
    has_opensource_experience BOOLEAN NOT NULL DEFAULT false,
    previous_contributions TEXT,
    
    -- Status
    status contributor_status NOT NULL DEFAULT 'pending',
    admin_notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create PR requests table
CREATE TABLE public.pr_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.open_source_projects(id) ON DELETE CASCADE NOT NULL,
    contributor_id UUID REFERENCES public.contributors(id) ON DELETE CASCADE,
    
    -- PR Information
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    professional_type professional_type NOT NULL,
    github_profile TEXT NOT NULL,
    linkedin_profile TEXT,
    portfolio_url TEXT,
    
    -- PR Details
    improvement_description TEXT NOT NULL,
    importance_reason TEXT NOT NULL,
    implementation_plan TEXT NOT NULL,
    has_opensource_experience BOOLEAN NOT NULL DEFAULT false,
    previous_contributions TEXT,
    
    -- Declaration
    declaration_accepted BOOLEAN NOT NULL DEFAULT false,
    
    -- Status
    status contributor_status NOT NULL DEFAULT 'pending',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.open_source_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pr_requests ENABLE ROW LEVEL SECURITY;

-- Open Source Projects Policies
CREATE POLICY "Anyone can view open source projects" 
ON public.open_source_projects 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can insert open source projects" 
ON public.open_source_projects 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update open source projects" 
ON public.open_source_projects 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete open source projects" 
ON public.open_source_projects 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));

-- Contributors Policies
CREATE POLICY "Anyone can view approved contributors" 
ON public.contributors 
FOR SELECT 
USING (status = 'approved' OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage contributors" 
ON public.contributors 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- PR Requests Policies
CREATE POLICY "Anyone can submit PR requests" 
ON public.pr_requests 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view PR requests" 
ON public.pr_requests 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update PR requests" 
ON public.pr_requests 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete PR requests" 
ON public.pr_requests 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_open_source_projects_updated_at
BEFORE UPDATE ON public.open_source_projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contributors_updated_at
BEFORE UPDATE ON public.contributors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update contributor count
CREATE OR REPLACE FUNCTION public.update_contributor_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'approved' THEN
        UPDATE public.open_source_projects
        SET contributor_count = contributor_count + 1
        WHERE id = NEW.project_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.status != 'approved' AND NEW.status = 'approved' THEN
        UPDATE public.open_source_projects
        SET contributor_count = contributor_count + 1
        WHERE id = NEW.project_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.status = 'approved' AND NEW.status != 'approved' THEN
        UPDATE public.open_source_projects
        SET contributor_count = contributor_count - 1
        WHERE id = NEW.project_id;
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'approved' THEN
        UPDATE public.open_source_projects
        SET contributor_count = contributor_count - 1
        WHERE id = OLD.project_id;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for contributor count updates
CREATE TRIGGER update_contributor_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.contributors
FOR EACH ROW
EXECUTE FUNCTION public.update_contributor_count();

-- Create indexes for better performance
CREATE INDEX idx_open_source_projects_slug ON public.open_source_projects(slug);
CREATE INDEX idx_open_source_projects_status ON public.open_source_projects(status);
CREATE INDEX idx_contributors_project_id ON public.contributors(project_id);
CREATE INDEX idx_contributors_status ON public.contributors(status);
CREATE INDEX idx_pr_requests_project_id ON public.pr_requests(project_id);
CREATE INDEX idx_pr_requests_status ON public.pr_requests(status);
