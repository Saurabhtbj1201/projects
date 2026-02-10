import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Project, ProjectStatus } from "@/types/project";
import { format } from "date-fns";
import { Plus, Edit, Trash2, Loader2, FolderKanban, ExternalLink, Github, Calendar } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import CategorySelect from "./CategorySelect";
import StarRatingInput from "./StarRatingInput";
import RichTextEditor from "./RichTextEditor";
import ImageUpload from "./ImageUpload";

interface ProjectsManagerProps {
  projects: Project[];
  onRefresh: () => void;
}

const ProjectsManager = ({ projects, onRefresh }: ProjectsManagerProps) => {
  const { toast } = useToast();
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Get unique categories from existing projects
  const existingCategories = [...new Set(projects.map((p) => p.category).filter(Boolean))];

  const [formData, setFormData] = useState({
    name: "",
    status: "in_progress" as ProjectStatus,
    date: new Date(),
    description: "",
    live_link: "",
    github_link: "",
    stars_rating: 0,
    tech_stack: "",
    category: "",
    images: [] as string[],
    image_descriptions: [] as string[],
  });

  const resetForm = () => {
    setFormData({
      name: "",
      status: "in_progress",
      date: new Date(),
      description: "",
      live_link: "",
      github_link: "",
      stars_rating: 0,
      tech_stack: "",
      category: "",
      images: [],
      image_descriptions: [],
    });
    setEditingProject(null);
  };

  const openEditDialog = (project: Project) => {
    // Cast to include image_descriptions
    const projectWithDescriptions = project as Project & { image_descriptions?: string[] };
    setEditingProject(project);
    setFormData({
      name: project.name,
      status: project.status,
      date: new Date(project.date),
      description: project.description,
      live_link: project.live_link || "",
      github_link: project.github_link || "",
      stars_rating: project.stars_rating || 0,
      tech_stack: project.tech_stack.join(", "),
      category: project.category,
      images: project.images || [],
      image_descriptions: projectWithDescriptions.image_descriptions || [],
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const projectData = {
        name: formData.name.trim(),
        status: formData.status,
        date: format(formData.date, "yyyy-MM-dd"),
        description: formData.description.trim(),
        live_link: formData.live_link.trim() || null,
        github_link: formData.github_link.trim() || null,
        stars_rating: formData.stars_rating,
        tech_stack: formData.tech_stack.split(",").map((t) => t.trim()).filter(Boolean),
        category: formData.category.trim(),
        images: formData.images,
        image_descriptions: formData.image_descriptions,
      };

      if (editingProject) {
        const { error } = await supabase
          .from("projects")
          .update(projectData)
          .eq("id", editingProject.id);

        if (error) throw error;

        toast({ title: "Project updated successfully" });
      } else {
        const { error } = await supabase.from("projects").insert(projectData);

        if (error) throw error;

        toast({ title: "Project created successfully" });
      }

      setIsDialogOpen(false);
      resetForm();
      onRefresh();
    } catch (error) {
      console.error("Error saving project:", error);
      toast({
        title: "Error",
        description: "Failed to save project",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      const { error } = await supabase.from("projects").delete().eq("id", projectId);

      if (error) throw error;

      toast({ title: "Project deleted successfully" });
      onRefresh();
    } catch (error) {
      console.error("Error deleting project:", error);
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-600 border-green-500/30";
      case "in_progress":
        return "bg-amber-500/10 text-amber-600 border-amber-500/30";
      case "planned":
        return "bg-blue-500/10 text-blue-600 border-blue-500/30";
      default:
        return "";
    }
  };

  const getDateLabel = () => {
    switch (formData.status) {
      case "completed":
        return "Completion Date";
      case "in_progress":
        return "Start Date";
      case "planned":
        return "Planned Date";
      default:
        return "Date";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-serif flex items-center gap-2">
            <FolderKanban className="h-6 w-6" />
            Projects
          </h2>
          <p className="text-muted-foreground">Manage your portfolio projects</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="rounded-full gap-2">
              <Plus className="h-4 w-4" />
              Add Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProject ? "Edit Project" : "Add New Project"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {/* Project Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Project Title *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter project title"
                  required
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label>Category *</Label>
                <CategorySelect
                  value={formData.category}
                  onChange={(value) => setFormData({ ...formData, category: value })}
                  categories={existingCategories}
                />
              </div>

              {/* Status & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: ProjectStatus) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="planned">Planned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{getDateLabel()}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.date && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {formData.date ? format(formData.date, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={formData.date}
                        onSelect={(date) => date && setFormData({ ...formData, date })}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Description - Rich Editor */}
              <div className="space-y-2">
                <Label>Description *</Label>
                <RichTextEditor
                  value={formData.description}
                  onChange={(value) => setFormData({ ...formData, description: value })}
                  placeholder="Describe your project..."
                />
              </div>

              {/* Links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="live_link">Live Link</Label>
                  <Input
                    id="live_link"
                    type="url"
                    value={formData.live_link}
                    onChange={(e) => setFormData({ ...formData, live_link: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="github_link">GitHub Link</Label>
                  <Input
                    id="github_link"
                    type="url"
                    value={formData.github_link}
                    onChange={(e) => setFormData({ ...formData, github_link: e.target.value })}
                    placeholder="https://github.com/..."
                  />
                </div>
              </div>

              {/* Stars Rating */}
              <div className="space-y-2">
                <Label>Stars Rating</Label>
                <StarRatingInput
                  value={formData.stars_rating}
                  onChange={(rating) => setFormData({ ...formData, stars_rating: rating })}
                />
              </div>

              {/* Tech Stack */}
              <div className="space-y-2">
                <Label htmlFor="tech_stack">Tech Stack (comma-separated)</Label>
                <Input
                  id="tech_stack"
                  value={formData.tech_stack}
                  onChange={(e) => setFormData({ ...formData, tech_stack: e.target.value })}
                  placeholder="React, Node.js, MongoDB, TypeScript"
                />
              </div>

              {/* Image Upload with Descriptions */}
              <div className="space-y-2">
                <Label>Project Images</Label>
                <ImageUpload
                  images={formData.images}
                  onChange={(newImages) => setFormData((prev) => ({ ...prev, images: newImages }))}
                  bucket="project-images"
                  maxWidth={1200}
                  maxHeight={800}
                  aspectRatio={16 / 9}
                  maxSizeKB={500}
                  descriptions={formData.image_descriptions}
                  onDescriptionsChange={(newDescriptions) => setFormData((prev) => ({ ...prev, image_descriptions: newDescriptions }))}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving || !formData.name || !formData.category}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    editingProject ? "Update Project" : "Create Project"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No projects yet</h3>
            <p className="text-muted-foreground text-sm">Click "Add Project" to create your first one.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {projects.map((project) => (
            <Card key={project.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-center gap-4 p-4">
                  {project.images[0] ? (
                    <img
                      src={project.images[0]}
                      alt={project.name}
                      className="w-20 h-14 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-14 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <FolderKanban className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{project.name}</h3>
                      <Badge variant="outline" className={getStatusColor(project.status)}>
                        {project.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Badge variant="secondary" className="text-xs">
                        {project.category}
                      </Badge>
                      <span>{format(new Date(project.date), "MMM yyyy")}</span>
                      {project.live_link && (
                        <a
                          href={project.live_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:text-foreground"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Live
                        </a>
                      )}
                      {project.github_link && (
                        <a
                          href={project.github_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:text-foreground"
                        >
                          <Github className="h-3 w-3" />
                          GitHub
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(project)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(project.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectsManager;
