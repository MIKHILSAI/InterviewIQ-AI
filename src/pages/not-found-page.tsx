import { Link } from 'react-router-dom';
import { VoiceOrb } from '@/components/shared/voice-orb';
import { Button } from '@/components/ui/button';
import { Home, LayoutDashboard } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-center space-y-6">
      <VoiceOrb state="idle" size={140} />

      <div className="space-y-2 max-w-md">
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
          Page Not Found
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          We couldn&apos;t find that page. The URL might be incorrect or the session may have concluded.
        </p>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button asChild variant="outline" className="gap-2 rounded-xl">
          <Link to="/">
            <Home className="h-4 w-4" />
            <span>Home</span>
          </Link>
        </Button>
        <Button asChild variant="gradient" className="gap-2 rounded-xl">
          <Link to="/dashboard">
            <LayoutDashboard className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
