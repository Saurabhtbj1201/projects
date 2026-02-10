import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteSettings } from "@/types/project";

export const useSiteSettings = () => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      setSettings(data);
    } catch (error) {
      console.error("Error fetching site settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<SiteSettings>) => {
    if (!settings) return { error: new Error("No settings found") };

    try {
      const { error } = await supabase
        .from("site_settings")
        .update(updates)
        .eq("id", settings.id);

      if (error) throw error;
      
      setSettings({ ...settings, ...updates });
      return { error: null };
    } catch (error) {
      console.error("Error updating site settings:", error);
      return { error };
    }
  };

  return { settings, isLoading, updateSettings, refetch: fetchSettings };
};
