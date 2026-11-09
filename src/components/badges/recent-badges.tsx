import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getBadges } from '@/lib/api';
import type { Badge } from '@/lib/types';
import { BadgeCard } from './badge-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export function RecentBadges() {
  const { getToken } = useAuth();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const token = (await getToken()) ?? undefined;
      setBadges(await getBadges(token));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const earned = badges
    .filter((badge) => badge.earned)
    .sort((a, b) => (b.earnedAt ?? '').localeCompare(a.earnedAt ?? ''))
    .slice(0, 3);

  return (
    <section className="space-y-4" aria-labelledby="recent-badges-title">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" aria-hidden="true" />
          <h2 id="recent-badges-title" className="text-lg font-bold text-foreground">
            Recent achievements
          </h2>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link to="/achievements">View all</Link>
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-border p-5 text-sm text-muted-foreground">
          Could not load achievements.{' '}
          <button type="button" onClick={load} className="font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            Retry
          </button>
        </div>
      ) : earned.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {earned.map((badge) => <BadgeCard key={badge.id} badge={badge} />)}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Complete an interview to earn your first achievement.
        </div>
      )}
    </section>
  );
}
