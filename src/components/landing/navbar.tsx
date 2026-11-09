import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '@/components/shared/logo';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/app-shell/theme-toggle';
import { UserButton } from '@/components/app-shell/user-button';
import { SignedIn, SignedOut } from '@/lib/auth-context';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Menu, ArrowRight } from 'lucide-react';

const navLinks = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Features', href: '#features' },
  { label: 'Languages', href: '#languages' },
  { label: 'FAQ', href: '#faq' },
];

export function LandingNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const scrollToSection = (id: string) => {
    setMobileOpen(false);
    const element = document.querySelector(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center">
          <Logo size="md" />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-muted-foreground">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => {
                e.preventDefault();
                scrollToSection(link.href);
              }}
              className="hover:text-foreground transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right side Actions */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          <SignedOut>
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/sign-in">Sign in</Link>
            </Button>
            <Button asChild variant="gradient" size="sm">
              <Link to="/sign-up">
                <span>Get started free</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </SignedOut>

          <SignedIn>
            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
              <Link to="/dashboard">Go to dashboard</Link>
            </Button>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>

          {/* Mobile hamburger menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-card">
              <SheetHeader className="text-left">
                <SheetTitle>
                  <Logo size="md" />
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-6">
                {navLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection(link.href);
                    }}
                    className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors py-1.5"
                  >
                    {link.label}
                  </a>
                ))}
                <div className="border-t border-border/80 my-2 pt-4 flex flex-col gap-2">
                  <SignedOut>
                    <Button asChild variant="outline" className="w-full justify-center">
                      <Link to="/sign-in" onClick={() => setMobileOpen(false)}>
                        Sign in
                      </Link>
                    </Button>
                    <Button asChild variant="gradient" className="w-full justify-center">
                      <Link to="/sign-up" onClick={() => setMobileOpen(false)}>
                        Get started free
                      </Link>
                    </Button>
                  </SignedOut>
                  <SignedIn>
                    <Button asChild variant="gradient" className="w-full justify-center">
                      <Link to="/dashboard" onClick={() => setMobileOpen(false)}>
                        Go to dashboard
                      </Link>
                    </Button>
                  </SignedIn>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
