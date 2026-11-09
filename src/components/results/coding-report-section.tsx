import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CodeEditor } from '@/components/session/coding/code-editor';
import { CodeReviewCard } from '@/components/session/coding/code-review-card';
import { CodingReport } from '@/lib/types';

const scoreDefinitions = [
  { key: 'problemUnderstanding', label: 'Problem understanding', weight: 15 },
  { key: 'approachAndAlgorithm', label: 'Approach & algorithm', weight: 25 },
  { key: 'codeCorrectness', label: 'Code correctness', weight: 30 },
  { key: 'complexityAnalysis', label: 'Complexity analysis', weight: 15 },
  { key: 'communication', label: 'Communication', weight: 15 },
] as const;

export function CodingReportSection({ report }: { report: CodingReport }) {
  return (
    <section className="space-y-5" aria-labelledby="coding-report-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="coding-report-title" className="text-xl font-bold text-foreground">Coding round</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {report.problem.title} · {report.language}
          </p>
        </div>
        <div className="rounded-2xl border border-primary/20 bg-primary/5 px-5 py-3 text-center">
          <span className="block text-xs font-semibold text-muted-foreground">Overall</span>
          <span className="text-2xl font-extrabold text-primary">{report.overall}<span className="text-sm"> / 100</span></span>
        </div>
      </div>

      <Card className="space-y-4 p-5">
        <h3 className="text-base font-bold text-foreground">Coding score breakdown</h3>
        {scoreDefinitions.map(({ key, label, weight }) => (
          <div key={key} className="space-y-1.5">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-foreground">{label} <span className="text-xs text-muted-foreground">({weight}% weight)</span></span>
              <span className="font-bold text-foreground">{report.scores[key]} / 100</span>
            </div>
            <Progress value={report.scores[key]} className="h-2" />
          </div>
        ))}
      </Card>

      <CodeReviewCard review={report.review} />

      <Card className="overflow-hidden">
        <div className="border-b border-border p-4">
          <h3 className="font-bold text-foreground">Your final code</h3>
          <p className="text-xs text-muted-foreground">Read-only · {report.language}</p>
        </div>
        <div className="h-[360px]">
          <CodeEditor
            value={report.finalCode}
            onChange={() => {}}
            language={report.language}
            readOnly
          />
        </div>
      </Card>

      <details className="rounded-2xl border border-border bg-card p-5">
        <summary className="cursor-pointer font-semibold text-foreground">Approach transcript</summary>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
          {report.approachTranscript || 'No approach transcript was available.'}
        </p>
      </details>
    </section>
  );
}
