import { Tables } from "@/integrations/supabase/types";

export type Project = Tables<"projects">;
export type FormSubmission = Tables<"form_submissions">;
export type ProjectStatus = "completed" | "in_progress" | "planned";

export interface SiteSettings {
  id: string;
  site_name: string;
  site_description: string;
  site_url: string | null;
  og_image: string | null;
  meta_keywords: string | null;
  footer_text: string | null;
  created_at: string;
  updated_at: string;
}

// Open Source Project Types
export type OpenSourceStatus = "active" | "completed" | "on_hold" | "archived";
export type ContributorStatus = "pending" | "approved" | "rejected";
export type ProfessionalType = "student" | "professional" | "freelancer" | "hobbyist" | "other";

export interface OpenSourceProject {
  id: string;
  title: string;
  slug: string;
  category: string;
  status: OpenSourceStatus;
  github_repo_link: string;
  doc_link: string | null;
  
  // Section-wise content
  overview: string | null;
  problem_statement: string | null;
  tech_stack: string[];
  features: string | null;
  installation_guide: string | null;
  contribution_guidelines: string | null;
  roadmap: string | null;
  custom_contribution_instructions: string | null;
  
  skills_required: string[];
  images: string[];
  
  contributor_count: number;
  created_at: string;
  updated_at: string;
}

export interface Contributor {
  id: string;
  project_id: string;
  name: string;
  email: string;
  professional_type: ProfessionalType;
  github_profile: string;
  linkedin_profile: string | null;
  portfolio_url: string | null;
  
  improvement_description: string;
  importance_reason: string;
  implementation_plan: string;
  has_opensource_experience: boolean;
  previous_contributions: string | null;
  
  status: ContributorStatus;
  admin_notes: string | null;
  
  created_at: string;
  updated_at: string;
}

export interface PRRequest {
  id: string;
  project_id: string;
  contributor_id: string | null;
  
  name: string;
  email: string;
  professional_type: ProfessionalType;
  github_profile: string;
  linkedin_profile: string | null;
  portfolio_url: string | null;
  
  improvement_description: string;
  importance_reason: string;
  implementation_plan: string;
  has_opensource_experience: boolean;
  previous_contributions: string | null;
  
  declaration_accepted: boolean;
  status: ContributorStatus;
  
  created_at: string;
}

