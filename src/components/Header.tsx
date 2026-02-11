import { useState, useEffect } from "react";
import { Menu, X, Moon, Sun, Github, Lock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import AdminLoginModal from "./AdminLoginModal";
import { useNavigate, useLocation, Link } from "react-router-dom";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldBeDark = savedTheme === "dark" || (!savedTheme && prefersDark);
    
    setIsDark(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    
    if (newTheme) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleAdminClick = () => {
    if (user && isAdmin) {
      navigate("/admin");
    } else {
      setShowLoginModal(true);
    }
  };

  const handleLogout = async () => {
    await signOut();
    if (location.pathname === "/admin") {
      navigate("/");
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 py-2 sm:py-4">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 pill-nav px-4 sm:px-6">
            {/* Logo */}
            <div className="flex items-center min-w-0">
              <Link to="/" className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-foreground font-bold text-base sm:text-lg">S</span>
                </div>
                <span className="text-base sm:text-xl font-bold font-serif truncate">Saurabh</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-2">
              <Link to="/" className="text-sm font-medium hover:bg-muted/60 rounded-full px-4 py-2 transition-all">
                Projects
              </Link>
              <a 
                href="https://www.gu-saurabh.site/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm font-medium hover:bg-muted/60 rounded-full px-4 py-2 transition-all"
              >
                Portfolio
              </a>
              <Link to="/about" className="text-sm font-medium hover:bg-muted/60 rounded-full px-4 py-2 transition-all">
                About
              </Link>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <button
                onClick={toggleTheme}
                className="p-1.5 sm:p-2 rounded-full hover:bg-muted/60 transition-all"
                aria-label="Toggle theme"
              >
                {isDark ? (
                  <Sun className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <Moon className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </button>
              
              <a
                href="https://github.com/saurabhtbj1201"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:flex items-center gap-2 bg-muted hover:bg-muted/80 text-foreground rounded-full px-4 py-2 transition-all"
              >
                <Github className="h-4 w-4" />
                <span className="text-sm font-medium">GitHub</span>
              </a>

              {user && isAdmin ? (
                <div className="hidden md:flex items-center gap-2">
                  <Button 
                    onClick={() => navigate("/admin")}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6 py-2"
                  >
                    Dashboard
                  </Button>
                  <Button 
                    onClick={handleLogout}
                    variant="outline"
                    className="rounded-full px-4 py-2"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={handleAdminClick}
                  className="hidden md:flex bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6 py-2"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              )}

              {/* Mobile Menu Button */}
              <button
                className="md:hidden p-1.5 sm:p-2"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Toggle menu"
              >
                {isMenuOpen ? <X className="h-5 w-5 sm:h-6 sm:w-6" /> : <Menu className="h-5 w-5 sm:h-6 sm:w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden py-4 mt-2 rounded-2xl bg-card px-4 border border-border animate-fade-in">
              <nav className="flex flex-col gap-4">
                <Link to="/" className="text-sm font-medium hover:text-accent transition-colors" onClick={() => setIsMenuOpen(false)}>
                  Projects
                </Link>
                <a 
                  href="https://www.gu-saurabh.site/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm font-medium hover:text-accent transition-colors"
                >
                  Portfolio
                </a>
                <Link to="/about" className="text-sm font-medium hover:text-accent transition-colors" onClick={() => setIsMenuOpen(false)}>
                  About
                </Link>
                <a
                  href="https://github.com/saurabhtbj1201"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm font-medium hover:text-accent transition-colors"
                >
                  <Github className="h-4 w-4" />
                  GitHub
                </a>
                {user && isAdmin ? (
                  <>
                    <Button 
                      onClick={() => { navigate("/admin"); setIsMenuOpen(false); }}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full w-full"
                    >
                      Dashboard
                    </Button>
                    <Button 
                      onClick={handleLogout}
                      variant="outline"
                      className="rounded-full w-full"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <Button 
                    onClick={() => { handleAdminClick(); setIsMenuOpen(false); }}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full w-full"
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Admin
                  </Button>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>
      
      <AdminLoginModal open={showLoginModal} onOpenChange={setShowLoginModal} />
    </>
  );
};

export default Header;
