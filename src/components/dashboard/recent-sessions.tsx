import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { ConfigBadges } from '@/components/shared/config-badges';
import { ScoreBadge } from '@/components/shared/score-badge';
import { SessionSummary } from '@/lib/types';
import { formatDate, formatDuration } from '@/lib/utils';
import { ChevronRight, ArrowRight } from 'lucide-react';

export function RecentSessions({ sessions }: { sessions: SessionSummary[] }) {
  const recent = sessions.slice(0, 5);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">Recent Practice Rounds</h2>
          <p className="text-xs text-muted-foreground">Your recent interviews and detailed performance reports</p>
        </div>
        <Link
          to="/history"
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
        >
          <span>View all</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="divide-y divide-border/60">
        {recent.map((session) => {
          const isCompleted = session.status === 'completed';
          const content = (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5 px-2 rounded-xl hover:bg-muted/40 transition-colors">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">{session.config.domain}</span>
                  <span className="text-xs text-muted-foreground capitalize">({session.config.type})</span>
                </div>
                <ConfigBadges config={session.config} />
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 text-xs shrink-0">
                <div className="text-right">
                  <div className="text-muted-foreground">{formatDate(session.startedAt)}</div>
                  <div className="font-mono text-muted-foreground/80">{formatDuration(session.durationSec)}</div>
                </div>

                <div className="flex items-center gap-2">
                  <ScoreBadge score={session.overallScore} />
                  {isCompleted && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
                  )}
                </div>
              </div>
            </div>
          );

          return isCompleted ? (
            <Link
              key={session.sessionId}
              to={`/results/${session.sessionId}`}
              className="block cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary rounded-xl"
            >
              {content}
            </Link>
          ) : (
            <div key={session.sessionId} className="opacity-75">
              {content}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
