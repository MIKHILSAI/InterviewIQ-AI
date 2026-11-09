import { InterviewReport } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { ScoreRing } from '@/components/shared/score-ring';
import { scoreLabel } from '@/lib/utils';
import { Award, CheckCircle, AlertTriangle, MessageSquare } from 'lucide-react';

export function OverallScoreCard({ report }: { report: InterviewReport }) {
  const answeredCount = report.results.length;
  const avgPerQuestion =
    answeredCount > 0
      ? Math.round(
          report.results.reduce((acc, r) => acc + r.evaluation.overall, 0) / answeredCount
        )
      : report.overallScore;

  // Derive strongest and weakest topics
  const sortedTopics = [...report.topicScores].sort((a, b) => b.score - a.score);
  const strongestTopic = sortedTopics[0]?.topic || report.config.domain;
  const weakestTopic = sortedTopics[sortedTopics.length - 1]?.topic || 'Edge cases';

  return (
    <Card className="p-6 sm:p-8 border-border bg-card shadow-md">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left: Big ScoreRing & Feedback */}
        <div className="lg:col-span-7 flex flex-col sm:flex-row items-center gap-6 sm:gap-8 text-center sm:text-left">
          <div className="shrink-0">
            <ScoreRing
              score={report.overallScore}
              size={180}
              strokeWidth={14}
              label={scoreLabel(report.overallScore)}
            />
          </div>

          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Award className="h-3.5 w-3.5" />
              <span>AI Executive Summary</span>
            </div>
            <p className="text-sm text-foreground/90 leading-relaxed">
              {report.summaryFeedback}
            </p>
          </div>
        </div>

        {/* Right: 2x2 Mini Metric Grid */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-3 pt-4 lg:pt-0 lg:border-l lg:border-border/80 lg:pl-8">
          <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
              <MessageSquare className="h-3.5 w-3.5 text-primary" />
              <span>Questions Answered</span>
            </div>
            <div className="text-xl font-extrabold text-foreground">{answeredCount}</div>
            <div className="text-[11px] text-muted-foreground">Interactive rounds</div>
          </div>

          <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
              <Award className="h-3.5 w-3.5 text-primary" />
              <span>Avg / Question</span>
            </div>
            <div className="text-xl font-extrabold text-foreground">{avgPerQuestion}%</div>
            <div className="text-[11px] text-muted-foreground">Mean performance</div>
          </div>

          <div className="p-3.5 rounded-xl bg-success/5 border border-success/20 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-success font-semibold">
              <CheckCircle className="h-3.5 w-3.5" />
              <span>Strongest Area</span>
            </div>
            <div className="text-xs font-bold text-foreground truncate" title={strongestTopic}>
              {strongestTopic}
            </div>
            <div className="text-[11px] text-success font-medium">Top percentiles</div>
          </div>

          <div className="p-3.5 rounded-xl bg-warning/5 border border-warning/20 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-warning font-semibold">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Weakest Area</span>
            </div>
            <div className="text-xs font-bold text-foreground truncate" title={weakestTopic}>
              {weakestTopic}
            </div>
            <div className="text-[11px] text-warning font-medium">Practice recommended</div>
          </div>
        </div>
      </div>
    </Card>
  );
}
