import { RubricScores } from '@/lib/types';
import { RUBRIC_WEIGHTS, RUBRIC_LABELS } from '@/lib/constants';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { scoreTone } from '@/lib/utils';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

export function RubricBreakdown({ scores }: { scores: RubricScores }) {
  const rubricKeys = Object.keys(RUBRIC_WEIGHTS) as (keyof RubricScores)[];

  const radarData = rubricKeys.map((key) => ({
    subject: RUBRIC_LABELS[key],
    score: scores[key],
    fullMark: 100,
  }));

  const toneProgressClass = {
    success: 'bg-success',
    warning: 'bg-warning',
    destructive: 'bg-destructive',
  };

  return (
    <Card className="p-6 border-border">
      <CardHeader className="p-0 mb-6">
        <CardTitle className="text-lg font-bold text-foreground">
          5-Point Rubric Evaluation Breakdown
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left: Rubric Progress Rows (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-4">
          {rubricKeys.map((key) => {
            const score = scores[key];
            const weightPercent = Math.round(RUBRIC_WEIGHTS[key] * 100);
            const label = RUBRIC_LABELS[key];
            const tone = scoreTone(score);

            return (
              <div key={key} className="space-y-1.5 p-3 rounded-xl bg-muted/20 border border-border/40">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{label}</span>
                    <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                      {weightPercent}% weight
                    </span>
                  </div>
                  <span className="font-bold text-foreground">{score} / 100</span>
                </div>
                <Progress
                  value={score}
                  className="h-2"
                  indicatorClassName={toneProgressClass[tone]}
                />
              </div>
            );
          })}
        </div>

        {/* Right: Recharts RadarChart (lg:col-span-5) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="#334155" opacity={0.4} />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: '#94A3B8', fontSize: 10 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  stroke="#64748B"
                  fontSize={10}
                  tickCount={4}
                />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="#6366F1"
                  fill="#4F46E5"
                  fillOpacity={0.45}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as { subject: string; score: number };
                      return (
                        <div className="rounded-xl border border-border bg-card p-2.5 shadow-lg text-xs">
                          <span className="font-semibold text-foreground">{data.subject}</span>
                          <div className="font-bold text-primary mt-0.5">{data.score} / 100</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <span className="text-[11px] text-muted-foreground mt-2">
            Radial Competency Profile
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
