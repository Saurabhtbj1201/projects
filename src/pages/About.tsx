import { useState } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { 
  Github, 
  ExternalLink, 
  Linkedin, 
  Twitter, 
  Instagram, 
  Facebook,
  Send,
  Loader2
} from "lucide-react";

const formSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  phone: z.string().trim().max(20, "Phone must be less than 20 characters").optional(),
  message: z.string().trim().min(1, "Message is required").max(2000, "Message must be less than 2000 characters"),
});

const About = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const skills = [
    "React", "Node.js", "TypeScript", "JavaScript", "MongoDB", 
    "Express.js", "Next.js", "Tailwind CSS", "PostgreSQL", 
    "Git", "AWS", "Docker", "HTML", "CSS", "Python", "SQL", 
    "PHP", "Firebase", "Cloudinary", "Supabase", "AWS S3", 
    "Netlify", "Vercel", "Google Colab", "Excel", "PowerBI", 
    "N8N", "Azure", "PostMan", "Figma"
  ];

  const socialLinks = [
    { name: "LinkedIn", href: "https://www.linkedin.com/in/Saurabhtbj1201/", icon: Linkedin },
    { name: "Twitter (X)", href: "https://x.com/saurabhtbj1201", icon: Twitter },
    { name: "Instagram", href: "https://www.instagram.com/saurabhtbj1201", icon: Instagram },
    { name: "Facebook", href: "https://www.facebook.com/Saurabhtbj1201", icon: Facebook },
    { name: "GitHub", href: "https://github.com/saurabhtbj1201", icon: Github },
    { name: "Portfolio", href: "https://www.gu-saurabh.site/", icon: ExternalLink },
  ];

  const otherLinks = [
    { name: "Quora", href: "https://www.quora.com/profile/Saurabh-Kumar-17241" },
    { name: "Blogger", href: "https://saurabh-12.blogspot.com/" },
    { name: "Medium", href: "https://saurabh1201.medium.com/" },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = formSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("form_submissions").insert({
        project_id: null,
        name: result.data.name,
        email: result.data.email,
        phone: result.data.phone || null,
        purpose: "Contact from About Page",
        message: result.data.message,
        source: "contact",
      });

      if (error) throw error;

      toast({
        title: "Message sent!",
        description: "Thank you for reaching out. I'll get back to you soon.",
      });

      setFormData({
        name: "",
        email: "",
        phone: "",
        message: "",
      });
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold font-serif tracking-tight mb-6">
            About Me
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Full-stack Developer & Data Analyst passionate about building modern web applications and deriving insights from data
          </p>
        </div>

        <div className="space-y-8">
          <section className="rounded-3xl bg-card border border-border p-8">
            <h2 className="text-2xl font-bold font-serif mb-4">Hello!</h2>
            <p className="text-muted-foreground leading-relaxed">
              I'm Saurabh, a full-stack developer and data analyst with a passion for creating beautiful, 
              functional web applications and extracting meaningful insights from data. I specialize in React, Node.js, Python, 
              and modern web technologies along with data analysis tools. My goal is to build solutions that make a real impact 
              and provide excellent user experiences while leveraging data-driven decision making.
            </p>
          </section>

          <section className="rounded-3xl bg-card border border-border p-8">
            <h2 className="text-2xl font-bold font-serif mb-4">Skills</h2>
            <div className="flex flex-wrap gap-3">
              {skills.map((skill) => (
                <span 
                  key={skill}
                  className="px-4 py-2 rounded-full bg-muted text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>

          {/* Get In Touch Form */}
          <section className="rounded-3xl bg-card border border-border p-8">
            <h2 className="text-2xl font-bold font-serif mb-2">Get In Touch</h2>
            <p className="text-muted-foreground mb-6">
              Have a question or want to work together? Feel free to reach out!
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Your name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                  {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  placeholder="+1 234 567 8900"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
                {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  name="message"
                  placeholder="Tell me about your project or inquiry..."
                  rows={4}
                  value={formData.message}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
                {errors.message && <p className="text-sm text-destructive">{errors.message}</p>}
              </div>

              <Button type="submit" className="w-full rounded-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Message
                  </>
                )}
              </Button>
            </form>
          </section>

          <section className="rounded-3xl bg-card border border-border p-8">
            <h2 className="text-2xl font-bold font-serif mb-4">Connect</h2>
            <div className="flex flex-wrap gap-4 mb-6">
              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-border hover:bg-muted transition-colors"
                >
                  <link.icon className="h-5 w-5" />
                  {link.name}
                </a>
              ))}
            </div>
            <div className="flex flex-wrap gap-4">
              {otherLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-border hover:bg-muted transition-colors"
                >
                  <ExternalLink className="h-5 w-5" />
                  {link.name}
                </a>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Saurabh. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default About;
