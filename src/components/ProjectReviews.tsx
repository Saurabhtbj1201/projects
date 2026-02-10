import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Star, Loader2, MessageSquare, Send, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { z } from "zod";

interface Review {
  id: string;
  name: string;
  rating: number;
  review: string | null;
  created_at: string;
}

interface ProjectReviewsProps {
  projectId: string;
}

const reviewSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  rating: z.number().min(1, "Please select a rating").max(5),
  review: z.string().trim().max(1000, "Review must be less than 1000 characters").optional(),
});

const ProjectReviews = ({ projectId }: ProjectReviewsProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState("");
  const [errors, setErrors] = useState<{ name?: string; rating?: string; review?: string }>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchReviews();
  }, [projectId]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = reviewSchema.safeParse({ name, rating, review: review || undefined });
    if (!result.success) {
      const fieldErrors: { name?: string; rating?: string; review?: string } = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        fieldErrors[field as keyof typeof fieldErrors] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("reviews").insert({
        project_id: projectId,
        name: name.trim(),
        rating,
        review: review.trim() || null,
      });

      if (error) throw error;

      toast({
        title: "Review submitted!",
        description: "Thank you for your feedback.",
      });

      setName("");
      setRating(0);
      setReview("");
      setIsFormOpen(false);
      fetchReviews();
    } catch (error) {
      console.error("Error submitting review:", error);
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Reviews Summary */}
      <div className="flex items-center gap-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Reviews ({reviews.length})
        </h3>
        {reviews.length > 0 && (
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
            <span className="font-medium">{averageRating.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Submit Review Form - Collapsible */}
      <Collapsible open={isFormOpen} onOpenChange={setIsFormOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between gap-2">
            <span className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Leave a Review
            </span>
            <ChevronDown className={cn("h-4 w-4 transition-transform", isFormOpen && "rotate-180")} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card className="mt-4">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Write Your Review</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reviewer-name">Name *</Label>
                  <Input
                    id="reviewer-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    disabled={isSubmitting}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Rating *</Label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm p-0.5"
                        disabled={isSubmitting}
                      >
                        <Star
                          className={cn(
                            "h-6 w-6 cursor-pointer transition-colors",
                            star <= (hoverRating || rating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground hover:text-yellow-400"
                          )}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-sm text-muted-foreground">
                      {rating > 0 ? `${rating} star${rating > 1 ? "s" : ""}` : "Select rating"}
                    </span>
                  </div>
                  {errors.rating && (
                    <p className="text-sm text-destructive">{errors.rating}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="review-text">Review (optional)</Label>
                  <Textarea
                    id="review-text"
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    placeholder="Share your thoughts about this project..."
                    rows={3}
                    disabled={isSubmitting}
                  />
                  {errors.review && (
                    <p className="text-sm text-destructive">{errors.review}</p>
                  )}
                </div>

                <Button type="submit" disabled={isSubmitting} className="gap-2">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Submit Review
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Reviews List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          No reviews yet. Be the first to leave a review!
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <Card key={r.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{r.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(r.created_at), "MMM d, yyyy")}
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={cn(
                            "h-4 w-4",
                            star <= r.rating
                              ? "fill-yellow-500 text-yellow-500"
                              : "text-muted-foreground"
                          )}
                        />
                      ))}
                    </div>
                    {r.review && (
                      <p className="text-sm text-muted-foreground">{r.review}</p>
                    )}
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

export default ProjectReviews;
