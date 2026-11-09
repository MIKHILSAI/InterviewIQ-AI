import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/shared/logo';
import {
  Menu,
  LayoutDashboard,
  PlusCircle,
  History,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'New Interview', to: '/setup', icon: PlusCircle },
  { label: 'History', to: '/history', icon: History },
  { label: 'Achievements', to: '/achievements', icon: Trophy },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="md:hidden rounded-xl h-9 w-9 text-foreground"
          aria-label="Open mobile navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 flex flex-col bg-card">
        <SheetHeader className="p-5 border-b border-border/80">
          <SheetTitle asChild>
            <Link to="/dashboard" onClick={() => setOpen(false)}>
              <Logo size="md" />
            </Link>
          </SheetTitle>
        </SheetHeader>

        <nav className="flex-1 space-y-1.5 p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/15 text-primary font-semibold'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )
                }
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border/80">
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 font-semibold text-foreground mb-1">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Speech Engine</span>
            </div>
            <p className="leading-relaxed text-[11px]">
              Powered by <span className="font-medium text-foreground">Gnani Prisma</span> STT &{' '}
              <span className="font-medium text-foreground">Timbre</span> TTS
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
