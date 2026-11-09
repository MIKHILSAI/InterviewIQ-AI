import { Difficulty } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface DifficultySelectorProps {
  value: Difficulty;
  onChange: (diff: Difficulty) => void;
}

const levels: { id: Difficulty; label: string; desc: string }[] = [
  {
    id: 'beginner',
    label: 'Beginner',
    desc: 'Core definitions, foundational paradigms, and basic syntax/examples',
  },
  {
    id: 'intermediate',
    label: 'Intermediate',
    desc: 'Applied concepts, memory models, framework internals, and architectural trade-offs',
  },
  {
    id: 'advanced',
    label: 'Advanced',
    desc: 'Low-level runtime internals, edge cases, distributed scaling, and deep design',
  },
];

export function DifficultySelector({ value, onChange }: DifficultySelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
          3
        </span>
        <h3 className="text-base font-bold text-foreground">Difficulty Level</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {levels.map((lvl) => {
          const isSelected = value === lvl.id;
          return (
            <Card
              key={lvl.id}
              onClick={() => onChange(lvl.id)}
              className={cn(
                'p-4 cursor-pointer text-left transition-all border-border hover:border-primary/40',
                isSelected && 'border-primary bg-primary/5 ring-1 ring-primary/40'
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-foreground">{lvl.label}</span>
                <span
                  className={cn(
                    'h-2.5 w-2.5 rounded-full',
                    lvl.id === 'beginner' && 'bg-emerald-500',
                    lvl.id === 'intermediate' && 'bg-indigo-500',
                    lvl.id === 'advanced' && 'bg-purple-500'
                  )}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{lvl.desc}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
