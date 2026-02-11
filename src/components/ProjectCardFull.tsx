import { Link } from "react-router-dom";
import { ExternalLink, Github, Star, Calendar, User, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Project } from "@/types/project";
import { format } from "date-fns";
import ImageCarousel from "@/components/ImageCarousel";
import ShareButton from "@/components/ShareButton";
import { CoolMode } from "@/components/ui/cool-mode";

interface ProjectCardFullProps {
    project: Project;
    imageOnLeft: boolean;
}

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

const stripHtml = (html: string) => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
};

const ProjectCardFull = ({ project, imageOnLeft }: ProjectCardFullProps) => {
    // Parse contributors from JSON string if it exists
    interface Contributor {
        name: string;
        github_link?: string;
    }

    const contributors: Contributor[] = project.contributors
        ? (typeof project.contributors === 'string'
            ? JSON.parse(project.contributors)
            : project.contributors)
        : [{ name: "Saurabh Kumar", github_link: "https://github.com/saurabhtbj1201" }];

    // Helper to get GitHub avatar from profile link
    const getGitHubAvatar = (githubLink?: string) => {
        if (!githubLink) return null;
        try {
            const username = githubLink.replace('https://github.com/', '').replace('/', '');
            return `https://github.com/${username}.png`;
        } catch {
            return null;
        }
    };

    return (
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center`}>
            {/* Image Carousel Side - Order controlled by CSS */}
            <div className={`relative ${imageOnLeft ? 'lg:order-1' : 'lg:order-2'}`}>
                {project.images && project.images.length > 0 ? (
                    <ImageCarousel images={project.images} projectName={project.name} />
                ) : (
                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                        <span className="text-muted-foreground text-lg font-medium">No Images</span>
                    </div>
                )}
            </div>

            {/* Details Side - Order controlled by CSS */}
            <div className={`space-y-5 ${imageOnLeft ? 'lg:order-2' : 'lg:order-1'}`}>
                {/* Status & Date */}
                <div className="flex items-center gap-3 flex-wrap">
                    <Badge className={`${statusColors[project.status]} text-xs font-semibold rounded-full`}>
                        {statusLabels[project.status]}
                    </Badge>
                    <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(project.date), "MMMM yyyy")}
                    </div>
                </div>

                {/* Title */}
                <Link to={`/project/${project.id}`} className="block group">
                    <h2 className="text-3xl md:text-4xl font-bold font-serif group-hover:text-accent transition-colors">
                        {project.name}
                    </h2>
                </Link>

                {/* Description */}
                <p className="text-muted-foreground leading-relaxed line-clamp-4">
                    {stripHtml(project.description)}
                </p>

                {/* Tech Stack */}
                <div className="flex flex-wrap gap-2">
                    {project.tech_stack.slice(0, 6).map((tech, index) => (
                        <span key={index} className="text-xs px-3 py-1.5 rounded-full bg-muted text-muted-foreground font-medium">
                            {tech}
                        </span>
                    ))}
                    {project.tech_stack.length > 6 && (
                        <span className="text-xs px-3 py-1.5 rounded-full bg-muted text-muted-foreground font-medium">
                            +{project.tech_stack.length - 6} more
                        </span>
                    )}
                </div>

                {/* Contributors & Rating */}
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {contributors.length === 1 ? (
                            <>
                                <User className="h-4 w-4" />
                                <span>{contributors[0].name}</span>
                            </>
                        ) : (
                            <>
                                <Users className="h-4 w-4" />
                                <div className="flex -space-x-2">
                                    {contributors.slice(0, 3).map((contributor, index: number) => {
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

                    {/* Rating */}
                    {project.stars_rating !== null && project.stars_rating > 0 && (
                        <>
                            <span className="text-muted-foreground">•</span>
                            <div className="flex items-center gap-1.5">
                                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                                <span className="text-sm font-semibold">{project.stars_rating}</span>
                            </div>
                        </>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                    {project.live_link && (
                        <CoolMode options={{ particle: "🚀" }}>
                            <a
                                href={project.live_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
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
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border hover:bg-muted transition-colors font-medium text-sm"
                            >
                                <Github className="h-4 w-4" />
                                GitHub
                            </a>
                        </CoolMode>
                    )}
                    <CoolMode options={{ particle: "💼" }}>
                        <Link
                            to={`/project/${project.id}`}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border hover:bg-muted transition-colors font-medium text-sm"
                        >
                            View Details →
                        </Link>
                    </CoolMode>
                    <ShareButton projectName={project.name} projectId={project.id} />
                </div>
            </div>
        </div>
    );
};

export default ProjectCardFull;
