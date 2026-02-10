import { useEffect } from "react";
import { SiteSettings } from "@/types/project";

interface ProjectSEOData {
  name: string;
  description: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  author?: string;
  category?: string;
  techStack?: string[];
}

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  keywords?: string;
  type?: "website" | "article";
  settings?: SiteSettings | null;
  projectData?: ProjectSEOData;
}

const SEOHead = ({
  title,
  description,
  image,
  url,
  keywords,
  type = "website",
  settings,
  projectData,
}: SEOHeadProps) => {
  const siteUrl = settings?.site_url || "https://www.projects.gu-saurabh.site";
  const defaultTitle = settings?.site_name || "Saurabh Projects";
  const defaultDescription = settings?.site_description || 
    "A collection of my work showcasing web development, data analysis, and problem-solving skills across various technologies.";
  const defaultKeywords = settings?.meta_keywords || 
    "portfolio, projects, web development, full-stack, data analyst, React, TypeScript";

  const pageTitle = title ? `${title} | ${defaultTitle}` : defaultTitle;
  const pageDescription = description || defaultDescription;
  const pageImage = image || settings?.og_image || `${siteUrl}/og-image.png`;
  const pageUrl = url || siteUrl;
  const pageKeywords = keywords || defaultKeywords;

  useEffect(() => {
    // Update document title
    document.title = pageTitle;

    // Update meta tags
    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const attribute = isProperty ? "property" : "name";
      let meta = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
      if (meta) {
        meta.content = content;
      } else {
        meta = document.createElement("meta");
        meta.setAttribute(attribute, name);
        meta.content = content;
        document.head.appendChild(meta);
      }
    };

    // Basic meta tags
    updateMetaTag("description", pageDescription);
    updateMetaTag("keywords", pageKeywords);
    updateMetaTag("author", "Saurabh Kumar");
    updateMetaTag("robots", "index, follow");

    // Open Graph tags
    updateMetaTag("og:title", pageTitle, true);
    updateMetaTag("og:description", pageDescription, true);
    updateMetaTag("og:image", pageImage, true);
    updateMetaTag("og:url", pageUrl, true);
    updateMetaTag("og:type", type === "article" ? "article" : "website", true);
    updateMetaTag("og:site_name", defaultTitle, true);
    updateMetaTag("og:locale", "en_US", true);

    // Twitter Card tags
    updateMetaTag("twitter:card", "summary_large_image");
    updateMetaTag("twitter:title", pageTitle);
    updateMetaTag("twitter:description", pageDescription);
    updateMetaTag("twitter:image", pageImage);
    updateMetaTag("twitter:site", "@saurabhtbj1201");
    updateMetaTag("twitter:creator", "@saurabhtbj1201");

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (canonical) {
      canonical.href = pageUrl;
    } else {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      canonical.href = pageUrl;
      document.head.appendChild(canonical);
    }

    // JSON-LD Structured Data
    const existingJsonLd = document.querySelector('script[data-seo-jsonld]');
    if (existingJsonLd) {
      existingJsonLd.remove();
    }

    const jsonLdScript = document.createElement("script");
    jsonLdScript.type = "application/ld+json";
    jsonLdScript.setAttribute("data-seo-jsonld", "true");

    if (projectData) {
      // Project/Article structured data
      const projectSchema = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": projectData.name,
        "description": projectData.description,
        "image": projectData.image || pageImage,
        "author": {
          "@type": "Person",
          "name": projectData.author || "Saurabh Kumar",
          "url": siteUrl
        },
        "publisher": {
          "@type": "Person",
          "name": "Saurabh Kumar",
          "url": siteUrl
        },
        "datePublished": projectData.datePublished,
        "dateModified": projectData.dateModified || projectData.datePublished,
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": pageUrl
        },
        "articleSection": projectData.category,
        "keywords": projectData.techStack?.join(", ") || keywords
      };
      jsonLdScript.textContent = JSON.stringify(projectSchema);
    } else {
      // Website/Portfolio structured data
      const websiteSchema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": defaultTitle,
        "description": defaultDescription,
        "url": siteUrl,
        "author": {
          "@type": "Person",
          "name": "Saurabh Kumar"
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": `${siteUrl}/?search={search_term_string}`,
          "query-input": "required name=search_term_string"
        }
      };
      jsonLdScript.textContent = JSON.stringify(websiteSchema);
    }

    document.head.appendChild(jsonLdScript);

    // Cleanup function
    return () => {
      const scriptToRemove = document.querySelector('script[data-seo-jsonld]');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [pageTitle, pageDescription, pageImage, pageUrl, pageKeywords, type, defaultTitle, projectData, siteUrl, keywords]);

  return null;
};

export default SEOHead;
