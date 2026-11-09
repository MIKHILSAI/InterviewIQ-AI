import { useCallback, useEffect, useState } from 'react';
import { Target } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getWeeklyGoal } from '@/lib/api';
import type { WeeklyGoal } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { GoalDialog } from './goal-dialog';

const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const currentWeekday = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Kolkata',
  weekday: 'short',
}).format(new Date());
const todayIndex = weekdays.indexOf(currentWeekday);

export function WeeklyGoalCard() {
  const { getToken } = useAuth();
  const [goal, setGoal] = useState<WeeklyGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const token = (await getToken()) ?? undefined;
      setGoal(await getWeeklyGoal(token));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <Skeleton className="h-64 rounded-2xl" />;
  if (error || !goal) {
    return (
      <Card className="rounded-2xl p-6">
        <h2 className="font-bold text-foreground">Weekly goal</h2>
        <p className="mt-2 text-sm text-muted-foreground">Could not load your weekly goal.</p>
        <Button type="button" variant="outline" size="sm" className="mt-4" onClick={load}>
          Retry
        </Button>
      </Card>
    );
  }

  const progress = Math.min(100, Math.round((goal.completedInterviews / goal.targetInterviews) * 100));

  return (
    <>
      <Card className="rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Target className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-bold text-foreground">Weekly goal</h2>
              <p className="text-sm text-muted-foreground">
                {goal.completedInterviews} of {goal.targetInterviews} interviews this week
              </p>
            </div>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
            Edit
          </Button>
        </div>

        <div className="mt-6 space-y-2">
          <div
            className="h-3 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-label="Weekly interview goal progress"
            aria-valuemin={0}
            aria-valuemax={goal.targetInterviews}
            aria-valuenow={Math.min(goal.targetInterviews, goal.completedInterviews)}
          >
            <div
              className={`h-full rounded-full transition-[width] ${goal.achieved ? 'bg-success' : 'bg-primary'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{progress}% complete</span>
            <span>{goal.achieved ? 'Goal achieved' : `${goal.targetInterviews - goal.completedInterviews} to go`}</span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-7 gap-2">
          {weekdays.map((day, index) => (
            <div key={day} className="flex flex-col items-center gap-1.5">
              <span className={`text-[11px] ${index === todayIndex ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
                {day}
              </span>
              <span
                aria-label={`${day}${index === todayIndex ? ', today' : ''}${goal.daysActive[index] ? ', active' : ', no interview'}`}
                className={`h-3.5 w-3.5 rounded-full border ${
                  goal.daysActive[index] ? 'border-success bg-success' : 'border-border bg-muted'
                } ${index === todayIndex ? 'ring-2 ring-ring ring-offset-2 ring-offset-card' : ''}`}
              />
            </div>
          ))}
        </div>

        <div className="mt-5">
          <span className="inline-flex rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
            {goal.streakWeeks}-week streak
          </span>
        </div>
      </Card>

      <GoalDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        goal={goal}
        onSaved={setGoal}
      />
    </>
  );
}
