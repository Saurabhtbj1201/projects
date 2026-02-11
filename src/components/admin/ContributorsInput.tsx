import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, User } from "lucide-react";

export interface Contributor {
    name: string;
    github_link: string;
}

interface ContributorsInputProps {
    contributors: Contributor[];
    onChange: (contributors: Contributor[]) => void;
}

const ContributorsInput = ({ contributors, onChange }: ContributorsInputProps) => {
    const [newContributor, setNewContributor] = useState<Contributor>({
        name: "",
        github_link: "",
    });

    const addContributor = () => {
        if (newContributor.name.trim()) {
            onChange([...contributors, newContributor]);
            setNewContributor({ name: "", github_link: "" });
        }
    };

    const removeContributor = (index: number) => {
        onChange(contributors.filter((_, i) => i !== index));
    };

    const updateContributor = (index: number, field: keyof Contributor, value: string) => {
        const updated = contributors.map((c, i) =>
            i === index ? { ...c, [field]: value } : c
        );
        onChange(updated);
    };

    return (
        <div className="space-y-3">
            {/* Existing Contributors */}
            {contributors.map((contributor, index) => (
                <Card key={index}>
                    <CardContent className="p-3">
                        <div className="flex items-start gap-2">
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                    <Label className="text-xs">Name</Label>
                                    <Input
                                        value={contributor.name}
                                        onChange={(e) => updateContributor(index, "name", e.target.value)}
                                        placeholder="John Doe"
                                        className="h-8 text-sm"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">GitHub Profile URL</Label>
                                    <Input
                                        value={contributor.github_link}
                                        onChange={(e) => updateContributor(index, "github_link", e.target.value)}
                                        placeholder="https://github.com/username"
                                        className="h-8 text-sm"
                                    />
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeContributor(index)}
                                className="h-8 w-8 mt-5"
                            >
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}

            {/* Add New Contributor */}
            <Card className="border-dashed">
                <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                                <Label className="text-xs">Name</Label>
                                <Input
                                    value={newContributor.name}
                                    onChange={(e) => setNewContributor({ ...newContributor, name: e.target.value })}
                                    placeholder="Enter name"
                                    className="h-8 text-sm"
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addContributor())}
                                />
                            </div>
                            <div>
                                <Label className="text-xs">GitHub Profile URL (optional)</Label>
                                <Input
                                    value={newContributor.github_link}
                                    onChange={(e) => setNewContributor({ ...newContributor, github_link: e.target.value })}
                                    placeholder="https://github.com/username"
                                    className="h-8 text-sm"
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addContributor())}
                                />
                            </div>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={addContributor}
                            disabled={!newContributor.name.trim()}
                            className="h-8 w-8 mt-5"
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {contributors.length === 0 && (
                <div className="text-center py-4 text-sm text-muted-foreground">
                    <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No contributors added yet.</p>
                    <p className="text-xs">Add contributors to track project collaborators.</p>
                </div>
            )}
        </div>
    );
};

export default ContributorsInput;
