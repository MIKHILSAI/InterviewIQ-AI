import { Award, Check, Lock } from 'lucide-react';
import type { Badge } from '@/lib/types';
import { badgePresentation, badgeToneClasses } from '@/lib/badges';

export function BadgeCard({ badge }: { badge: Badge }) {
  const { icon: Icon, tone } = badgePresentation[badge.id] ?? {
    icon: Award,
    tone: 'primary',
  };
  const colors = badgeToneClasses[tone];
  const progress = badge.earned
    ? 100
    : Math.min(100, Math.round((badge.current / Math.max(1, badge.target)) * 100));
  const displayedProgress = Math.min(badge.current, badge.target);

  return (
    <article
      className={`flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-sm ${
        badge.earned ? '' : 'opacity-80'
      }`}
      aria-label={`${badge.name}, ${badge.earned ? 'earned' : `progress ${badge.current} of ${badge.target}`}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
            badge.earned ? colors.icon : 'bg-muted text-muted-foreground'
          }`}
        >
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
        {badge.earned ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
            Earned
          </span>
        ) : (
          <Lock className="h-4 w-4 text-muted-foreground" aria-label="Locked" />
        )}
      </div>

      <h3 className="mt-4 font-semibold text-foreground">{badge.name}</h3>
      <p className="mt-1 flex-1 text-sm leading-relaxed text-muted-foreground">
        {badge.description}
      </p>

      <div className="mt-4 space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{badge.earned ? 'Completed' : 'Progress'}</span>
          <span className={badge.earned ? colors.accent : ''}>
            {displayedProgress} / {badge.target}
          </span>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-label={`${badge.name} progress`}
          aria-valuemin={0}
          aria-valuemax={badge.target}
          aria-valuenow={Math.min(badge.target, badge.current)}
        >
          <div
            className={`h-full rounded-full transition-[width] ${
              badge.earned ? 'bg-success' : 'bg-primary'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </article>
  );
}
