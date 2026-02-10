import { Link } from "react-router-dom";
import { ExternalLink, Github, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Project } from "@/types/project";
import { format } from "date-fns";

interface ProjectCardProps {
  project: Project;
}

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

const ProjectCard = ({ project }: ProjectCardProps) => {
  return (
    <Link to={`/project/${project.id}`} className="block group">
      <div className="card-hover rounded-3xl overflow-hidden bg-card border border-border">
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
          <Badge className={`absolute top-4 right-4 ${statusColors[project.status]} border-0 font-semibold`}>
            {statusLabels[project.status]}
          </Badge>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-xl font-bold font-serif group-hover:text-accent transition-colors line-clamp-2">
              {project.name}
            </h3>
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {format(new Date(project.date), "MMMM yyyy")}
            </span>
          </div>

        <p className="text-muted-foreground text-sm line-clamp-3">
          {project.description}
        </p>

        {/* Tech Stack */}
        <div className="flex flex-wrap gap-2">
          {project.tech_stack.slice(0, 6).map((tech, index) => (
            <Badge key={index} variant="secondary" className="text-xs rounded-full px-3 py-1">
              {tech}
            </Badge>
          ))}
          {project.tech_stack.length > 6 && (
            <Badge variant="secondary" className="text-xs rounded-full px-3 py-1">
              +{project.tech_stack.length - 6}
            </Badge>
          )}
        </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2" onClick={(e) => e.preventDefault()}>
            {project.live_link && (
              <a
                href={project.live_link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-border hover:bg-muted transition-colors text-sm font-medium"
              >
                <ExternalLink className="h-4 w-4" />
                Live
              </a>
            )}
            {project.github_link && (
              <a
                href={project.github_link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-border hover:bg-muted transition-colors text-sm font-medium"
              >
                <Github className="h-4 w-4" />
                GitHub
              </a>
            )}
            {project.stars_rating !== null && project.stars_rating > 0 && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground ml-auto">
                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
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
