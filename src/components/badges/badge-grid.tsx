import { useMemo, useState } from 'react';
import type { Badge } from '@/lib/types';
import { BadgeCard } from './badge-card';

type Filter = 'all' | 'earned' | 'locked';

const filters: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'earned', label: 'Earned' },
  { id: 'locked', label: 'Locked' },
];

export function BadgeGrid({ badges }: { badges: Badge[] }) {
  const [filter, setFilter] = useState<Filter>('all');
  const visibleBadges = useMemo(
    () =>
      badges.filter((badge) =>
        filter === 'all' ? true : filter === 'earned' ? badge.earned : !badge.earned
      ),
    [badges, filter]
  );

  return (
    <section className="space-y-5" aria-label="Badge collection">
      <div className="flex flex-wrap gap-2" aria-label="Filter badges">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={filter === item.id}
            onClick={() => setFilter(item.id)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              filter === item.id
                ? 'bg-primary text-primary-foreground'
                : 'border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {visibleBadges.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleBadges.map((badge) => (
            <BadgeCard key={badge.id} badge={badge} />
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No badges in this category yet.
        </p>
      )}
    </section>
  );
}
