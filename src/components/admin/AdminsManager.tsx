import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Loader2, Shield, Users, Trash2, Calendar, Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";

const adminSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
});

interface AdminUser {
  id: string;
  user_id: string;
  role: string;
  email?: string;
  name?: string;
  created_at?: string;
}

const AdminsManager = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(true);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<AdminUser | null>(null);
  const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string }>({});
  const [showUserIds, setShowUserIds] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setIsLoadingAdmins(true);
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .eq("role", "admin");

      if (error) throw error;

      setAdmins(data || []);
    } catch (error) {
      console.error("Error fetching admins:", error);
      toast({
        title: "Error",
        description: "Failed to load admins list",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAdmins(false);
    }
  };

  const maskUserId = (userId: string) => {
    if (showUserIds) return userId;
    if (userId.length <= 8) return "••••••••";
    return `${userId.slice(0, 4)}••••••••${userId.slice(-4)}`;
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = adminSchema.safeParse({ email, password, name });
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string; name?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === "email") fieldErrors.email = err.message;
        if (err.path[0] === "password") fieldErrors.password = err.message;
        if (err.path[0] === "name") fieldErrors.name = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      // Use edge function to create admin with auto-confirmed email
      const { data: sessionData } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke("create-admin", {
        body: { email, password, name },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to create admin");
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast({
        title: "Admin created successfully",
        description: `${name} (${email}) has been added as an admin and can log in immediately.`,
      });

      setEmail("");
      setPassword("");
      setName("");
      fetchAdmins();
    } catch (error: any) {
      console.error("Error creating admin:", error);
      toast({
        title: "Error creating admin",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAdmin = async () => {
    if (!adminToDelete) return;

    if (adminToDelete.user_id === user?.id) {
      toast({
        title: "Cannot delete yourself",
        description: "You cannot remove your own admin access",
        variant: "destructive",
      });
      setDeleteDialogOpen(false);
      setAdminToDelete(null);
      return;
    }

    try {
      // First delete the role
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", adminToDelete.id);

      if (error) throw error;

      // Update local state immediately for responsive UI
      setAdmins(prev => prev.filter(admin => admin.id !== adminToDelete.id));

      toast({
        title: "Admin removed",
        description: "Admin access has been revoked",
      });

      fetchAdmins();
    } catch (error: any) {
      console.error("Error deleting admin:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove admin",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setAdminToDelete(null);
    }
  };

  const confirmDelete = (admin: AdminUser) => {
    setAdminToDelete(admin);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-serif flex items-center gap-2">
          <Users className="h-6 w-6" />
          Admin Management
        </h2>
        <p className="text-muted-foreground">Create and manage admin accounts</p>
      </div>

      {/* Admins List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Current Admins
              </CardTitle>
              <CardDescription>
                All users with administrative access
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowUserIds(!showUserIds)}
              className="gap-2"
            >
              {showUserIds ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  Hide IDs
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  Show IDs
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingAdmins ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : admins.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No admins found</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Admin</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">
                            {admin.name || "Unknown"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {admin.email || "No email"}
                          </span>
                          {admin.user_id === user?.id && (
                            <Badge variant="secondary" className="w-fit">You</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs text-muted-foreground">
                          {maskUserId(admin.user_id)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {admin.created_at ? format(new Date(admin.created_at), "MMM d, yyyy") : "N/A"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => confirmDelete(admin)}
                          disabled={admin.user_id === user?.id}
                          title={admin.user_id === user?.id ? "Cannot delete yourself" : "Remove admin"}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Admin Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Create New Admin
          </CardTitle>
          <CardDescription>
            Add a new administrator who can manage projects and settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateAdmin} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="admin-name">Name *</Label>
              <Input
                id="admin-name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email *</Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">Password *</Label>
              <Input
                id="admin-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              The new admin will be able to log in immediately after creation.
            </p>
            <Button type="submit" disabled={isLoading} className="gap-2">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4" />
                  Create Admin
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Admin Access?</AlertDialogTitle>
            <AlertDialogDescription>
              This will revoke admin privileges for this user. They will no longer be able to access the admin dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAdmin} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove Admin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminsManager;