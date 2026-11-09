import { InterviewConfig } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Code2, Users, Shuffle, Globe2 } from 'lucide-react';

export function ConfigBadges({
  config,
  className,
}: {
  config: InterviewConfig;
  className?: string;
}) {
  const typeIcons = {
    technical: Code2,
    hr: Users,
    mixed: Shuffle,
    coding: Code2,
  };

  const TypeIcon = typeIcons[config.type] || Code2;

  const difficultyColors = {
    beginner: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    intermediate: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    advanced: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  };

  const langLabels = {
    en: 'English',
    ta: 'தமிழ் (Tamil)',
    hi: 'हिन्दी (Hindi)',
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5 select-none', className)}>
      <Badge variant="outline" className="gap-1 border-border bg-card">
        <TypeIcon className="h-3 w-3 text-primary" />
        <span className="capitalize">{config.type}</span>
      </Badge>

      <Badge variant="secondary" className="font-medium bg-muted/80 text-foreground">
        {config.domain}
      </Badge>

      <span
        className={cn(
          'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold capitalize',
          difficultyColors[config.difficulty]
        )}
      >
        {config.difficulty}
      </span>

      <Badge variant="outline" className="gap-1 text-muted-foreground border-border/80">
        <Globe2 className="h-3 w-3" />
        <span>{langLabels[config.language] || config.language}</span>
      </Badge>

      {config.type === 'coding' && config.codingLanguage && (
        <Badge variant="outline" className="text-muted-foreground border-border/80 capitalize">
          {config.codingLanguage}
        </Badge>
      )}

      <Badge variant="outline" className="text-muted-foreground border-border/80">
        {config.durationMin}m
      </Badge>
    </div>
  );
}
