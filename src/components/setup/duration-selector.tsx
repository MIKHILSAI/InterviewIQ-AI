import { DURATIONS } from '@/lib/constants';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';

interface DurationSelectorProps {
  value: 5 | 10 | 15;
  onChange: (duration: 5 | 10 | 15) => void;
}

export function DurationSelector({ value, onChange }: DurationSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
          4
        </span>
        <h3 className="text-base font-bold text-foreground">Target Duration</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {DURATIONS.map((d) => {
          const isSelected = value === d.min;
          return (
            <Card
              key={d.min}
              onClick={() => onChange(d.min as 5 | 10 | 15)}
              className={cn(
                'p-4 cursor-pointer text-left transition-all border-border hover:border-primary/40',
                isSelected && 'border-primary bg-primary/5 ring-1 ring-primary/40'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-base font-extrabold text-foreground">{d.min} Minutes</span>
                </div>
                {d.min === 10 && (
                  <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary uppercase">
                    Standard
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                ≈ {d.approxQuestions} interactive questions &amp; follow-ups
              </p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
