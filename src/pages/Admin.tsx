import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import AdminSidebar from "@/components/admin/AdminSidebar";
import DashboardOverview from "@/components/admin/DashboardOverview";
import ProjectsManager from "@/components/admin/ProjectsManager";
import OpenSourceProjectsManager from "@/components/admin/OpenSourceProjectsManager";
import ContributorsManager from "@/components/admin/ContributorsManager";
import ContactsManager from "@/components/admin/ContactsManager";
import AdminsManager from "@/components/admin/AdminsManager";
import SiteSettingsManager from "@/components/admin/SiteSettingsManager";
import ReviewsManager from "@/components/admin/ReviewsManager";
import EnquiriesManager from "@/components/admin/EnquiriesManager";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Project, FormSubmission } from "@/types/project";
import { Loader2 } from "lucide-react";

interface Review {
  id: string;
  name: string;
  rating: number;
  review: string | null;
  project_id: string;
  created_at: string;
  project_name?: string;
}

const Admin = () => {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [projects, setProjects] = useState<Project[]>([]);
  const [submissions, setSubmissions] = useState<(FormSubmission & { projects?: { name: string } | null })[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Determine which section to show based on route
  const getActiveSection = () => {
    const path = location.pathname;
    if (path === "/admin/projects") return "projects";
    if (path === "/admin/opensource") return "opensource";
    if (path === "/admin/contributors") return "contributors";
    if (path === "/admin/reviews") return "reviews";
    if (path === "/admin/enquiries") return "enquiries";
    if (path === "/admin/contacts") return "contacts";
    if (path === "/admin/admins") return "admins";
    if (path === "/admin/settings") return "settings";
    return "overview";
  };

  useEffect(() => {
    // Only redirect if auth is fully loaded AND user is not admin
    // Give a brief grace period for admin role check to complete
    if (!authLoading && !user) {
      navigate("/");
    } else if (!authLoading && user && !isAdmin) {
      // Wait a moment for role check before redirecting
      const timeout = setTimeout(() => {
        if (!isAdmin) {
          navigate("/");
        }
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchData();
    }
  }, [user, isAdmin]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [projectsRes, submissionsRes, reviewsRes] = await Promise.all([
        supabase.from("projects").select("*").order("created_at", { ascending: false }),
        supabase.from("form_submissions").select("*, projects(name)").order("created_at", { ascending: false }),
        supabase.from("reviews").select("*, projects(name)").order("created_at", { ascending: false }),
      ]);

      if (projectsRes.error) throw projectsRes.error;
      if (submissionsRes.error) throw submissionsRes.error;
      if (reviewsRes.error) throw reviewsRes.error;

      setProjects(projectsRes.data || []);
      setSubmissions(submissionsRes.data || []);

      // Map reviews with project names
      const reviewsWithNames = (reviewsRes.data || []).map((r: any) => ({
        ...r,
        project_name: r.projects?.name,
      }));
      setReviews(reviewsWithNames);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const activeSection = getActiveSection();

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    switch (activeSection) {
      case "projects":
        return <ProjectsManager projects={projects} onRefresh={fetchData} />;
      case "opensource":
        return <OpenSourceProjectsManager />;
      case "contributors":
        return <ContributorsManager />;
      case "reviews":
        return <ReviewsManager />;
      case "enquiries":
        return <EnquiriesManager />;
      case "contacts":
        return <ContactsManager />;
      case "admins":
        return <AdminsManager />;
      case "settings":
        return <SiteSettingsManager />;
      default:
        return (
          <DashboardOverview
            projects={projects}
            submissions={submissions}
            reviews={reviews}
          />
        );
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          <div className="max-w-6xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Admin;
