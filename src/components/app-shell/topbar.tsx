import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MobileNav } from './mobile-nav';
import { ThemeToggle } from './theme-toggle';
import { UserButton } from './user-button';
import { Plus } from 'lucide-react';

export function Topbar() {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-card/75 backdrop-blur-md px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <MobileNav />
      </div>

      <div className="flex items-center gap-3">
        <Button asChild variant="gradient" size="sm" className="hidden sm:inline-flex">
          <Link to="/setup">
            <Plus className="h-4 w-4 mr-1.5" />
            <span>New interview</span>
          </Link>
        </Button>

        <ThemeToggle />

        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  );
}
