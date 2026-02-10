import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Mail, Check, Loader2, Filter, Eye, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Enquiry {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  purpose: string;
  created_at: string;
  project_id: string | null;
  reviewed: boolean;
  reviewed_at: string | null;
  projects?: { name: string } | null;
}

const EnquiriesManager = () => {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [viewingEnquiry, setViewingEnquiry] = useState<Enquiry | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [enquiriesRes, projectsRes] = await Promise.all([
        supabase
          .from("form_submissions")
          .select("*, projects(name)")
          .eq("source", "enquiry")
          .order("created_at", { ascending: false }),
        supabase.from("projects").select("id, name").order("name"),
      ]);

      if (enquiriesRes.error) throw enquiriesRes.error;
      if (projectsRes.error) throw projectsRes.error;

      setEnquiries(enquiriesRes.data || []);
      setProjects(projectsRes.data || []);
    } catch (error) {
      console.error("Error fetching enquiries:", error);
      toast({
        title: "Error",
        description: "Failed to load enquiries",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEnquiries = enquiries.filter((e) => {
    const matchesProject = selectedProject === "all" || e.project_id === selectedProject;
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "reviewed" && e.reviewed) ||
      (filterStatus === "pending" && !e.reviewed);
    return matchesProject && matchesStatus;
  });

  const handleToggleReviewed = async (enquiry: Enquiry) => {
    setIsUpdating(enquiry.id);

    try {
      const newReviewedStatus = !enquiry.reviewed;
      const { error } = await supabase
        .from("form_submissions")
        .update({
          reviewed: newReviewedStatus,
          reviewed_at: newReviewedStatus ? new Date().toISOString() : null,
        })
        .eq("id", enquiry.id);

      if (error) throw error;

      setEnquiries((prev) =>
        prev.map((e) =>
          e.id === enquiry.id
            ? { ...e, reviewed: newReviewedStatus, reviewed_at: newReviewedStatus ? new Date().toISOString() : null }
            : e
        )
      );

      toast({
        title: newReviewedStatus ? "Marked as reviewed" : "Marked as pending",
      });
    } catch (error: any) {
      console.error("Error updating enquiry:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update enquiry",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(null);
    }
  };

  const pendingCount = enquiries.filter((e) => !e.reviewed).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold font-serif flex items-center gap-2">
            <Mail className="h-6 w-6" />
            Enquiries
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingCount} pending
              </Badge>
            )}
          </h2>
          <p className="text-muted-foreground">Manage enquiries from project detail pages</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {filteredEnquiries.length} Enquir{filteredEnquiries.length !== 1 ? "ies" : "y"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredEnquiries.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No enquiries found</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEnquiries.map((enquiry) => (
                    <TableRow key={enquiry.id} className={cn(!enquiry.reviewed && "bg-muted/30")}>
                      <TableCell>
                        <Badge
                          variant={enquiry.reviewed ? "secondary" : "default"}
                          className={cn(
                            enquiry.reviewed
                              ? "bg-green-500/10 text-green-600 border-green-500/30"
                              : "bg-amber-500/10 text-amber-600 border-amber-500/30"
                          )}
                        >
                          {enquiry.reviewed ? "Reviewed" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {enquiry.projects?.name || "General"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{enquiry.name}</TableCell>
                      <TableCell>
                        <a
                          href={`mailto:${enquiry.email}`}
                          className="text-primary hover:underline"
                        >
                          {enquiry.email}
                        </a>
                      </TableCell>
                      <TableCell className="capitalize">{enquiry.purpose.replace("_", " ")}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(enquiry.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setViewingEnquiry(enquiry)}
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleReviewed(enquiry)}
                            disabled={isUpdating === enquiry.id}
                            title={enquiry.reviewed ? "Mark as pending" : "Mark as reviewed"}
                          >
                            {isUpdating === enquiry.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : enquiry.reviewed ? (
                              <X className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Check className="h-4 w-4 text-green-600" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Enquiry Dialog */}
      <Dialog open={!!viewingEnquiry} onOpenChange={() => setViewingEnquiry(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Enquiry Details</DialogTitle>
          </DialogHeader>
          {viewingEnquiry && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Name</p>
                  <p className="font-medium">{viewingEnquiry.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <a href={`mailto:${viewingEnquiry.email}`} className="text-primary hover:underline">
                    {viewingEnquiry.email}
                  </a>
                </div>
                {viewingEnquiry.phone && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Phone</p>
                    <p>{viewingEnquiry.phone}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Purpose</p>
                  <p className="capitalize">{viewingEnquiry.purpose.replace("_", " ")}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Project</p>
                  <p>{viewingEnquiry.projects?.name || "General Enquiry"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Submitted</p>
                  <p>{format(new Date(viewingEnquiry.created_at), "PPP 'at' p")}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Message</p>
                <div className="p-4 rounded-lg bg-muted/50 whitespace-pre-wrap">
                  {viewingEnquiry.message}
                </div>
              </div>
              <div className="flex justify-between items-center pt-4 border-t">
                <Badge
                  variant={viewingEnquiry.reviewed ? "secondary" : "default"}
                  className={cn(
                    viewingEnquiry.reviewed
                      ? "bg-green-500/10 text-green-600"
                      : "bg-amber-500/10 text-amber-600"
                  )}
                >
                  {viewingEnquiry.reviewed ? "Reviewed" : "Pending Review"}
                </Badge>
                <Button
                  onClick={() => handleToggleReviewed(viewingEnquiry)}
                  disabled={isUpdating === viewingEnquiry.id}
                  variant={viewingEnquiry.reviewed ? "outline" : "default"}
                >
                  {isUpdating === viewingEnquiry.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : viewingEnquiry.reviewed ? (
                    "Mark as Pending"
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Mark as Reviewed
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnquiriesManager;
