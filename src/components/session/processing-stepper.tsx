import { useState, useEffect } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const steps = [
  { id: 1, label: 'Transcribing your answer (Prisma)' },
  { id: 2, label: 'Evaluating against 5-point rubric' },
  { id: 3, label: 'Preparing the next question' },
];

export function ProcessingStepper() {
  const [activeStep, setActiveStep] = useState(1);

  useEffect(() => {
    const timer1 = setTimeout(() => setActiveStep(2), 700);
    const timer2 = setTimeout(() => setActiveStep(3), 1500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div className="w-full max-w-md mx-auto space-y-3 p-4 rounded-2xl bg-card border border-border shadow-sm">
      {steps.map((st) => {
        const isDone = activeStep > st.id;
        const isCurrent = activeStep === st.id;

        return (
          <div key={st.id} className="flex items-center gap-3 text-xs">
            <div
              className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors',
                isDone && 'bg-success text-white',
                isCurrent && 'bg-primary text-white animate-pulse',
                !isDone && !isCurrent && 'bg-muted text-muted-foreground'
              )}
            >
              {isDone ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : isCurrent ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <span>{st.id}</span>
              )}
            </div>
            <span
              className={cn(
                'font-medium transition-colors',
                isCurrent && 'text-foreground font-semibold',
                isDone && 'text-muted-foreground line-through opacity-75',
                !isDone && !isCurrent && 'text-muted-foreground'
              )}
            >
              {st.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
