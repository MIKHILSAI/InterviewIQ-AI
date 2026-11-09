import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { setWeeklyGoal } from '@/lib/api';
import type { WeeklyGoal } from '@/lib/types';
import { toast } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function GoalDialog({
  open,
  onOpenChange,
  goal,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: WeeklyGoal;
  onSaved: (goal: WeeklyGoal) => void;
}) {
  const { getToken } = useAuth();
  const [target, setTarget] = useState(goal.targetInterviews);
  const [saving, setSaving] = useState(false);

  useEffect(() => setTarget(goal.targetInterviews), [goal.targetInterviews, open]);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const token = (await getToken()) ?? undefined;
      const updated = await setWeeklyGoal(target, token);
      onSaved(updated);
      toast.success('Weekly goal updated.');
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update your weekly goal.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit weekly goal</DialogTitle>
          <DialogDescription>
            Choose how many completed interviews you want to finish each week.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <label htmlFor="weekly-goal-target" className="text-sm font-medium text-foreground">
            Interviews per week
          </label>
          <select
            id="weekly-goal-target"
            value={target}
            onChange={(event) => setTarget(Number(event.target.value))}
            className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {Array.from({ length: 14 }, (_, index) => index + 1).map((count) => (
              <option key={count} value={count}>
                {count} {count === 1 ? 'interview' : 'interviews'} per week
              </option>
            ))}
          </select>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save goal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
