import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Mail, Phone, Calendar, Trash2, MessageSquare, Loader2, Eye, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  purpose: string;
  created_at: string;
  reviewed: boolean;
  reviewed_at: string | null;
}

const ContactsManager = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewingContact, setViewingContact] = useState<Contact | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("form_submissions")
        .select("*")
        .eq("source", "contact")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      toast({
        title: "Error",
        description: "Failed to load contacts",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleReviewed = async (contact: Contact) => {
    setIsUpdating(contact.id);

    try {
      const newReviewedStatus = !contact.reviewed;
      const { error } = await supabase
        .from("form_submissions")
        .update({
          reviewed: newReviewedStatus,
          reviewed_at: newReviewedStatus ? new Date().toISOString() : null,
        })
        .eq("id", contact.id);

      if (error) throw error;

      setContacts((prev) =>
        prev.map((c) =>
          c.id === contact.id
            ? { ...c, reviewed: newReviewedStatus, reviewed_at: newReviewedStatus ? new Date().toISOString() : null }
            : c
        )
      );

      toast({
        title: newReviewedStatus ? "Marked as reviewed" : "Marked as pending",
      });
    } catch (error: any) {
      console.error("Error updating contact:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update contact",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(null);
    }
  };

  const handleDelete = async (contactId: string) => {
    if (!confirm("Are you sure you want to delete this contact?")) return;

    setIsDeleting(contactId);
    try {
      const { error } = await supabase.from("form_submissions").delete().eq("id", contactId);

      if (error) throw error;

      setContacts((prev) => prev.filter((c) => c.id !== contactId));
      toast({ title: "Contact deleted successfully" });
    } catch (error) {
      console.error("Error deleting contact:", error);
      toast({
        title: "Error",
        description: "Failed to delete contact",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const pendingCount = contacts.filter((c) => !c.reviewed).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-serif flex items-center gap-2">
          <MessageSquare className="h-6 w-6" />
          Contacts
          {pendingCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {pendingCount} pending
            </Badge>
          )}
        </h2>
        <p className="text-muted-foreground">Manage contact form submissions from the About page</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {contacts.length} Contact{contacts.length !== 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : contacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Mail className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No contacts yet</h3>
              <p className="text-muted-foreground text-sm">When visitors submit the contact form, they'll appear here.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((contact) => (
                    <TableRow key={contact.id} className={cn(!contact.reviewed && "bg-muted/30")}>
                      <TableCell>
                        <Badge
                          variant={contact.reviewed ? "secondary" : "default"}
                          className={cn(
                            contact.reviewed
                              ? "bg-green-500/10 text-green-600 border-green-500/30"
                              : "bg-amber-500/10 text-amber-600 border-amber-500/30"
                          )}
                        >
                          {contact.reviewed ? "Reviewed" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{contact.name}</TableCell>
                      <TableCell>
                        <a
                          href={`mailto:${contact.email}`}
                          className="text-primary hover:underline"
                        >
                          {contact.email}
                        </a>
                      </TableCell>
                      <TableCell>
                        {contact.phone ? (
                          <a href={`tel:${contact.phone}`} className="hover:underline">
                            {contact.phone}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(contact.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setViewingContact(contact)}
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleReviewed(contact)}
                            disabled={isUpdating === contact.id}
                            title={contact.reviewed ? "Mark as pending" : "Mark as reviewed"}
                          >
                            {isUpdating === contact.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : contact.reviewed ? (
                              <X className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Check className="h-4 w-4 text-green-600" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(contact.id)}
                            disabled={isDeleting === contact.id}
                            title="Delete contact"
                          >
                            {isDeleting === contact.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-destructive" />
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

      {/* View Contact Dialog */}
      <Dialog open={!!viewingContact} onOpenChange={() => setViewingContact(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Contact Details</DialogTitle>
          </DialogHeader>
          {viewingContact && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Name</p>
                  <p className="font-medium">{viewingContact.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <a href={`mailto:${viewingContact.email}`} className="text-primary hover:underline">
                    {viewingContact.email}
                  </a>
                </div>
                {viewingContact.phone && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Phone</p>
                    <a href={`tel:${viewingContact.phone}`} className="hover:underline">
                      {viewingContact.phone}
                    </a>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Submitted</p>
                  <p>{format(new Date(viewingContact.created_at), "PPP 'at' p")}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Message</p>
                <div className="p-4 rounded-lg bg-muted/50 whitespace-pre-wrap">
                  {viewingContact.message}
                </div>
              </div>
              <div className="flex justify-between items-center pt-4 border-t">
                <Badge
                  variant={viewingContact.reviewed ? "secondary" : "default"}
                  className={cn(
                    viewingContact.reviewed
                      ? "bg-green-500/10 text-green-600"
                      : "bg-amber-500/10 text-amber-600"
                  )}
                >
                  {viewingContact.reviewed ? "Reviewed" : "Pending Review"}
                </Badge>
                <Button
                  onClick={() => handleToggleReviewed(viewingContact)}
                  disabled={isUpdating === viewingContact.id}
                  variant={viewingContact.reviewed ? "outline" : "default"}
                >
                  {isUpdating === viewingContact.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : viewingContact.reviewed ? (
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

export default ContactsManager;
