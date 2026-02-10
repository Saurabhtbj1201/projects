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
