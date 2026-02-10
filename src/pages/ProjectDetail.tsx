import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import ContactForm from "@/components/ContactForm";
import ShareButton from "@/components/ShareButton";
import SEOHead from "@/components/SEOHead";
import ProjectReviews from "@/components/ProjectReviews";
import ImageCarousel from "@/components/ImageCarousel";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Project } from "@/types/project";
import { format } from "date-fns";
import { ArrowLeft, ExternalLink, Github, Star, Calendar, Loader2 } from "lucide-react";

const statusColors = {
  completed: "bg-green-500/20 text-green-700 dark:text-green-400",
  in_progress: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
  planned: "bg-blue-500/20 text-blue-700 dark:text-blue-400",
};

const statusLabels = {
  completed: "COMPLETED",
  in_progress: "IN PROGRESS",
  planned: "PLANNED",
};

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchProject(id);
    }
  }, [id]);

  const fetchProject = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (error) throw error;
      setProject(data);
    } catch (error) {
      console.error("Error fetching project:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to strip HTML tags for meta description
  const stripHtml = (html: string) => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-3xl font-bold font-serif mb-4">Project Not Found</h1>
          <p className="text-muted-foreground mb-8">The project you're looking for doesn't exist.</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  // Get image descriptions from project (cast to include new field)
  const projectWithDescriptions = project as Project & { image_descriptions?: string[] };
  const imageDescriptions = projectWithDescriptions.image_descriptions || [];

  // Prepare SEO data
  const seoDescription = stripHtml(project.description).substring(0, 160);
  const projectSeoData = {
    name: project.name,
    description: seoDescription,
    image: project.images?.[0],
    datePublished: project.created_at,
    dateModified: project.updated_at,
    author: "Saurabh Kumar",
    category: project.category,
    techStack: project.tech_stack,
  };

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <SEOHead
        title={project.name}
        description={seoDescription}
        image={project.images?.[0]}
        url={`https://www.projects.gu-saurabh.site/project/${project.id}`}
        keywords={[project.category, ...project.tech_stack].join(", ")}
        type="article"
        projectData={projectSeoData}
      />
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </Link>
          <ShareButton projectName={project.name} projectId={project.id} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Carousel */}
            {project.images && project.images.length > 0 && (
              <ImageCarousel
                images={project.images}
                descriptions={imageDescriptions}
                projectName={project.name}
                autoScrollInterval={5000}
              />
            )}

            {/* Project Info */}
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <Badge className={`${statusColors[project.status]} border-0 font-semibold mb-4`}>
                    {statusLabels[project.status]}
                  </Badge>
                  <h1 className="text-3xl md:text-4xl font-bold font-serif">{project.name}</h1>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">{format(new Date(project.date), "MMMM yyyy")}</span>
                </div>
              </div>

              {/* Description - render as HTML */}
              <div 
                className="text-lg text-muted-foreground leading-relaxed prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: project.description }}
              />

              {/* Tech Stack */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Tech Stack</h3>
                <div className="flex flex-wrap gap-2">
                  {project.tech_stack.map((tech, index) => (
                    <Badge key={index} variant="secondary" className="text-sm rounded-full px-4 py-1.5">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Links */}
              <div className="flex items-center gap-4 pt-4">
                {project.live_link && (
                  <a
                    href={project.live_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Live
                  </a>
                )}
                {project.github_link && (
                  <a
                    href={project.github_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-border hover:bg-muted transition-all font-medium"
                  >
                    <Github className="h-4 w-4" />
                    GitHub
                  </a>
                )}
                {project.stars_rating !== null && project.stars_rating > 0 && (
                  <div className="flex items-center gap-2 text-muted-foreground ml-auto">
                    <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                    <span className="font-medium">{project.stars_rating} stars</span>
                  </div>
                )}
              </div>
            </div>

            {/* Project Reviews */}
            <ProjectReviews projectId={project.id} />
          </div>

          {/* Sidebar - Contact Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <ContactForm projectId={project.id} projectName={project.name} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProjectDetail;
