import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { OpenSourceProject, Contributor } from "@/types/project";
import Header from "@/components/Header";
import ImageCarousel from "@/components/ImageCarousel";
import PRRequestForm from "@/components/PRRequestForm";
import { QRCode } from "@/components/shared-assets/qr-code";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Loader2,
    GitFork,
    ExternalLink,
    FileText,
    Users,
    Code,
    BookOpen,
    Rocket,
    CheckCircle2,
    Share2,
    Copy,
    AlertTriangle,
    ArrowLeft,
    ListTree,
    Lightbulb,
    Settings2,
    Map,
    Twitter,
    Linkedin,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const OpenSourceDetail = () => {
    const { slug } = useParams<{ slug: string }>();
    const [project, setProject] = useState<OpenSourceProject | null>(null);
    const [contributors, setContributors] = useState<Contributor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showPRForm, setShowPRForm] = useState(false);
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [copied, setCopied] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (slug) {
            fetchProjectData();
        }
    }, [slug]);

    const fetchProjectData = async () => {
        try {
            const [projectRes, contributorsRes] = await Promise.all([
                supabase
                    .from("open_source_projects")
                    .select("*")
                    .eq("slug", slug)
                    .single(),
                supabase
                    .from("contributors")
                    .select("*")
                    .eq("status", "approved")
                    .order("created_at", { ascending: false }),
            ]);

            if (projectRes.error) throw projectRes.error;

            setProject(projectRes.data as any);
            setContributors((contributorsRes.data as any) || []);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Build Table of Contents from available sections
    const tocSections = useMemo(() => {
        if (!project) return [];
        const sections: { id: string; label: string; icon: React.ReactNode }[] = [];
        if (project.overview) sections.push({ id: "overview", label: "Overview", icon: <BookOpen className="h-4 w-4" /> });
        if (project.problem_statement) sections.push({ id: "problem", label: "Problem Statement", icon: <Lightbulb className="h-4 w-4" /> });
        if (project.features) sections.push({ id: "features", label: "Features", icon: <CheckCircle2 className="h-4 w-4" /> });
        if (project.installation_guide) sections.push({ id: "installation", label: "Installation Guide", icon: <Settings2 className="h-4 w-4" /> });
        if (project.contribution_guidelines) sections.push({ id: "contribution", label: "Contribution Guidelines", icon: <GitFork className="h-4 w-4" /> });
        if (project.custom_contribution_instructions) sections.push({ id: "pr-rules", label: "Before Submitting a PR", icon: <AlertTriangle className="h-4 w-4" /> });
        if (project.roadmap) sections.push({ id: "roadmap", label: "Roadmap", icon: <Map className="h-4 w-4" /> });
        return sections;
    }, [project]);

    const getGitHubAvatar = (githubProfile: string) => {
        try {
            const url = new URL(githubProfile);
            const username = url.pathname.replace(/^\//, "").split("/")[0];
            return `https://avatars.githubusercontent.com/${username}`;
        } catch {
            return null;
        }
    };

    const handleShare = (platform: string) => {
        const url = window.location.href;
        const text = `Check out "${project?.title}" - an open source project!`;
        switch (platform) {
            case "twitter":
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank");
                break;
            case "linkedin":
                window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, "_blank");
                break;
            case "copy":
                navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
                toast({ title: "Link copied!", description: "Share it anywhere 🚀" });
                break;
        }
        setShowShareMenu(false);
    };

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    // Inject copy buttons into code blocks
    useEffect(() => {
        if (!project) return;

        // Small delay to ensure DOM has rendered the HTML content
        const timer = setTimeout(() => {
            const codeBlocks = document.querySelectorAll('.prose pre');
            codeBlocks.forEach((pre) => {
                // Don't add duplicate buttons
                if (pre.querySelector('.code-copy-btn')) return;

                const btn = document.createElement('button');
                btn.className = 'code-copy-btn';
                btn.title = 'Copy code';
                btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;

                btn.addEventListener('click', () => {
                    const code = pre.querySelector('code')?.textContent || pre.textContent || '';
                    navigator.clipboard.writeText(code).then(() => {
                        btn.classList.add('copied');
                        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
                        setTimeout(() => {
                            btn.classList.remove('copied');
                            btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
                        }, 2000);
                    });
                });

                pre.appendChild(btn);
            });
        }, 200);

        return () => clearTimeout(timer);
    }, [project]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <div className="flex items-center justify-center h-[60vh]">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <div className="max-w-4xl mx-auto px-4 py-20 text-center">
                    <h1 className="text-4xl font-bold mb-4">Project Not Found</h1>
                    <p className="text-muted-foreground mb-8">
                        The open source project you're looking for doesn't exist.
                    </p>
                    <Button asChild>
                        <Link to="/">Back to Home</Link>
                    </Button>
                </div>
            </div>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "active": return "bg-green-500";
            case "completed": return "bg-blue-500";
            case "on_hold": return "bg-yellow-500";
            case "archived": return "bg-gray-500";
            default: return "bg-gray-500";
        }
    };

    const projectContributors = contributors.filter(c => c.project_id === project.id);

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Back Button */}
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Projects
                </Link>

                {/* Title Row */}
                <div className="flex items-start justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <GitFork className="h-8 w-8 text-primary flex-shrink-0" />
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">{project.title}</h1>
                    </div>
                    {/* Share Button */}
                    <div className="relative flex-shrink-0">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setShowShareMenu(!showShareMenu)}
                            className="rounded-full"
                        >
                            <Share2 className="h-4 w-4" />
                        </Button>
                        {showShareMenu && (
                            <div className="absolute right-0 top-12 z-50 bg-card border rounded-xl shadow-lg p-2 min-w-[180px] animate-in fade-in slide-in-from-top-2">
                                <button
                                    onClick={() => handleShare("twitter")}
                                    className="flex items-center gap-3 w-full px-3 py-2.5 text-sm rounded-lg hover:bg-muted transition-colors"
                                >
                                    <Twitter className="h-4 w-4 text-sky-500" /> Share on Twitter
                                </button>
                                <button
                                    onClick={() => handleShare("linkedin")}
                                    className="flex items-center gap-3 w-full px-3 py-2.5 text-sm rounded-lg hover:bg-muted transition-colors"
                                >
                                    <Linkedin className="h-4 w-4 text-blue-600" /> Share on LinkedIn
                                </button>
                                <button
                                    onClick={() => handleShare("copy")}
                                    className="flex items-center gap-3 w-full px-3 py-2.5 text-sm rounded-lg hover:bg-muted transition-colors"
                                >
                                    <Copy className="h-4 w-4" /> {copied ? "Copied!" : "Copy Link"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* ============ ROW 1: Image Carousel | Project Info ============ */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-12">
                    {/* Left - Image Carousel (3 cols) */}
                    <div className="lg:col-span-3">
                        {project.images && project.images.length > 0 ? (
                            <ImageCarousel
                                images={project.images}
                                projectName={project.title}
                                autoScrollInterval={6000}
                            />
                        ) : (
                            <div className="aspect-video rounded-xl bg-muted/50 flex items-center justify-center border border-dashed">
                                <div className="text-center text-muted-foreground">
                                    <GitFork className="h-16 w-16 mx-auto mb-3 opacity-30" />
                                    <p className="text-sm">No images available</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right - Project Info (2 cols) */}
                    <div className="lg:col-span-2 flex flex-col gap-5">
                        {/* Status & Category */}
                        <div className="flex flex-wrap gap-2">
                            <Badge className={`${getStatusColor(project.status)} text-white px-3 py-1`}>
                                {project.status.charAt(0).toUpperCase() + project.status.slice(1).replace("_", " ")}
                            </Badge>
                            <Badge variant="outline" className="px-3 py-1">{project.category}</Badge>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-3">
                            <Button size="lg" className="w-full text-base" onClick={() => setShowPRForm(true)}>
                                <Rocket className="mr-2 h-5 w-5" />
                                Contribute Now
                            </Button>
                            <Button variant="outline" size="lg" className="w-full" asChild>
                                <a href={project.github_repo_link} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="mr-2 h-5 w-5" />
                                    View on GitHub
                                </a>
                            </Button>
                            {project.doc_link && (
                                <Button variant="outline" size="lg" className="w-full" asChild>
                                    <a href={project.doc_link} target="_blank" rel="noopener noreferrer">
                                        <FileText className="mr-2 h-5 w-5" />
                                        Documentation
                                    </a>
                                </Button>
                            )}
                        </div>

                        {/* Tech Stack */}
                        {project.tech_stack && project.tech_stack.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                                    <Code className="h-4 w-4" />
                                    Tech Stack
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {project.tech_stack.map((tech, index) => (
                                        <Badge key={index} variant="secondary" className="text-xs">
                                            {tech}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )
                        }

                        {/* Contributor Avatars Preview */}
                        <div>
                            <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Contributors ({project.contributor_count})
                            </h3>
                            {projectContributors.length > 0 ? (
                                <div className="flex -space-x-2">
                                    {projectContributors.slice(0, 8).map((contributor) => {
                                        const avatarUrl = getGitHubAvatar(contributor.github_profile);
                                        return (
                                            <Avatar
                                                key={contributor.id}
                                                className="h-9 w-9 ring-2 ring-background hover:ring-primary transition-all hover:scale-110 hover:z-10"
                                                title={contributor.name}
                                            >
                                                {avatarUrl && <AvatarImage src={avatarUrl} alt={contributor.name} />}
                                                <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                                                    {contributor.name.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                        );
                                    })}
                                    {projectContributors.length > 8 && (
                                        <Avatar className="h-9 w-9 ring-2 ring-background">
                                            <AvatarFallback className="text-xs bg-muted text-muted-foreground font-semibold">
                                                +{projectContributors.length - 8}
                                            </AvatarFallback>
                                        </Avatar>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">Be the first contributor! 🎉</p>
                            )}
                        </div>

                        {/* PR Submission Instructions Link */}
                        {project.custom_contribution_instructions && (
                            <button
                                onClick={() => scrollToSection("pr-rules")}
                                className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg border border-amber-300/50 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-700/30 hover:bg-amber-100/70 dark:hover:bg-amber-950/40 transition-colors group"
                            >
                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">PR Submission Instructions</p>
                                    <p className="text-xs text-amber-700/70 dark:text-amber-400/60">Read before contributing</p>
                                </div>
                                <ArrowLeft className="h-4 w-4 rotate-[-90deg] text-amber-500 group-hover:translate-y-0.5 transition-transform" />
                            </button>
                        )}
                    </div>
                </div>

                {/* ============ ROW 2: TOC | Content | Sidebar ============ */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Sidebar - Table of Contents (2 cols) */}
                    <div className="hidden lg:block lg:col-span-2">
                        <div className="sticky top-24 space-y-4">
                            {tocSections.length > 0 && (
                                <Card>
                                    <CardHeader className="pb-3 px-3">
                                        <CardTitle className="flex items-center gap-2 text-sm">
                                            <ListTree className="h-4 w-4" />
                                            Contents
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0 px-2">
                                        <nav className="space-y-0.5">
                                            {tocSections.map((section) => (
                                                <button
                                                    key={section.id}
                                                    onClick={() => scrollToSection(section.id)}
                                                    className="flex items-center gap-2 w-full text-left px-2 py-1.5 text-xs rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground group"
                                                >
                                                    <span className="text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0">
                                                        {section.icon}
                                                    </span>
                                                    <span className="truncate">{section.label}</span>
                                                </button>
                                            ))}
                                        </nav>
                                    </CardContent>
                                </Card>
                            )}
                            {/* Skills Required */}
                            {project.skills_required && project.skills_required.length > 0 && (
                                <Card>
                                    <CardHeader className="pb-3 px-3">
                                        <CardTitle className="text-sm">Skills Required</CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0 px-3">
                                        <div className="flex flex-wrap gap-1.5">
                                            {project.skills_required.map((skill, index) => (
                                                <Badge key={index} variant="outline" className="text-xs">
                                                    {skill}
                                                </Badge>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>

                    {/* Main Content (7 cols) */}
                    <div className="lg:col-span-7 space-y-8">
                        {/* Overview */}
                        {project.overview && (
                            <section id="overview">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <BookOpen className="h-5 w-5 text-primary" />
                                            Overview
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div
                                            className="prose dark:prose-invert max-w-none"
                                            dangerouslySetInnerHTML={{ __html: project.overview }}
                                        />
                                    </CardContent>
                                </Card>
                            </section>
                        )}

                        {/* Problem Statement */}
                        {project.problem_statement && (
                            <section id="problem">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Lightbulb className="h-5 w-5 text-yellow-500" />
                                            Problem Statement
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div
                                            className="prose dark:prose-invert max-w-none"
                                            dangerouslySetInnerHTML={{ __html: project.problem_statement }}
                                        />
                                    </CardContent>
                                </Card>
                            </section>
                        )}

                        {/* Features */}
                        {project.features && (
                            <section id="features">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                                            Features
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div
                                            className="prose dark:prose-invert max-w-none"
                                            dangerouslySetInnerHTML={{ __html: project.features }}
                                        />
                                    </CardContent>
                                </Card>
                            </section>
                        )}

                        {/* Installation Guide */}
                        {project.installation_guide && (
                            <section id="installation">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Settings2 className="h-5 w-5 text-blue-500" />
                                            Installation Guide
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div
                                            className="prose dark:prose-invert max-w-none"
                                            dangerouslySetInnerHTML={{ __html: project.installation_guide }}
                                        />
                                    </CardContent>
                                </Card>
                            </section>
                        )}

                        {/* Contribution Guidelines */}
                        {project.contribution_guidelines && (
                            <section id="contribution">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <GitFork className="h-5 w-5 text-purple-500" />
                                            Contribution Guidelines
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div
                                            className="prose dark:prose-invert max-w-none"
                                            dangerouslySetInnerHTML={{ __html: project.contribution_guidelines }}
                                        />
                                    </CardContent>
                                </Card>
                            </section>
                        )}

                        {/* ⚡ Important: Before Submitting a PR - Engaging Design */}
                        {project.custom_contribution_instructions && (
                            <section id="pr-rules">
                                <div className="relative overflow-hidden rounded-xl border-2 border-amber-400/50 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-yellow-950/30 dark:border-amber-500/30">
                                    {/* Decorative corner elements */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-200/30 to-transparent dark:from-amber-500/10 rounded-bl-full" />
                                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-orange-200/30 to-transparent dark:from-orange-500/10 rounded-tr-full" />

                                    <div className="relative p-6 md:p-8">
                                        {/* Header */}
                                        <div className="flex items-start gap-4 mb-6">
                                            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                                                <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl md:text-2xl font-bold text-amber-900 dark:text-amber-200">
                                                    ⚡ Important: Before Submitting a PR
                                                </h3>
                                                <p className="text-sm text-amber-700/80 dark:text-amber-400/70 mt-1">
                                                    Please read these instructions carefully to ensure your contribution is accepted.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="bg-white/60 dark:bg-black/20 rounded-lg p-5 backdrop-blur-sm border border-amber-200/50 dark:border-amber-800/30">
                                            <p className="whitespace-pre-wrap text-amber-950 dark:text-amber-100 leading-relaxed">
                                                {project.custom_contribution_instructions}
                                            </p>
                                        </div>

                                        {/* CTA */}
                                        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
                                            <Button
                                                size="lg"
                                                className="bg-amber-600 hover:bg-amber-700 text-white w-full sm:w-auto"
                                                onClick={() => setShowPRForm(true)}
                                            >
                                                <Rocket className="mr-2 h-5 w-5" />
                                                I've Read This — Let's Contribute!
                                            </Button>
                                            <span className="text-xs text-amber-600/70 dark:text-amber-400/60">
                                                By contributing, you agree to follow these guidelines.
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Roadmap */}
                        {project.roadmap && (
                            <section id="roadmap">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Map className="h-5 w-5 text-cyan-500" />
                                            Roadmap
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div
                                            className="prose dark:prose-invert max-w-none"
                                            dangerouslySetInnerHTML={{ __html: project.roadmap }}
                                        />
                                    </CardContent>
                                </Card>
                            </section>
                        )}
                    </div>

                    {/* ============ Right Sidebar (3 cols) ============ */}
                    <div className="lg:col-span-3">
                        <div className="sticky top-24 space-y-6">

                            {/* Contributors List */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Users className="h-5 w-5" />
                                        Contributors ({project.contributor_count})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    {projectContributors.length > 0 ? (
                                        <div className="space-y-3">
                                            {projectContributors.slice(0, 10).map((contributor) => {
                                                const avatarUrl = getGitHubAvatar(contributor.github_profile);
                                                return (
                                                    <div key={contributor.id} className="flex items-center gap-3 group">
                                                        <Avatar className="h-8 w-8 ring-1 ring-border group-hover:ring-primary transition-all">
                                                            {avatarUrl && <AvatarImage src={avatarUrl} alt={contributor.name} />}
                                                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                                                {contributor.name.charAt(0).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-sm truncate">{contributor.name}</p>
                                                            <div className="flex gap-2 text-xs text-muted-foreground">
                                                                {contributor.github_profile && (
                                                                    <a
                                                                        href={contributor.github_profile}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="hover:text-primary transition-colors"
                                                                    >
                                                                        GitHub
                                                                    </a>
                                                                )}
                                                                {contributor.linkedin_profile && (
                                                                    <a
                                                                        href={contributor.linkedin_profile}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="hover:text-primary transition-colors"
                                                                    >
                                                                        LinkedIn
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {projectContributors.length > 10 && (
                                                <p className="text-sm text-muted-foreground text-center pt-2">
                                                    +{projectContributors.length - 10} more contributors
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center py-6">
                                            <Users className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                                            <p className="text-sm text-muted-foreground">Be the first contributor! 🎉</p>
                                            <Button
                                                size="sm"
                                                className="mt-3"
                                                onClick={() => setShowPRForm(true)}
                                            >
                                                <Rocket className="mr-1 h-3 w-3" /> Contribute
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Share Card with QR Code */}
                            <Card>
                                <CardContent className="pt-6">
                                    <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                                        <Share2 className="h-4 w-4" />
                                        Share this project
                                    </h4>
                                    {/* QR Code */}
                                    <div className="mb-4 flex justify-center">
                                        <QRCode value={window.location.href} size="lg" />
                                    </div>
                                    <p className="text-xs text-center text-muted-foreground mb-4">Scan to open this project</p>
                                    {/* Share Buttons */}
                                    <div className="grid grid-cols-3 gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                            onClick={() => handleShare("twitter")}
                                        >
                                            <Twitter className="h-4 w-4 mr-1 flex-shrink-0" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                            onClick={() => handleShare("linkedin")}
                                        >
                                            <Linkedin className="h-4 w-4 mr-1 flex-shrink-0" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                            onClick={() => handleShare("copy")}
                                        >
                                            <Copy className="h-4 w-4 mr-1 flex-shrink-0" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-border mt-16">
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

            {/* PR Request Form Dialog */}
            {showPRForm && (
                <PRRequestForm
                    projectId={project.id}
                    projectTitle={project.title}
                    onClose={() => setShowPRForm(false)}
                />
            )}
        </div>
    );
};

export default OpenSourceDetail;
