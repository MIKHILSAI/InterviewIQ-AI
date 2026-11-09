import { InterviewType } from '@/lib/types';
import { TECHNICAL_DOMAINS, HR_DOMAINS, CODING_TOPICS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface DomainSelectorProps {
  type: InterviewType;
  value: string;
  onChange: (domain: string) => void;
}

export function DomainSelector({ type, value, onChange }: DomainSelectorProps) {
  const isMixed = type === 'mixed';

  const renderChip = (domain: string) => {
    const isSelected = value === domain;
    return (
      <button
        key={domain}
        type="button"
        onClick={() => onChange(domain)}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer select-none text-left',
          isSelected
            ? 'border-primary bg-primary text-primary-foreground shadow-xs'
            : 'border-border bg-card text-foreground hover:bg-muted/70 hover:border-primary/30'
        )}
      >
        {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
        <span>{domain}</span>
      </button>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            2
          </span>
          <h3 className="text-base font-bold text-foreground">
            {type === 'coding' ? 'Topic Focus' : 'Domain Focus'}
          </h3>
        </div>
        {!value && (
          <span className="text-xs text-destructive font-medium animate-pulse">
            * Please choose a {type === 'coding' ? 'topic' : 'domain'}
          </span>
        )}
      </div>

      {type === 'coding' && (
        <div className="flex flex-wrap gap-2">
          {CODING_TOPICS.map(renderChip)}
        </div>
      )}

      {type === 'technical' && (
        <div className="flex flex-wrap gap-2">
          {TECHNICAL_DOMAINS.map(renderChip)}
        </div>
      )}

      {type === 'hr' && (
        <div className="flex flex-wrap gap-2">
          {HR_DOMAINS.map(renderChip)}
        </div>
      )}

      {isMixed && (
        <div className="space-y-4 rounded-xl border border-border/80 bg-muted/20 p-4">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Primary Technical Domain
            </h4>
            <div className="flex flex-wrap gap-2">
              {TECHNICAL_DOMAINS.map(renderChip)}
            </div>
          </div>
          <div className="pt-2 border-t border-border/60">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
              Included HR Evaluation
            </h4>
            <p className="text-xs text-muted-foreground">
              + Mixed round automatically blends <span className="font-semibold text-foreground">Behavioural &amp; Situational</span> questions alongside your chosen technical domain.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
