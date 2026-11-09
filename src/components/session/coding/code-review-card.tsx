import { CodeReview } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const verdictLabel: Record<CodeReview['verdict'], string> = {
  correct: 'Correct',
  partially_correct: 'Partially correct',
  incorrect: 'Needs work',
  unclear: 'Unclear',
};

const severityStyles = {
  high: 'border-destructive/30 bg-destructive/10 text-destructive',
  medium: 'border-warning/30 bg-warning/10 text-warning',
  low: 'border-success/30 bg-success/10 text-success',
};

export function CodeReviewCard({
  review,
  onIssueSelect,
}: {
  review: CodeReview;
  onIssueSelect?: (line?: number) => void;
}) {
  return (
    <Card className="space-y-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-foreground">Code review</h2>
        <Badge variant="outline" className="capitalize">{verdictLabel[review.verdict]}</Badge>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">{review.summary}</p>
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">Time: {review.timeComplexity}</Badge>
        <Badge variant="secondary">Space: {review.spaceComplexity}</Badge>
      </div>
      {review.issues.length > 0 && (
        <ul className="space-y-2" aria-label="Code issues">
          {review.issues.map((issue, index) => (
            <li key={`${issue.line ?? 'general'}-${index}`}>
              <button
                type="button"
                onClick={() => onIssueSelect?.(issue.line)}
                disabled={!issue.line || !onIssueSelect}
                className={cn(
                  'flex w-full items-start gap-2 rounded-xl border p-3 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  severityStyles[issue.severity],
                  (!issue.line || !onIssueSelect) && 'cursor-default'
                )}
              >
                <span className="shrink-0 font-semibold capitalize">
                  {issue.severity}{issue.line ? ` · line ${issue.line}` : ''}
                </span>
                <span>{issue.message}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {review.edgeCasesMissed.length > 0 && (
        <div className="space-y-1">
          <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Edge cases to consider</h3>
          <ul className="list-inside list-disc text-sm text-foreground">
            {review.edgeCasesMissed.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      )}
      <div className="rounded-xl bg-muted/40 p-3 text-sm">
        <span className="font-semibold text-foreground">Suggested improvement: </span>
        <span className="text-muted-foreground">{review.suggestedImprovement}</span>
      </div>
    </Card>
  );
}
