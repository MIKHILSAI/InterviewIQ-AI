import { Logo } from '@/components/shared/logo';
import { ConfigBadges } from '@/components/shared/config-badges';
import { InterviewConfig } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Clock, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SessionTopbarProps {
  config: InterviewConfig;
  questionIndex: number;
  totalQuestions: number;
  remainingSeconds: number;
  onEndEarly: () => void;
}

export function SessionTopbar({
  config,
  questionIndex,
  totalQuestions,
  remainingSeconds,
  onEndEarly,
}: SessionTopbarProps) {
  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  const timeFormatted = `${mins}:${secs.toString().padStart(2, '0')}`;
  const isTimeCritical = remainingSeconds < 60;

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-border bg-card/85 backdrop-blur-md px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <Logo size="sm" showText={false} />
        <div className="hidden sm:block">
          <ConfigBadges config={config} />
        </div>
      </div>

      {/* Middle: Question counter and dots */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold text-foreground">
          Question {questionIndex + 1}
        </span>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalQuestions }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-2 w-2 rounded-full transition-all duration-300',
                i === questionIndex
                  ? 'bg-primary scale-125'
                  : i < questionIndex
                  ? 'bg-success'
                  : 'bg-muted'
              )}
            />
          ))}
        </div>
      </div>

      {/* Right: Countdown timer & End interview dialog */}
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono font-bold transition-colors select-none',
            isTimeCritical
              ? 'border-warning/50 bg-warning/10 text-warning animate-pulse'
              : 'border-border bg-muted/50 text-foreground'
          )}
        >
          <Clock className="h-3.5 w-3.5" />
          <span>{timeFormatted}</span>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5 mr-1" />
              <span className="hidden sm:inline">End interview</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>End interview early?</AlertDialogTitle>
              <AlertDialogDescription>
                Your answers submitted so far will still be graded and compiled into a performance report. Are you sure you want to exit now?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Continue Interview</AlertDialogCancel>
              <AlertDialogAction onClick={onEndEarly}>
                End &amp; Get Report
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </header>
  );
}
