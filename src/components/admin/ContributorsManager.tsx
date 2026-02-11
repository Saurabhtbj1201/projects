import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { OpenSourceProject, Contributor, PRRequest, ContributorStatus } from "@/types/project";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { Loader2, CheckCircle, XCircle, Eye, Users, Clock, ExternalLink, Github } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ContributorsManager = () => {
    const [projects, setProjects] = useState<OpenSourceProject[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>("");
    const [prRequests, setPrRequests] = useState<PRRequest[]>([]);
    const [contributors, setContributors] = useState<Contributor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<PRRequest | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [adminNotes, setAdminNotes] = useState("");
    const { toast } = useToast();

    useEffect(() => {
        fetchProjects();
    }, []);

    useEffect(() => {
        if (selectedProjectId) {
            fetchProjectData();
        }
    }, [selectedProjectId]);

    const fetchProjects = async () => {
        try {
            const { data, error } = await supabase
                .from("open_source_projects")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            const projectsData = (data as any) || [];
            setProjects(projectsData);
            if (projectsData.length > 0) {
                setSelectedProjectId(projectsData[0].id);
            }
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

    const fetchProjectData = async () => {
        setIsLoadingData(true);
        try {
            const [prRes, contribRes] = await Promise.all([
                supabase
                    .from("pr_requests")
                    .select("*")
                    .eq("project_id", selectedProjectId)
                    .order("created_at", { ascending: false }),
                supabase
                    .from("contributors")
                    .select("*")
                    .eq("project_id", selectedProjectId)
                    .order("created_at", { ascending: false }),
            ]);

            setPrRequests(((prRes.data as any) || []) as PRRequest[]);
            setContributors(((contribRes.data as any) || []) as Contributor[]);
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsLoadingData(false);
        }
    };

    const handleApprove = async (request: PRRequest) => {
        try {
            // 1. Insert into contributors table
            const { error: contribError } = await (supabase
                .from("contributors") as any)
                .insert([{
                    project_id: request.project_id,
                    name: request.name,
                    email: request.email,
                    professional_type: request.professional_type,
                    github_profile: request.github_profile,
                    linkedin_profile: request.linkedin_profile,
                    portfolio_url: request.portfolio_url,
                    improvement_description: request.improvement_description,
                    importance_reason: request.importance_reason,
                    implementation_plan: request.implementation_plan,
                    has_opensource_experience: request.has_opensource_experience,
                    previous_contributions: request.previous_contributions,
                    status: "approved",
                    admin_notes: adminNotes || null,
                }]);

            if (contribError) throw contribError;

            // 2. Update PR request status
            const { error: prError } = await (supabase
                .from("pr_requests") as any)
                .update({ status: "approved" })
                .eq("id", request.id);

            if (prError) throw prError;

            // 3. Update contributor count on the project
            const { error: countError } = await (supabase
                .from("open_source_projects") as any)
                .update({ contributor_count: contributors.filter(c => c.status === "approved").length + 1 })
                .eq("id", selectedProjectId);

            if (countError) throw countError;

            toast({
                title: "Approved!",
                description: `${request.name} has been approved as a contributor.`,
            });

            setIsDetailOpen(false);
            setAdminNotes("");
            fetchProjectData();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    const handleReject = async (request: PRRequest) => {
        try {
            const { error } = await (supabase
                .from("pr_requests") as any)
                .update({ status: "rejected" })
                .eq("id", request.id);

            if (error) throw error;

            toast({
                title: "Rejected",
                description: `${request.name}'s contribution request has been rejected.`,
            });

            setIsDetailOpen(false);
            setAdminNotes("");
            fetchProjectData();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    const handleRemoveContributor = async (contributor: Contributor) => {
        try {
            const { error } = await (supabase
                .from("contributors") as any)
                .update({ status: "rejected" })
                .eq("id", contributor.id);

            if (error) throw error;

            // Update contributor count
            await (supabase
                .from("open_source_projects") as any)
                .update({ contributor_count: contributors.filter(c => c.status === "approved" && c.id !== contributor.id).length })
                .eq("id", selectedProjectId);

            toast({
                title: "Removed",
                description: `${contributor.name} has been removed from contributors.`,
            });

            fetchProjectData();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    const getGitHubAvatar = (githubProfile: string) => {
        try {
            const url = new URL(githubProfile);
            const username = url.pathname.replace(/^\//, "").split("/")[0];
            return `https://avatars.githubusercontent.com/${username}`;
        } catch {
            return null;
        }
    };

    const getGitHubUsername = (githubProfile: string) => {
        try {
            const url = new URL(githubProfile);
            return url.pathname.replace(/^\//, "").split("/")[0];
        } catch {
            return githubProfile;
        }
    };

    const getStatusBadge = (status: ContributorStatus) => {
        switch (status) {
            case "pending":
                return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
            case "approved":
                return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle className="h-3 w-3 mr-1" /> Approved</Badge>;
            case "rejected":
                return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const selectedProject = projects.find(p => p.id === selectedProjectId);
    const pendingRequests = prRequests.filter(r => r.status === "pending");
    const approvedContributors = contributors.filter(c => c.status === "approved");

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (projects.length === 0) {
        return (
            <div className="text-center py-20">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">No Projects Found</h3>
                <p className="text-sm text-muted-foreground mt-1">Create an Open Source project first to manage contributors.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold">Contributors Management</h2>
                <p className="text-muted-foreground mt-1">
                    Review contribution requests and manage approved contributors.
                </p>
            </div>

            {/* Project Selector */}
            <div className="flex items-center gap-4">
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                    <SelectTrigger className="max-w-md">
                        <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                        {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                                {project.title}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Approved Contributors - Grouped Avatars */}
            {selectedProject && (
                <div className="rounded-lg border bg-card p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Approved Contributors ({approvedContributors.length})
                    </h3>
                    {approvedContributors.length > 0 ? (
                        <div className="flex items-center gap-4">
                            <div className="flex -space-x-3">
                                {approvedContributors.map((contributor) => {
                                    const avatarUrl = getGitHubAvatar(contributor.github_profile);
                                    return (
                                        <Avatar
                                            key={contributor.id}
                                            className="h-10 w-10 ring-2 ring-background cursor-pointer hover:ring-primary transition-all hover:scale-110 hover:z-10"
                                            title={contributor.name}
                                        >
                                            {avatarUrl && <AvatarImage src={avatarUrl} alt={contributor.name} />}
                                            <AvatarFallback className="text-sm bg-primary/10 text-primary font-semibold">
                                                {contributor.name.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    );
                                })}
                            </div>
                            <span className="text-sm text-muted-foreground">
                                {approvedContributors.map(c => c.name).join(", ")}
                            </span>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">No approved contributors yet.</p>
                    )}
                </div>
            )}

            {/* Tabs */}
            <Tabs defaultValue="pending" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="pending" className="gap-2">
                        <Clock className="h-4 w-4" />
                        Pending Requests
                        {pendingRequests.length > 0 && (
                            <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full">
                                {pendingRequests.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="all" className="gap-2">
                        All Requests
                    </TabsTrigger>
                    <TabsTrigger value="contributors" className="gap-2">
                        <Users className="h-4 w-4" />
                        Contributors
                    </TabsTrigger>
                </TabsList>

                {isLoadingData ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <>
                        {/* Pending Requests Tab */}
                        <TabsContent value="pending">
                            {pendingRequests.length === 0 ? (
                                <div className="text-center py-12 rounded-lg border bg-card">
                                    <CheckCircle className="h-10 w-10 mx-auto text-green-500 mb-3" />
                                    <p className="text-muted-foreground">No pending requests. All caught up!</p>
                                </div>
                            ) : (
                                <div className="rounded-lg border bg-card overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Contributor</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>GitHub</TableHead>
                                                <TableHead>Experience</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {pendingRequests.map((request) => {
                                                const avatarUrl = getGitHubAvatar(request.github_profile);
                                                return (
                                                    <TableRow key={request.id}>
                                                        <TableCell>
                                                            <div className="flex items-center gap-3">
                                                                <Avatar className="h-8 w-8">
                                                                    {avatarUrl && <AvatarImage src={avatarUrl} alt={request.name} />}
                                                                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                                                        {request.name.charAt(0).toUpperCase()}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div>
                                                                    <p className="font-medium">{request.name}</p>
                                                                    <p className="text-xs text-muted-foreground">{request.email}</p>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className="capitalize">{request.professional_type}</Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <a
                                                                href={request.github_profile}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-primary hover:underline flex items-center gap-1 text-sm"
                                                            >
                                                                <Github className="h-3 w-3" />
                                                                {getGitHubUsername(request.github_profile)}
                                                            </a>
                                                        </TableCell>
                                                        <TableCell>
                                                            {request.has_opensource_experience ? (
                                                                <Badge className="bg-green-100 text-green-700 hover:bg-green-200">Yes</Badge>
                                                            ) : (
                                                                <Badge variant="outline">No</Badge>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-sm text-muted-foreground">
                                                            {new Date(request.created_at).toLocaleDateString()}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex items-center gap-2 justify-end">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => {
                                                                        setSelectedRequest(request);
                                                                        setIsDetailOpen(true);
                                                                    }}
                                                                >
                                                                    <Eye className="h-3 w-3 mr-1" /> View
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    className="bg-green-500 hover:bg-green-600"
                                                                    onClick={() => handleApprove(request)}
                                                                >
                                                                    <CheckCircle className="h-3 w-3 mr-1" /> Approve
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="destructive"
                                                                    onClick={() => handleReject(request)}
                                                                >
                                                                    <XCircle className="h-3 w-3 mr-1" /> Reject
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </TabsContent>

                        {/* All Requests Tab */}
                        <TabsContent value="all">
                            {prRequests.length === 0 ? (
                                <div className="text-center py-12 rounded-lg border bg-card">
                                    <p className="text-muted-foreground">No contribution requests yet.</p>
                                </div>
                            ) : (
                                <div className="rounded-lg border bg-card overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Contributor</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>GitHub</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {prRequests.map((request) => {
                                                const avatarUrl = getGitHubAvatar(request.github_profile);
                                                return (
                                                    <TableRow key={request.id}>
                                                        <TableCell>
                                                            <div className="flex items-center gap-3">
                                                                <Avatar className="h-8 w-8">
                                                                    {avatarUrl && <AvatarImage src={avatarUrl} alt={request.name} />}
                                                                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                                                        {request.name.charAt(0).toUpperCase()}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div>
                                                                    <p className="font-medium">{request.name}</p>
                                                                    <p className="text-xs text-muted-foreground">{request.email}</p>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className="capitalize">{request.professional_type}</Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <a
                                                                href={request.github_profile}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-primary hover:underline flex items-center gap-1 text-sm"
                                                            >
                                                                <Github className="h-3 w-3" />
                                                                {getGitHubUsername(request.github_profile)}
                                                            </a>
                                                        </TableCell>
                                                        <TableCell>
                                                            {getStatusBadge(request.status)}
                                                        </TableCell>
                                                        <TableCell className="text-sm text-muted-foreground">
                                                            {new Date(request.created_at).toLocaleDateString()}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => {
                                                                    setSelectedRequest(request);
                                                                    setIsDetailOpen(true);
                                                                }}
                                                            >
                                                                <Eye className="h-3 w-3 mr-1" /> View
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </TabsContent>

                        {/* Contributors Tab */}
                        <TabsContent value="contributors">
                            {approvedContributors.length === 0 ? (
                                <div className="text-center py-12 rounded-lg border bg-card">
                                    <Users className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                                    <p className="text-muted-foreground">No approved contributors yet.</p>
                                </div>
                            ) : (
                                <div className="rounded-lg border bg-card overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Contributor</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>GitHub</TableHead>
                                                <TableHead>LinkedIn</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {approvedContributors.map((contributor) => {
                                                const avatarUrl = getGitHubAvatar(contributor.github_profile);
                                                return (
                                                    <TableRow key={contributor.id}>
                                                        <TableCell>
                                                            <div className="flex items-center gap-3">
                                                                <Avatar className="h-8 w-8">
                                                                    {avatarUrl && <AvatarImage src={avatarUrl} alt={contributor.name} />}
                                                                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                                                        {contributor.name.charAt(0).toUpperCase()}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div>
                                                                    <p className="font-medium">{contributor.name}</p>
                                                                    <p className="text-xs text-muted-foreground">{contributor.email}</p>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className="capitalize">{contributor.professional_type}</Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <a
                                                                href={contributor.github_profile}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-primary hover:underline flex items-center gap-1 text-sm"
                                                            >
                                                                <Github className="h-3 w-3" />
                                                                {getGitHubUsername(contributor.github_profile)}
                                                            </a>
                                                        </TableCell>
                                                        <TableCell>
                                                            {contributor.linkedin_profile ? (
                                                                <a
                                                                    href={contributor.linkedin_profile}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-primary hover:underline flex items-center gap-1 text-sm"
                                                                >
                                                                    <ExternalLink className="h-3 w-3" /> LinkedIn
                                                                </a>
                                                            ) : (
                                                                <span className="text-muted-foreground text-sm">—</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {getStatusBadge(contributor.status)}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={() => handleRemoveContributor(contributor)}
                                                            >
                                                                <XCircle className="h-3 w-3 mr-1" /> Remove
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </TabsContent>
                    </>
                )}
            </Tabs>

            {/* Detail Dialog */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Contribution Request Details</DialogTitle>
                    </DialogHeader>
                    {selectedRequest && (
                        <div className="space-y-6">
                            {/* Profile Section */}
                            <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                                <Avatar className="h-14 w-14">
                                    {getGitHubAvatar(selectedRequest.github_profile) && (
                                        <AvatarImage
                                            src={getGitHubAvatar(selectedRequest.github_profile)!}
                                            alt={selectedRequest.name}
                                        />
                                    )}
                                    <AvatarFallback className="text-lg bg-primary/10 text-primary">
                                        {selectedRequest.name.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold">{selectedRequest.name}</h3>
                                    <p className="text-sm text-muted-foreground">{selectedRequest.email}</p>
                                    <div className="flex items-center gap-3 mt-2">
                                        <Badge variant="outline" className="capitalize">{selectedRequest.professional_type}</Badge>
                                        {getStatusBadge(selectedRequest.status)}
                                    </div>
                                </div>
                            </div>

                            {/* Links */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <a
                                    href={selectedRequest.github_profile}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors text-sm"
                                >
                                    <Github className="h-4 w-4 text-primary" />
                                    GitHub Profile
                                    <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
                                </a>
                                {selectedRequest.linkedin_profile && (
                                    <a
                                        href={selectedRequest.linkedin_profile}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors text-sm"
                                    >
                                        LinkedIn
                                        <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
                                    </a>
                                )}
                                {selectedRequest.portfolio_url && (
                                    <a
                                        href={selectedRequest.portfolio_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors text-sm"
                                    >
                                        Portfolio
                                        <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground" />
                                    </a>
                                )}
                            </div>

                            {/* Contribution Details */}
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-semibold mb-1">What they want to improve:</h4>
                                    <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                                        {selectedRequest.improvement_description}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold mb-1">Why it's important:</h4>
                                    <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                                        {selectedRequest.importance_reason}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold mb-1">Implementation plan:</h4>
                                    <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                                        {selectedRequest.implementation_plan}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-semibold">Open source experience:</h4>
                                    {selectedRequest.has_opensource_experience ? (
                                        <Badge className="bg-green-100 text-green-700">Yes</Badge>
                                    ) : (
                                        <Badge variant="outline">No</Badge>
                                    )}
                                </div>
                                {selectedRequest.previous_contributions && (
                                    <div>
                                        <h4 className="text-sm font-semibold mb-1">Previous contributions:</h4>
                                        <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                                            {selectedRequest.previous_contributions}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Admin Notes */}
                            {selectedRequest.status === "pending" && (
                                <div>
                                    <h4 className="text-sm font-semibold mb-2">Admin Notes (optional):</h4>
                                    <Textarea
                                        value={adminNotes}
                                        onChange={(e) => setAdminNotes(e.target.value)}
                                        placeholder="Add notes about this contributor..."
                                        rows={3}
                                    />
                                </div>
                            )}

                            {/* Action Buttons */}
                            {selectedRequest.status === "pending" && (
                                <div className="flex gap-3 pt-2">
                                    <Button
                                        className="flex-1 bg-green-500 hover:bg-green-600"
                                        onClick={() => handleApprove(selectedRequest)}
                                    >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Approve & Add to Contributors
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        className="flex-1"
                                        onClick={() => handleReject(selectedRequest)}
                                    >
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Reject
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ContributorsManager;
