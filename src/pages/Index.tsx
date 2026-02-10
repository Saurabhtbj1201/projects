import { useState, useEffect } from "react";
import Header from "@/components/Header";
import ProjectCard from "@/components/ProjectCard";
import SEOHead from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { Project, SiteSettings } from "@/types/project";
import { Loader2 } from "lucide-react";

const Index = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [projectsRes, settingsRes] = await Promise.all([
        supabase.from("projects").select("*").order("date", { ascending: false }),
        supabase.from("site_settings").select("*").limit(1).maybeSingle(),
      ]);

      if (projectsRes.error) throw projectsRes.error;
      
      setProjects(projectsRes.data || []);
      setSiteSettings(settingsRes.data);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(projectsRes.data?.map((p) => p.category) || [])];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProjects = selectedCategory === "all"
    ? projects
    : projects.filter((p) => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <SEOHead settings={siteSettings} />
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <section className="py-12 md:py-20 text-center">
          <h1 className="text-4xl md:text-6xl font-bold font-serif tracking-tight mb-6 animate-slide-up">
            {siteSettings?.site_name || "My Projects"}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-slide-up stagger-1">
            {siteSettings?.site_description || "A collection of my work showcasing web development, design, and problem-solving skills across various technologies."}
          </p>
        </section>

        {/* Category Filters */}
        {categories.length > 0 && (
          <section className="mb-12 animate-slide-up stagger-2">
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === "all"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80 text-foreground"
                }`}
              >
                All Projects
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === category
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80 text-foreground"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Projects Grid */}
        <section className="pb-20">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProjects.map((project, index) => (
                <div key={project.id} className={`animate-slide-up stagger-${Math.min(index + 1, 6)}`}>
                  <ProjectCard project={project} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">
                {projects.length === 0
                  ? "No projects yet. Check back soon!"
                  : "No projects found in this category."}
              </p>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              {siteSettings?.footer_text || `© ${new Date().getFullYear()} Saurabh. All rights reserved.`}
            </p>
            <div className="flex items-center gap-6">
              <a
                href="https://github.com/saurabhtbj1201"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                GitHub
              </a>
              <a
                href="https://www.gu-saurabh.site/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Portfolio
              </a>
              <a
                href="/about"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                About
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
