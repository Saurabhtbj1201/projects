import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { OpenSourceProject, OpenSourceStatus } from "@/types/project";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Pencil, Trash2, Users, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import RichTextEditor from "./RichTextEditor";
import ImageUpload from "./ImageUpload";

const OpenSourceProjectsManager = () => {
    const [projects, setProjects] = useState<OpenSourceProject[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<OpenSourceProject | null>(null);
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        title: "",
        slug: "",
        category: "",
        status: "active" as OpenSourceStatus,
        github_repo_link: "",
        doc_link: "",
        overview: "",
        problem_statement: "",
        tech_stack: [] as string[],
        features: "",
        installation_guide: "",
        contribution_guidelines: "",
        roadmap: "",
        custom_contribution_instructions: "",
        skills_required: [] as string[],
        images: [] as string[],
    });

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const { data, error } = await supabase
                .from("open_source_projects")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setProjects(data || []);
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

    const generateSlug = (title: string) => {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const slug = formData.slug || generateSlug(formData.title);

            if (editingProject) {
                const { error } = await supabase
                    .from("open_source_projects")
                    .update({ ...formData, slug })
                    .eq("id", editingProject.id);

                if (error) throw error;

                toast({
                    title: "Success",
                    description: "Open source project updated successfully",
                });
            } else {
                const { error } = await supabase
                    .from("open_source_projects")
                    .insert([{ ...formData, slug }]);

                if (error) throw error;

                toast({
                    title: "Success",
                    description: "Open source project created successfully",
                });
            }

            setIsDialogOpen(false);
            resetForm();
            fetchProjects();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this project?")) return;

        try {
            const { error } = await supabase
                .from("open_source_projects")
                .delete()
                .eq("id", id);

            if (error) throw error;

            toast({
                title: "Success",
                description: "Project deleted successfully",
            });

            fetchProjects();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    const handleEdit = (project: OpenSourceProject) => {
        setEditingProject(project);
        setFormData({
            title: project.title,
            slug: project.slug,
            category: project.category,
            status: project.status,
            github_repo_link: project.github_repo_link,
            doc_link: project.doc_link || "",
            overview: project.overview || "",
            problem_statement: project.problem_statement || "",
            tech_stack: project.tech_stack,
            features: project.features || "",
            installation_guide: project.installation_guide || "",
            contribution_guidelines: project.contribution_guidelines || "",
            roadmap: project.roadmap || "",
            custom_contribution_instructions: project.custom_contribution_instructions || "",
            skills_required: project.skills_required,
            images: project.images,
        });
        setIsDialogOpen(true);
    };

    const resetForm = () => {
        setFormData({
            title: "",
            slug: "",
            category: "",
            status: "active",
            github_repo_link: "",
            doc_link: "",
            overview: "",
            problem_statement: "",
            tech_stack: [],
            features: "",
            installation_guide: "",
            contribution_guidelines: "",
            roadmap: "",
            custom_contribution_instructions: "",
            skills_required: [],
            images: [],
        });
        setEditingProject(null);
    };

    const getStatusColor = (status: OpenSourceStatus) => {
        switch (status) {
            case "active": return "bg-green-500";
            case "completed": return "bg-blue-500";
            case "on_hold": return "bg-yellow-500";
            case "archived": return "bg-gray-500";
            default: return "bg-gray-500";
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Open Source Projects</h2>
                    <p className="text-muted-foreground">
                        Manage collaborative open source projects
                    </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) resetForm();
                }}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Project
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {editingProject ? "Edit" : "Add"} Open Source Project
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Basic Information */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg">Basic Information</h3>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="title">Title *</Label>
                                        <Input
                                            id="title"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="slug">Slug (auto-generated if empty)</Label>
                                        <Input
                                            id="slug"
                                            value={formData.slug}
                                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                            placeholder={generateSlug(formData.title)}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="category">Category *</Label>
                                        <Input
                                            id="category"
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="status">Status *</Label>
                                        <Select
                                            value={formData.status}
                                            onValueChange={(value: OpenSourceStatus) =>
                                                setFormData({ ...formData, status: value })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="active">Active</SelectItem>
                                                <SelectItem value="completed">Completed</SelectItem>
                                                <SelectItem value="on_hold">On Hold</SelectItem>
                                                <SelectItem value="archived">Archived</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="github_repo_link">GitHub Repository Link *</Label>
                                        <Input
                                            id="github_repo_link"
                                            type="url"
                                            value={formData.github_repo_link}
                                            onChange={(e) => setFormData({ ...formData, github_repo_link: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="doc_link">Documentation Link</Label>
                                        <Input
                                            id="doc_link"
                                            type="url"
                                            value={formData.doc_link}
                                            onChange={(e) => setFormData({ ...formData, doc_link: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section-wise Rich Editor Content */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg">Project Details</h3>

                                <div className="space-y-2">
                                    <Label>Overview</Label>
                                    <RichTextEditor
                                        value={formData.overview}
                                        onChange={(value) => setFormData({ ...formData, overview: value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Problem Statement</Label>
                                    <RichTextEditor
                                        value={formData.problem_statement}
                                        onChange={(value) => setFormData({ ...formData, problem_statement: value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Tech Stack (comma-separated)</Label>
                                    <Input
                                        value={formData.tech_stack.join(", ")}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                tech_stack: e.target.value.split(",").map((s) => s.trim()),
                                            })
                                        }
                                        placeholder="React, Node.js, PostgreSQL"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Features</Label>
                                    <RichTextEditor
                                        value={formData.features}
                                        onChange={(value) => setFormData({ ...formData, features: value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Installation Guide</Label>
                                    <RichTextEditor
                                        value={formData.installation_guide}
                                        onChange={(value) => setFormData({ ...formData, installation_guide: value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Contribution Guidelines</Label>
                                    <RichTextEditor
                                        value={formData.contribution_guidelines}
                                        onChange={(value) => setFormData({ ...formData, contribution_guidelines: value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Roadmap</Label>
                                    <RichTextEditor
                                        value={formData.roadmap}
                                        onChange={(value) => setFormData({ ...formData, roadmap: value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Custom Contribution Instructions</Label>
                                    <Textarea
                                        value={formData.custom_contribution_instructions}
                                        onChange={(e) => setFormData({ ...formData, custom_contribution_instructions: e.target.value })}
                                        rows={4}
                                        placeholder="Any specific instructions for contributors..."
                                    />
                                </div>
                            </div>

                            {/* Skills and Images */}
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg">Additional Information</h3>

                                <div className="space-y-2">
                                    <Label>Skills Required (comma-separated)</Label>
                                    <Input
                                        value={formData.skills_required.join(", ")}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                skills_required: e.target.value.split(",").map((s) => s.trim()),
                                            })
                                        }
                                        placeholder="JavaScript, React, Git"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Project Images</Label>
                                    <ImageUpload
                                        images={formData.images}
                                        onChange={(images) => setFormData({ ...formData, images })}
                                        bucket="project-images"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setIsDialogOpen(false);
                                        resetForm();
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit">
                                    {editingProject ? "Update" : "Create"} Project
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Contributors</TableHead>
                            <TableHead>Links</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {projects.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground">
                                    No open source projects yet
                                </TableCell>
                            </TableRow>
                        ) : (
                            projects.map((project) => (
                                <TableRow key={project.id}>
                                    <TableCell className="font-medium">{project.title}</TableCell>
                                    <TableCell>{project.category}</TableCell>
                                    <TableCell>
                                        <Badge className={getStatusColor(project.status)}>
                                            {project.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <Users className="h-4 w-4" />
                                            {project.contributor_count}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <a
                                                href={project.github_repo_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-500 hover:underline"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                            </a>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEdit(project)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(project.id)}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default OpenSourceProjectsManager;
