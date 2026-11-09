import { useUser } from '@/lib/auth-context';
import { Flame } from 'lucide-react';

export function WelcomeHeader({ streakDays = 4 }: { streakDays?: number }) {
  const { user } = useUser();
  const firstName = user?.firstName || 'Candidate';

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
      <div className="space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
          <span>Welcome back, {firstName}</span>
          <span className="inline-block animate-wave origin-[70%_70%]">👋</span>
        </h1>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>Ready for your next practice round?</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-500 border border-amber-500/20">
            <Flame className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
            <span>{streakDays}-day streak. Keep going!</span>
          </span>
        </div>
      </div>
    </div>
  );
}
