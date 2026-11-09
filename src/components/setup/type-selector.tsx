import { InterviewType } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Code2, Users, Shuffle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TypeSelectorProps {
  value: InterviewType;
  onChange: (type: InterviewType) => void;
}

const types: { id: InterviewType; label: string; desc: string; icon: typeof Code2 }[] = [
  {
    id: 'technical',
    label: 'Technical',
    desc: 'Concepts, problem solving and technical follow-ups',
    icon: Code2,
  },
  {
    id: 'hr',
    label: 'HR',
    desc: 'Behavioural, situational, and culture-fit questions',
    icon: Users,
  },
  {
    id: 'mixed',
    label: 'Mixed',
    desc: 'Both technical depth and behavioural fit, like a real placement round',
    icon: Shuffle,
  },
  {
    id: 'coding',
    label: 'Coding + Voice',
    desc: 'Explain your approach out loud, then write the code',
    icon: Code2,
  },
];

export function TypeSelector({ value, onChange }: TypeSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
          1
        </span>
        <h3 className="text-base font-bold text-foreground">Interview Type</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {types.map((t) => {
          const Icon = t.icon;
          const isSelected = value === t.id;

          return (
            <Card
              key={t.id}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              onClick={() => onChange(t.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onChange(t.id);
                }
              }}
              className={cn(
                'relative p-4 cursor-pointer transition-all border-border text-left hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isSelected && 'border-primary bg-primary/5 ring-1 ring-primary/40 shadow-xs'
              )}
            >
              <div className="flex items-start justify-between">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-xl transition-colors',
                    isSelected ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                {isSelected && (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
                    <Check className="h-3 w-3" />
                  </div>
                )}
              </div>
              <h4 className="font-bold text-foreground text-sm mt-3">{t.label}</h4>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{t.desc}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
