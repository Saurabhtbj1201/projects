import { Link } from "react-router-dom";
import { ExternalLink, Github, Star, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Project } from "@/types/project";
import { format } from "date-fns";

interface ProjectCardProps {
  project: Project;
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

const ProjectCard = ({ project }: ProjectCardProps) => {
  return (
    <Link to={`/project/${project.id}`} className="block group">
      <div className="overflow-hidden bg-card border border-border rounded-lg hover:border-accent/40 hover:shadow-lg transition-all duration-300">
        {/* Image */}
        <div className="relative aspect-video overflow-hidden">
          {project.images && project.images.length > 0 ? (
            <img
              src={project.images[0]}
              alt={project.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <span className="text-muted-foreground text-lg font-medium">No Image</span>
            </div>
          )}
          <Badge className={`absolute top-3 left-3 ${statusColors[project.status]} text-xs font-semibold rounded-full`}>
            {statusLabels[project.status]}
          </Badge>
          <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowUpRight className="h-4 w-4" />
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-bold font-serif group-hover:text-accent transition-colors line-clamp-1">
              {project.name}
            </h3>
            <span className="text-xs text-muted-foreground whitespace-nowrap mt-1">
              {format(new Date(project.date), "MMM yyyy")}
            </span>
          </div>

          <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">
            {project.description}
          </p>

          {/* Tech Stack */}
          <div className="flex flex-wrap gap-1.5">
            {project.tech_stack.slice(0, 4).map((tech, index) => (
              <span key={index} className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-medium">
                {tech}
              </span>
            ))}
            {project.tech_stack.length > 4 && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-medium">
                +{project.tech_stack.length - 4}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-border" onClick={(e) => e.preventDefault()}>
            {project.live_link && (
              <a
                href={project.live_link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded hover:bg-muted transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Live
              </a>
            )}
            {project.github_link && (
              <a
                href={project.github_link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded hover:bg-muted transition-colors"
              >
                <Github className="h-3.5 w-3.5" />
                Code
              </a>
            )}
            {project.stars_rating !== null && project.stars_rating > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                {project.stars_rating}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProjectCard;
