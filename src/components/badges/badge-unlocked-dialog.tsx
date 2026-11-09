import { useEffect, useState } from 'react';
import { ArrowRight, Check, Sparkles } from 'lucide-react';
import type { Badge } from '@/lib/types';
import { badgePresentation, badgeToneClasses } from '@/lib/badges';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function BadgeUnlockedDialog({
  badges,
  open,
  onOpenChange,
}: {
  badges: Badge[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (open) setIndex(0);
  }, [open, badges]);

  if (!badges.length) return null;
  const badge = badges[index];
  const { icon: Icon, tone } = badgePresentation[badge.id];

  const handleContinue = () => {
    if (index + 1 < badges.length) setIndex((current) => current + 1);
    else onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden text-center">
        <div className="badge-celebration absolute inset-x-0 top-0 h-2 bg-brand-gradient" />
        <div className="badge-celebration mx-auto mt-3 flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-gradient text-primary-foreground shadow-lg">
          <Icon className="h-10 w-10" aria-hidden="true" />
        </div>
        <DialogHeader className="items-center text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Badge unlocked {badges.length > 1 && `${index + 1} of ${badges.length}`}
          </div>
          <DialogTitle className="text-2xl">{badge.name}</DialogTitle>
          <DialogDescription>{badge.description}</DialogDescription>
          <span className={`inline-flex items-center gap-1 text-sm font-semibold ${badgeToneClasses[tone].accent}`}>
            <Check className="h-4 w-4" aria-hidden="true" />
            Achievement earned
          </span>
        </DialogHeader>
        <DialogFooter className="justify-center sm:justify-center">
          <Button type="button" onClick={handleContinue} className="gap-2">
            {index + 1 < badges.length ? 'Next badge' : 'Continue'}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
