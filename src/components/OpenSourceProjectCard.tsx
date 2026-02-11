import { useState, useEffect } from "react";
import { OpenSourceProject, Contributor } from "@/types/project";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, GitFork, ExternalLink, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import ImageCarousel from "@/components/ImageCarousel";
import { supabase } from "@/integrations/supabase/client";

interface OpenSourceProjectCardProps {
    project: OpenSourceProject;
}

const OpenSourceProjectCard = ({ project }: OpenSourceProjectCardProps) => {
    const [contributors, setContributors] = useState<Contributor[]>([]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "active": return "bg-green-500 hover:bg-green-600";
            case "completed": return "bg-blue-500 hover:bg-blue-600";
            case "on_hold": return "bg-yellow-500 hover:bg-yellow-600";
            case "archived": return "bg-gray-500 hover:bg-gray-600";
            default: return "bg-gray-500 hover:bg-gray-600";
        }
    };

    useEffect(() => {
        const fetchContributors = async () => {
            try {
                const { data } = await supabase
                    .from("contributors")
                    .select("*")
                    .eq("project_id", project.id)
                    .eq("status", "approved")
                    .order("created_at", { ascending: false });
                setContributors((data as any) || []);
            } catch (e) {
                // silently fail
            }
        };
        fetchContributors();
    }, [project.id]);

    // Build GitHub avatar URL from profile link
    const getGitHubAvatar = (githubProfile: string) => {
        try {
            const url = new URL(githubProfile);
            const username = url.pathname.replace(/^\//, "").split("/")[0];
            return `https://avatars.githubusercontent.com/${username}`;
        } catch {
            return null;
        }
    };

    const hasImages = project.images && project.images.length > 0;
    const maxAvatars = 8;
    const extraCount = contributors.length > maxAvatars ? contributors.length - maxAvatars : 0;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Left Side - Image Carousel */}
            <div className="relative">
                {/* Status Badge */}
                <div className="absolute top-4 left-4 z-10">
                    <Badge className={getStatusColor(project.status)}>
                        {project.status}
                    </Badge>
                </div>
                <ImageCarousel
                    images={hasImages ? project.images : []}
                    projectName={project.title}
                    autoScrollInterval={6000}
                />
            </div>

            {/* Right Side - Project Details */}
            <div className="flex flex-col justify-between">
                {/* Header */}
                <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex-1">
                            <h3 className="text-2xl lg:text-3xl font-bold mb-2 hover:text-primary transition-colors">
                                <Link to={`/opensource/${project.slug}`}>{project.title}</Link>
                            </h3>
                            <div className="flex flex-wrap gap-2 items-center">
                                <Badge variant="outline" className="font-medium">
                                    {project.category}
                                </Badge>
                            </div>
                        </div>
                        <GitFork className="h-6 w-6 text-muted-foreground flex-shrink-0 mt-1" />
                    </div>

                    {/* Overview */}
                    {project.overview && (
                        <div
                            className="text-sm text-muted-foreground line-clamp-3 mb-5"
                            dangerouslySetInnerHTML={{ __html: project.overview }}
                        />
                    )}

                    {/* Tech Stack */}
                    {project.tech_stack && project.tech_stack.length > 0 && (
                        <div className="mb-4">
                            <p className="text-xs font-semibold mb-2 text-muted-foreground">Tech Stack:</p>
                            <div className="flex flex-wrap gap-2">
                                {project.tech_stack.slice(0, 6).map((tech, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                        {tech}
                                    </Badge>
                                ))}
                                {project.tech_stack.length > 6 && (
                                    <Badge variant="secondary" className="text-xs">
                                        +{project.tech_stack.length - 6} more
                                    </Badge>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Skills Required */}
                    {project.skills_required && project.skills_required.length > 0 && (
                        <div className="mb-4">
                            <p className="text-xs font-semibold mb-2 text-muted-foreground">Skills Needed:</p>
                            <div className="flex flex-wrap gap-2">
                                {project.skills_required.slice(0, 5).map((skill, index) => (
                                    <span key={index} className="text-xs bg-muted px-2 py-1 rounded">
                                        {skill}
                                    </span>
                                ))}
                                {project.skills_required.length > 5 && (
                                    <span className="text-xs bg-muted px-2 py-1 rounded">
                                        +{project.skills_required.length - 5} more
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Contributors - Grouped Avatars */}
                    <div className="flex items-center gap-3 mb-6">
                        {contributors.length > 0 ? (
                            <div className="flex -space-x-2">
                                {contributors.slice(0, maxAvatars).map((contributor) => {
                                    const avatarUrl = getGitHubAvatar(contributor.github_profile);
                                    return (
                                        <Avatar
                                            key={contributor.id}
                                            className="h-8 w-8 ring-2 ring-background"
                                        >
                                            {avatarUrl && <AvatarImage src={avatarUrl} alt={contributor.name} />}
                                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                                {contributor.name.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    );
                                })}
                                {extraCount > 0 && (
                                    <Avatar className="h-8 w-8 ring-2 ring-background">
                                        <AvatarFallback className="text-xs bg-muted text-muted-foreground font-semibold">
                                            +{extraCount}
                                        </AvatarFallback>
                                    </Avatar>
                                )}
                            </div>
                        ) : (
                            <Users className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="text-sm text-muted-foreground">
                            <span className="font-semibold text-foreground">{project.contributor_count}</span>{" "}
                            {project.contributor_count === 1 ? "Contributor" : "Contributors"}
                        </span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                    <Button asChild className="flex-1">
                        <Link to={`/opensource/${project.slug}`}>
                            Contribute Now
                        </Link>
                    </Button>
                    <Button variant="outline" size="icon" asChild>
                        <a
                            href={project.github_repo_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="View on GitHub"
                        >
                            <ExternalLink className="h-4 w-4" />
                        </a>
                    </Button>
                    {project.doc_link && (
                        <Button variant="outline" size="icon" asChild>
                            <a
                                href={project.doc_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="View Documentation"
                            >
                                <FileText className="h-4 w-4" />
                            </a>
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OpenSourceProjectCard;
