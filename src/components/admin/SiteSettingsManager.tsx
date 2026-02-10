import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SiteSettings } from "@/types/project";
import { Loader2, Globe, Save, Image as ImageIcon, CheckCircle, AlertCircle } from "lucide-react";
import ImageUpload from "./ImageUpload";

const SiteSettingsManager = () => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    site_name: "",
    site_description: "",
    site_url: "",
    og_image: "",
    meta_keywords: "",
    footer_text: "",
  });

  const [ogImages, setOgImages] = useState<string[]>([]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings(data);
        setFormData({
          site_name: data.site_name || "",
          site_description: data.site_description || "",
          site_url: data.site_url || "",
          og_image: data.og_image || "",
          meta_keywords: data.meta_keywords || "",
          footer_text: data.footer_text || "",
        });
        if (data.og_image) {
          setOgImages([data.og_image]);
        }
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOgImageChange = (images: string[]) => {
    setOgImages(images);
    setFormData({ ...formData, og_image: images[0] || "" });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("site_settings")
        .update({
          site_name: formData.site_name.trim(),
          site_description: formData.site_description.trim(),
          site_url: formData.site_url.trim() || null,
          og_image: formData.og_image.trim() || null,
          meta_keywords: formData.meta_keywords.trim() || null,
          footer_text: formData.footer_text.trim() || null,
        })
        .eq("id", settings.id);

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "Site settings have been updated successfully",
      });

      fetchSettings();
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-serif flex items-center gap-2">
          <Globe className="h-6 w-6" />
          Site Settings
        </h2>
        <p className="text-muted-foreground">Manage your portfolio site's SEO and metadata</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Core site settings and identity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="site_name">Site Name</Label>
                <Input
                  id="site_name"
                  value={formData.site_name}
                  onChange={(e) => setFormData({ ...formData, site_name: e.target.value })}
                  placeholder="My Projects Portfolio"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="site_url">Site URL</Label>
                <Input
                  id="site_url"
                  type="url"
                  value={formData.site_url}
                  onChange={(e) => setFormData({ ...formData, site_url: e.target.value })}
                  placeholder="https://www.projects.gu-saurabh.site/"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="site_description">Site Description (SEO)</Label>
              <Textarea
                id="site_description"
                value={formData.site_description}
                onChange={(e) => setFormData({ ...formData, site_description: e.target.value })}
                placeholder="A collection of my work..."
                rows={3}
              />
              <div className="flex items-center gap-2 text-xs">
                {formData.site_description.length <= 160 ? (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                ) : (
                  <AlertCircle className="h-3 w-3 text-amber-500" />
                )}
                <span className="text-muted-foreground">
                  {formData.site_description.length}/160 characters
                  {formData.site_description.length > 160 && " (recommended: under 160)"}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="meta_keywords">Meta Keywords</Label>
              <Input
                id="meta_keywords"
                value={formData.meta_keywords}
                onChange={(e) => setFormData({ ...formData, meta_keywords: e.target.value })}
                placeholder="portfolio, projects, web development, React"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="footer_text">Footer Text</Label>
              <Input
                id="footer_text"
                value={formData.footer_text}
                onChange={(e) => setFormData({ ...formData, footer_text: e.target.value })}
                placeholder="© 2024 Saurabh. All rights reserved."
              />
            </div>
          </CardContent>
        </Card>

        {/* OG Image Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Open Graph Image
            </CardTitle>
            <CardDescription>
              Image shown when sharing on social media (Facebook, Twitter, LinkedIn)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="font-medium text-sm">OG Image Requirements</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Recommended size: <strong>1200 × 630 pixels</strong></li>
                <li>• Aspect ratio: <strong>1.91:1</strong></li>
                <li>• Maximum file size: <strong>300KB</strong> (ideally under 200KB)</li>
                <li>• Minimum width: 200px (1200px recommended)</li>
                <li>• Supported formats: JPEG, PNG</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Label>Upload OG Image</Label>
              <ImageUpload
                images={ogImages}
                onChange={handleOgImageChange}
                bucket="site-assets"
                maxWidth={1200}
                maxHeight={630}
                aspectRatio={1.91}
                maxSizeKB={300}
                single
              />
            </div>

            {formData.og_image && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="border rounded-lg overflow-hidden max-w-md">
                  <img
                    src={formData.og_image}
                    alt="OG Image Preview"
                    className="w-full h-auto"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  This is how your image will appear when shared on social media
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="og_image_url">Or enter URL directly</Label>
              <Input
                id="og_image_url"
                type="url"
                value={formData.og_image}
                onChange={(e) => {
                  setFormData({ ...formData, og_image: e.target.value });
                  setOgImages(e.target.value ? [e.target.value] : []);
                }}
                placeholder="https://example.com/og-image.png"
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </form>
    </div>
  );
};

export default SiteSettingsManager;
