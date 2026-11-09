import { Link } from 'react-router-dom';
import { SessionSummary } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { ConfigBadges } from '@/components/shared/config-badges';
import { ScoreBadge } from '@/components/shared/score-badge';
import { formatDate, formatDuration } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

export function SessionCard({ session }: { session: SessionSummary }) {
  const isCompleted = session.status === 'completed';

  const cardContent = (
    <Card className="p-4 border-border space-y-3 hover:border-primary/40 transition-all">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-sm font-bold text-foreground block">{session.config.domain}</span>
          <span className="text-xs text-muted-foreground">{formatDate(session.startedAt)}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ScoreBadge score={session.overallScore} />
          {isCompleted && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>

      <ConfigBadges config={session.config} />

      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/60">
        <span>Duration: {formatDuration(session.durationSec)}</span>
        <span className="capitalize">{session.status.replace('_', ' ')}</span>
      </div>
    </Card>
  );

  return isCompleted ? (
    <Link to={`/results/${session.sessionId}`} className="block">
      {cardContent}
    </Link>
  ) : (
    <div className="opacity-75">{cardContent}</div>
  );
}
