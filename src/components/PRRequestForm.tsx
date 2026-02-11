import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProfessionalType } from "@/types/project";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface PRRequestFormProps {
    projectId: string;
    projectTitle: string;
    onClose: () => void;
}

const PRRequestForm = ({ projectId, projectTitle, onClose }: PRRequestFormProps) => {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        professional_type: "" as ProfessionalType,
        github_profile: "",
        linkedin_profile: "",
        portfolio_url: "",
        improvement_description: "",
        importance_reason: "",
        implementation_plan: "",
        has_opensource_experience: false,
        previous_contributions: "",
        declaration_accepted: false,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.declaration_accepted) {
            toast({
                title: "Declaration Required",
                description: "Please accept the declaration to proceed",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const { error } = await supabase.from("pr_requests").insert([
                {
                    project_id: projectId,
                    ...formData,
                },
            ]);

            if (error) throw error;

            toast({
                title: "Success!",
                description: "Your PR request has been submitted successfully. We'll review it soon!",
            });

            onClose();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Submit Pull Request for {projectTitle}</DialogTitle>
                    <DialogDescription>
                        Please fill out this form before submitting your pull request. This helps us understand your contribution better.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Personal Information */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Personal Information</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    Full Name <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">
                                    Email <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="professional_type">
                                You are a <span className="text-destructive">*</span>
                            </Label>
                            <Select
                                value={formData.professional_type}
                                onValueChange={(value: ProfessionalType) =>
                                    setFormData({ ...formData, professional_type: value })
                                }
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select your professional status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="student">Student</SelectItem>
                                    <SelectItem value="professional">Professional</SelectItem>
                                    <SelectItem value="freelancer">Freelancer</SelectItem>
                                    <SelectItem value="hobbyist">Hobbyist</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="github_profile">
                                    GitHub Profile Link <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="github_profile"
                                    type="url"
                                    placeholder="https://github.com/username"
                                    value={formData.github_profile}
                                    onChange={(e) =>
                                        setFormData({ ...formData, github_profile: e.target.value })
                                    }
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="linkedin_profile">LinkedIn Profile Link</Label>
                                <Input
                                    id="linkedin_profile"
                                    type="url"
                                    placeholder="https://linkedin.com/in/username"
                                    value={formData.linkedin_profile}
                                    onChange={(e) =>
                                        setFormData({ ...formData, linkedin_profile: e.target.value })
                                    }
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="portfolio_url">Portfolio URL (Optional)</Label>
                            <Input
                                id="portfolio_url"
                                type="url"
                                placeholder="https://yourportfolio.com"
                                value={formData.portfolio_url}
                                onChange={(e) =>
                                    setFormData({ ...formData, portfolio_url: e.target.value })
                                }
                            />
                        </div>
                    </div>

                    {/* Contribution Details */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Contribution Details</h3>

                        <div className="space-y-2">
                            <Label htmlFor="improvement_description">
                                What improvement or feature do you want to add?{" "}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Textarea
                                id="improvement_description"
                                rows={4}
                                placeholder="Describe the improvement or feature you plan to add..."
                                value={formData.improvement_description}
                                onChange={(e) =>
                                    setFormData({ ...formData, improvement_description: e.target.value })
                                }
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="importance_reason">
                                Why is this improvement important?{" "}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Textarea
                                id="importance_reason"
                                rows={4}
                                placeholder="Explain why this improvement is valuable..."
                                value={formData.importance_reason}
                                onChange={(e) =>
                                    setFormData({ ...formData, importance_reason: e.target.value })
                                }
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="implementation_plan">
                                How will you implement it?{" "}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Textarea
                                id="implementation_plan"
                                rows={4}
                                placeholder="Describe your implementation approach..."
                                value={formData.implementation_plan}
                                onChange={(e) =>
                                    setFormData({ ...formData, implementation_plan: e.target.value })
                                }
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="has_opensource_experience">
                                Have you contributed to open source before?{" "}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Select
                                value={formData.has_opensource_experience ? "yes" : "no"}
                                onValueChange={(value) =>
                                    setFormData({
                                        ...formData,
                                        has_opensource_experience: value === "yes",
                                    })
                                }
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select an option" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="yes">Yes</SelectItem>
                                    <SelectItem value="no">No</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {formData.has_opensource_experience && (
                            <div className="space-y-2">
                                <Label htmlFor="previous_contributions">
                                    Please share your previous contributions
                                </Label>
                                <Textarea
                                    id="previous_contributions"
                                    rows={3}
                                    placeholder="Links to previous PRs, projects, etc..."
                                    value={formData.previous_contributions}
                                    onChange={(e) =>
                                        setFormData({ ...formData, previous_contributions: e.target.value })
                                    }
                                />
                            </div>
                        )}
                    </div>

                    {/* Declaration */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Declaration</h3>
                        <div className="flex items-start space-x-2">
                            <Checkbox
                                id="declaration"
                                checked={formData.declaration_accepted}
                                onCheckedChange={(checked) =>
                                    setFormData({
                                        ...formData,
                                        declaration_accepted: checked as boolean,
                                    })
                                }
                            />
                            <label
                                htmlFor="declaration"
                                className="text-sm leading-relaxed cursor-pointer"
                            >
                                I declare that the information provided above is true and accurate to the
                                best of my knowledge. I understand that this project is open source and my
                                contributions will be publicly available. I agree to follow the project's
                                contribution guidelines and code of conduct.{" "}
                                <span className="text-destructive">*</span>
                            </label>
                        </div>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit PR Request
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default PRRequestForm;
