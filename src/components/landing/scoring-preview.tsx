import { ScoreRing } from '@/components/shared/score-ring';
import { RUBRIC_WEIGHTS, RUBRIC_LABELS } from '@/lib/constants';
import { Progress } from '@/components/ui/progress';

export function LandingScoringPreview() {
  const sampleScores: Record<keyof typeof RUBRIC_WEIGHTS, number> = {
    technicalCorrectness: 82,
    conceptualUnderstanding: 78,
    completeness: 75,
    relevance: 85,
    communicationClarity: 70,
  };

  return (
    <section className="py-20 bg-muted/20 border-y border-border/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-3">
            Objective Evaluation
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            5-Point Rubric Scoring System
          </h2>
          <p className="mt-3 text-muted-foreground text-base">
            Every answer is assessed against weighted grading criteria modeled after hiring rubrics from top tech firms.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center max-w-5xl mx-auto">
          {/* Left: ScoreRing hero sample */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-8 rounded-2xl border border-border bg-card shadow-lg text-center">
            <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-4">
              Composite Round Score
            </span>
            <ScoreRing score={78} size={180} strokeWidth={12} label="Good" />
            <div className="mt-5 space-y-1">
              <h4 className="font-semibold text-foreground text-base">Benchmark Passed</h4>
              <p className="text-xs text-muted-foreground max-w-xs">
                Score of 78 meets candidate screening thresholds for mid-level software engineering positions.
              </p>
            </div>
          </div>

          {/* Right: Rubric Weights with progress bars */}
          <div className="lg:col-span-7 rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-lg space-y-5">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <span className="text-sm font-semibold text-foreground">Rubric Dimension</span>
              <span className="text-xs font-medium text-muted-foreground">Weight &amp; Sample Score</span>
            </div>

            {(Object.keys(RUBRIC_WEIGHTS) as (keyof typeof RUBRIC_WEIGHTS)[]).map((key) => {
              const weightPercent = Math.round(RUBRIC_WEIGHTS[key] * 100);
              const score = sampleScores[key];
              const label = RUBRIC_LABELS[key];

              return (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{label}</span>
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                        {weightPercent}%
                      </span>
                      <span className="text-xs font-bold text-foreground w-8 text-right">
                        {score}
                      </span>
                    </div>
                  </div>
                  <Progress value={score} className="h-2" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
