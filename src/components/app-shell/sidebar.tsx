import { NavLink, Link } from 'react-router-dom';
import { Logo } from '@/components/shared/logo';
import {
  LayoutDashboard,
  PlusCircle,
  History,
  Sparkles,
  Trophy,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const navItems = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'New Interview', to: '/setup', icon: PlusCircle },
  { label: 'History', to: '/history', icon: History },
  { label: 'Achievements', to: '/achievements', icon: Trophy },
];

export function Sidebar({ className }: { className?: string }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'relative flex flex-col border-r border-border bg-card/60 backdrop-blur-md transition-all duration-300 ease-in-out shrink-0 select-none z-30',
        isCollapsed ? 'w-20' : 'w-64',
        className
      )}
    >
      {/* Collapse toggle button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 z-40 hidden md:flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card shadow-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>

      {/* Top Logo */}
      <div className={cn('flex h-16 items-center border-b border-border/80 px-5', isCollapsed && 'justify-center px-0')}>
        <Link to="/dashboard" className="flex items-center">
          {isCollapsed ? <Logo size="md" showText={false} /> : <Logo size="md" />}
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5 p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-primary/15 text-primary font-semibold shadow-xs'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  isCollapsed && 'justify-center px-0'
                )
              }
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Powered By Badge / Card */}
      <div className="p-3 border-t border-border/80">
        {!isCollapsed ? (
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 font-semibold text-foreground mb-1">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Speech Engine</span>
            </div>
            <p className="leading-relaxed text-[11px] text-muted-foreground/90">
              Powered by <span className="font-medium text-foreground">Gnani Prisma</span> STT &{' '}
              <span className="font-medium text-foreground">Timbre</span> TTS
            </p>
          </div>
        ) : (
          <div
            className="flex justify-center p-2 text-primary"
            title="Powered by Gnani Prisma & Timbre"
          >
            <Sparkles className="h-5 w-5" />
          </div>
        )}
      </div>
    </aside>
  );
}
