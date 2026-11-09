import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { getReport, ApiError } from '@/lib/api';
import { InterviewReport } from '@/lib/types';
import { ReportHeader } from '@/components/results/report-header';
import { OverallScoreCard } from '@/components/results/overall-score-card';
import { RubricBreakdown } from '@/components/results/rubric-breakdown';
import { TopicChart } from '@/components/results/topic-chart';
import { StrengthsWeaknesses } from '@/components/results/strengths-weaknesses';
import { QuestionReview } from '@/components/results/question-review';
import { StudyPlan } from '@/components/results/study-plan';
import { EmptyState } from '@/components/shared/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { FileQuestion, RotateCcw, Sparkles, History, Plus } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { Badge } from '@/lib/types';
import { BadgeUnlockedDialog } from '@/components/badges/badge-unlocked-dialog';
import { CodingReportSection } from '@/components/results/coding-report-section';

export function ResultsPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { getToken } = useAuth();

  const [report, setReport] = useState<InterviewReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [is404, setIs404] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [newBadges, setNewBadges] = useState<Badge[]>([]);
  const [showBadgeDialog, setShowBadgeDialog] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    const storageKey = `iiq:newBadges:${sessionId}`;
    try {
      const stored = sessionStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as Badge[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setNewBadges(parsed);
          setShowBadgeDialog(true);
        }
      }
    } catch {
      // Discard malformed one-time celebration state.
    } finally {
      try {
        sessionStorage.removeItem(storageKey);
      } catch {
        // Storage may be unavailable in restricted browser contexts.
      }
    }
  }, [sessionId]);

  const fetchReport = useCallback(async () => {
    if (!sessionId) return;
    setIsLoading(true);
    setHasError(false);
    setIs404(false);

    try {
      const token = (await getToken()) ?? undefined;
      const res = await getReport(sessionId, token);
      setReport(res);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 404) {
        setIs404(true);
      } else {
        setHasError(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, getToken]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  if (isLoading) {
    return (
      <div className="space-y-8 animate-in fade-in-50 duration-300">
        <div className="space-y-2">
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Skeleton className="h-52 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-44 rounded-2xl" />
          <Skeleton className="h-44 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (is404) {
    return (
      <div className="py-12">
        <EmptyState
          icon={FileQuestion}
          title="Report Not Found"
          description="We couldn't locate an interview report for this session ID. It may have been expired or cleared."
          action={
            <Button asChild variant="gradient">
              <Link to="/dashboard">Back to Dashboard</Link>
            </Button>
          }
        />
      </div>
    );
  }

  if (hasError || !report) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-destructive/30 bg-destructive/5 space-y-4 my-8">
        <h2 className="text-xl font-bold text-foreground">Couldn&apos;t load the interview report</h2>
        <p className="text-sm text-muted-foreground">
          An error occurred while fetching the evaluation results.
        </p>
        <Button onClick={fetchReport} variant="outline" className="gap-2">
          <RotateCcw className="h-4 w-4" />
          <span>Retry</span>
        </Button>
      </div>
    );
  }

  return (
    <div id="report" className="space-y-8 pb-12">
      <BadgeUnlockedDialog
        badges={newBadges}
        open={showBadgeDialog}
        onOpenChange={setShowBadgeDialog}
      />
      {/* Print-only header */}
      <div className="hidden print:block mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold">InterviewIQ AI Performance Report</h1>
        <p className="text-sm text-gray-600">
          Generated on {formatDate(report.completedAt)} • Candidate: {report.config.domain} ({report.config.type})
        </p>
      </div>

      {/* 1. Header with metadata and action buttons */}
      <ReportHeader report={report} />

      {/* 2. Hero Overall Score Card & 2x2 Mini Grid */}
      <OverallScoreCard report={report} />

      {/* 3. 5-Point Rubric Breakdown & Radar Chart */}
      <RubricBreakdown scores={report.scores} />

      {/* 4. Horizontal Topic Bar Chart */}
      <TopicChart topicScores={report.topicScores} />

      {/* 5. What went well & Needs improvement */}
      <StrengthsWeaknesses
        strengths={report.strengths}
        weaknesses={report.weaknesses}
      />

      {/* 6. Accordion Question-by-Question Review with Model Answers */}
      <QuestionReview results={report.results} language={report.config.language} />

      {/* 7. Preparation Study Plan */}
      <StudyPlan studyPlan={report.studyPlan} />

      {report.coding && <CodingReportSection report={report.coding} />}

      {/* 8. Footer CTA Band (no-print) */}
      <div className="rounded-2xl bg-card border border-border p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm no-print mt-12">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-lg font-bold text-foreground">Ready for another round?</h3>
          <p className="text-xs text-muted-foreground">
            Consistent voice practice improves clarity, structure, and pacing dramatically.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm">
            <Link to="/history" className="gap-1.5">
              <History className="h-4 w-4" />
              <span>View History</span>
            </Link>
          </Button>

          <Button asChild variant="gradient" size="sm">
            <Link to="/setup" className="gap-1.5 font-semibold">
              <Plus className="h-4 w-4" />
              <span>Start New Interview</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
