import { cn, scoreTone, scoreLabel } from '@/lib/utils';

export function ScoreBadge({
  score,
  className,
}: {
  score: number | null | undefined;
  className?: string;
}) {
  if (score === null || score === undefined) {
    return (
      <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground border border-border', className)}>
        In progress
      </span>
    );
  }

  const tone = scoreTone(score);
  const label = scoreLabel(score);

  const toneStyles = {
    success: 'bg-success/15 text-success border-success/30',
    warning: 'bg-warning/15 text-warning border-warning/30',
    destructive: 'bg-destructive/15 text-destructive border-destructive/30',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold select-none',
        toneStyles[tone],
        className
      )}
    >
      <span className="font-bold">{Math.round(score)}</span>
      <span className="opacity-80 font-normal">/ {label}</span>
    </span>
  );
}
