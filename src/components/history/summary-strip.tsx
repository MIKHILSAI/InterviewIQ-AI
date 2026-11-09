import { SessionSummary } from '@/lib/types';
import { ScoreBadge } from '@/components/shared/score-badge';

export function SummaryStrip({ sessions }: { sessions: SessionSummary[] }) {
  const count = sessions.length;
  const completed = sessions.filter((s) => s.status === 'completed' && s.overallScore !== null);
  const avgScore =
    completed.length > 0
      ? Math.round(
          completed.reduce((acc, s) => acc + (s.overallScore || 0), 0) / completed.length
        )
      : null;
  const bestScore =
    completed.length > 0
      ? Math.max(...completed.map((s) => s.overallScore || 0))
      : null;

  return (
    <div className="flex flex-wrap items-center gap-6 p-4 rounded-xl bg-card border border-border/80 text-xs">
      <div>
        <span className="text-muted-foreground mr-1.5">Matching Sessions:</span>
        <span className="font-extrabold text-foreground">{count}</span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Average Score:</span>
        {avgScore !== null ? (
          <ScoreBadge score={avgScore} />
        ) : (
          <span className="text-muted-foreground font-medium">—</span>
        )}
      </div>

      <div>
        <span className="text-muted-foreground mr-1.5">Highest Score:</span>
        <span className="font-extrabold text-foreground">
          {bestScore !== null ? `${bestScore}%` : '—'}
        </span>
      </div>
    </div>
  );
}
