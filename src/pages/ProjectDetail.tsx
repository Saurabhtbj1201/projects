import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import ContactForm from "@/components/ContactForm";
import ShareButton from "@/components/ShareButton";
import SEOHead from "@/components/SEOHead";
import ProjectReviews from "@/components/ProjectReviews";
import ImageCarousel from "@/components/ImageCarousel";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { Project } from "@/types/project";
import { format } from "date-fns";
import { ArrowLeft, ExternalLink, Github, Star, Calendar, Loader2, User, Users, List } from "lucide-react";
import { CoolMode } from "@/components/ui/cool-mode";

const statusColors = {
  completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700",
  in_progress: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300 dark:border-amber-700",
  planned: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300 border border-sky-300 dark:border-sky-700",
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

  const stripHtml = (html: string) => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  };

  // Extract headings from HTML for Table of Contents
  const tocItems = useMemo(() => {
    if (!project) return [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(project.description, "text/html");
    const headings = doc.querySelectorAll("h1, h2, h3");
    return Array.from(headings).map((h, i) => ({
      id: `toc-heading-${i}`,
      text: h.textContent || "",
      level: parseInt(h.tagName[1]),
    }));
  }, [project]);

  // Inject IDs into description HTML for scroll targets
  const descriptionWithIds = useMemo(() => {
    if (!project) return "";
    let html = project.description;
    let headingIndex = 0;
    html = html.replace(/<(h[123])([^>]*)>/gi, (_match, tag, attrs) => {
      const id = `toc-heading-${headingIndex}`;
      headingIndex++;
      return `<${tag}${attrs} id="${id}">`;
    });
    return html;
  }, [project]);

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Parse contributors and get GitHub avatars
  interface Contributor {
    name: string;
    github_link?: string;
  }

  const contributors: Contributor[] = project
    ? (project.contributors
      ? (typeof (project as any).contributors === 'string'
        ? JSON.parse((project as any).contributors)
        : (project as any).contributors)
      : [{ name: "Saurabh Kumar", github_link: "https://github.com/saurabhtbj1201" }])
    : [];

  const getGitHubAvatar = (githubLink?: string) => {
    if (!githubLink) return null;
    try {
      const username = githubLink.replace('https://github.com/', '').replace('/', '');
      return `https://github.com/${username}.png`;
    } catch {
      return null;
    }
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
            className="inline-flex items-center gap-2 text-accent hover:text-accent/80 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  const projectWithDescriptions = project as Project & { image_descriptions?: string[] };
  const imageDescriptions = projectWithDescriptions.image_descriptions || [];
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
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </Link>
        </div>

        {/* Hero Section: Info Left + Carousel Right */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Left: Project Info */}
          <div className="flex flex-col justify-center space-y-5">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge className={`${statusColors[project.status]} text-xs font-semibold rounded-full`}>
                {statusLabels[project.status]}
              </Badge>
              <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                <Calendar className="h-3.5 w-3.5" />
                {format(new Date(project.date), "MMMM yyyy")}
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-serif leading-tight">
              {project.name}
            </h1>

            {/* Contributors & Rating */}
            <div className="flex items-center gap-3 flex-wrap text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                {contributors.length === 1 ? (
                  <>
                    <User className="h-4 w-4" />
                    <span>{contributors[0].name}</span>
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4" />
                    <div className="flex -space-x-2">
                      {contributors.slice(0, 3).map((contributor, index) => {
                        const avatarUrl = getGitHubAvatar(contributor.github_link);
                        return (
                          <Avatar key={index} className="h-8 w-8 border-2 border-background">
                            {avatarUrl ? (
                              <AvatarImage src={avatarUrl} alt={contributor.name} />
                            ) : null}
                            <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                              {contributor.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        );
                      })}
                      {contributors.length > 3 && (
                        <div className="h-8 w-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium">
                          +{contributors.length - 3}
                        </div>
                      )}
                    </div>
                    <span>{contributors.length} contributors</span>
                  </>
                )}
              </div>
              {project.stars_rating !== null && project.stars_rating > 0 && (
                <>
                  <span className="mx-1">·</span>
                  <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                  <span>{project.stars_rating} stars</span>
                </>
              )}
            </div>

            {/* Tech Stack */}
            <div className="flex flex-wrap gap-1.5">
              {project.tech_stack.map((tech, index) => (
                <span key={index} className="text-xs px-3 py-1.5 rounded-full bg-muted text-muted-foreground font-medium">
                  {tech}
                </span>
              ))}
            </div>

            {/* Links + Share */}
            <div className="flex items-center gap-3 pt-2">
              {project.live_link && (
                <CoolMode options={{ particle: "🚀" }}>
                  <a
                    href={project.live_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent text-accent-foreground font-medium text-sm hover:bg-accent/90 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Live
                  </a>
                </CoolMode>
              )}
              {project.github_link && (
                <CoolMode options={{ particle: "⭐" }}>
                  <a
                    href={project.github_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border hover:bg-muted transition-colors font-medium text-sm"
                  >
                    <Github className="h-4 w-4" />
                    GitHub
                  </a>
                </CoolMode>
              )}
              <ShareButton projectName={project.name} projectId={project.id} />
            </div>
          </div>

          {/* Right: Image Carousel */}
          <div>
            {project.images && project.images.length > 0 ? (
              <ImageCarousel
                images={project.images}
                descriptions={imageDescriptions}
                projectName={project.name}
                autoScrollInterval={5000}
              />
            ) : (
              <div className="aspect-video rounded-lg bg-muted flex items-center justify-center">
                <span className="text-muted-foreground">No Images</span>
              </div>
            )}
          </div>
        </section>

        {/* Description + TOC & Contact Form (sticky) */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold font-serif mb-4">About this Project</h2>
            <div
              className="text-muted-foreground leading-relaxed prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: descriptionWithIds }}
            />
          </div>
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 space-y-6">
              {/* Table of Contents */}
              {tocItems.length > 0 && (
                <div className="rounded-lg bg-card border border-border p-5">
                  <h3 className="text-sm font-bold font-serif mb-3 flex items-center gap-2">
                    <List className="h-4 w-4" />
                    Table of Contents
                  </h3>
                  <nav className="space-y-1.5">
                    {tocItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => scrollToHeading(item.id)}
                        className={`block w-full text-left text-sm text-muted-foreground hover:text-foreground transition-colors ${item.level === 1 ? "font-medium" : item.level === 2 ? "pl-3" : "pl-6 text-xs"
                          }`}
                      >
                        {item.text}
                      </button>
                    ))}
                  </nav>
                </div>
              )}
              <ContactForm projectId={project.id} projectName={project.name} />
            </div>
          </div>
        </section>

        {/* Reviews */}
        <section className="mb-12">
          <ProjectReviews projectId={project.id} />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Saurabh. All rights reserved.
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
              <Link
                to="/about"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                About
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ProjectDetail;
