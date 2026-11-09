import { InterviewConfig } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DURATIONS, LANGUAGES } from '@/lib/constants';
import { Loader2, ArrowRight, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SummaryCardProps {
  config: Partial<InterviewConfig>;
  isValid: boolean;
  isSubmitting: boolean;
  onSubmit: () => void;
}

export function SummaryCard({
  config,
  isValid,
  isSubmitting,
  onSubmit,
}: SummaryCardProps) {
  const durationMatch = DURATIONS.find((d) => d.min === config.durationMin);
  const approxQuestions = durationMatch ? durationMatch.approxQuestions : '6-8';
  const langMatch = LANGUAGES.find((l) => l.value === config.language);

  return (
    <Card className="p-6 border-border shadow-md sticky top-20 bg-card/95 backdrop-blur-xs">
      <CardHeader className="p-0 mb-4 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-bold text-foreground">
          Interview Summary
        </CardTitle>
        <Badge variant={isValid ? 'success' : 'outline'} className="text-[10px]">
          {isValid ? 'Ready to launch' : 'Configuration incomplete'}
        </Badge>
      </CardHeader>

      <CardContent className="p-0 space-y-4">
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs">
          <p className="font-semibold text-foreground">Resume-based questions</p>
          <Link to="/onboarding/resume" className="mt-1 inline-flex items-center gap-1 font-medium text-primary hover:underline">
            Add or update resume profile
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Specification Table */}
        <div className="space-y-2.5 rounded-xl bg-muted/30 p-3.5 text-xs border border-border/60">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Type:</span>
            <span className="font-semibold text-foreground capitalize">
              {config.type || 'Technical'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{config.type === 'coding' ? 'Topic:' : 'Domain:'}</span>
            <span className={`font-semibold ${config.domain ? 'text-primary' : 'text-muted-foreground'}`}>
              {config.domain || 'Not selected'}
            </span>
          </div>

          {config.type === 'coding' && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Coding language:</span>
              <span className="font-semibold capitalize text-foreground">
                {config.codingLanguage || 'python'}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Difficulty:</span>
            <span className="font-semibold text-foreground capitalize">
              {config.difficulty || 'Intermediate'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Duration:</span>
            <span className="font-semibold text-foreground">
              {config.durationMin || 10} minutes (≈ {approxQuestions} Qs)
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Language:</span>
            <span className="font-semibold text-foreground">
              {langMatch ? langMatch.label : 'English'}
            </span>
          </div>
        </div>

        {/* Validation Checklist */}
        <div className="space-y-1.5 text-xs">
          {!config.domain ? (
            <div className="flex items-center gap-1.5 text-warning font-medium">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>Step 2: Please pick a domain above</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-success font-medium">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span>Domain selected ({config.domain})</span>
            </div>
          )}
        </div>

        {/* Start Interview CTA */}
        <Button
          type="button"
          onClick={onSubmit}
          disabled={!isValid || isSubmitting}
          className="w-full h-11 rounded-xl bg-brand-gradient text-white font-bold text-sm shadow-md hover:opacity-90 shadow-indigo-500/25 cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Preparing your interviewer…</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span>Start Interview</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </div>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
