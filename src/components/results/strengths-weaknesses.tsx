import { Card } from '@/components/ui/card';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

export function StrengthsWeaknesses({
  strengths,
  weaknesses,
}: {
  strengths: string[];
  weaknesses: string[];
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* What went well (success tinted) */}
      <Card className="p-6 border-success/30 bg-success/5 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/15 text-success">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">What Went Well</h3>
            <p className="text-xs text-muted-foreground">Demonstrated strengths and solid explanations</p>
          </div>
        </div>

        <ul className="space-y-2.5 text-xs text-foreground/90 leading-relaxed">
          {strengths.map((s, i) => (
            <li key={i} className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Needs improvement (warning tinted) */}
      <Card className="p-6 border-warning/30 bg-warning/5 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/15 text-warning">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Needs Improvement</h3>
            <p className="text-xs text-muted-foreground">Areas for deliberate preparation and refinement</p>
          </div>
        </div>

        <ul className="space-y-2.5 text-xs text-foreground/90 leading-relaxed">
          {weaknesses.map((w, i) => (
            <li key={i} className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              <span>{w}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
