import { useState } from 'react';
import { QuestionResult, Language } from '@/lib/types';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { ScoreBadge } from '@/components/shared/score-badge';
import { Button } from '@/components/ui/button';
import { RUBRIC_WEIGHTS, RUBRIC_LABELS } from '@/lib/constants';
import { Sparkles, Volume2, CheckCircle2, ChevronRight, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export function QuestionReview({
  results,
  language,
}: {
  results: QuestionResult[];
  language: Language;
}) {
  const [playingModelAnswerId, setPlayingModelAnswerId] = useState<string | null>(null);

  const handleSpeakModelAnswer = (id: string, text: string) => {
    if (playingModelAnswerId === id) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setPlayingModelAnswerId(null);
      return;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setPlayingModelAnswerId(null);
      utterance.onerror = () => setPlayingModelAnswerId(null);
      window.speechSynthesis.speak(utterance);
      setPlayingModelAnswerId(id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">
          Detailed Question-by-Question Review
        </h2>
        <span className="text-xs text-muted-foreground">
          Click any question to view transcript, rubric scores, and model answers
        </span>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-sm">
        <Accordion type="single" collapsible defaultValue="q-0">
          {results.map((res, index) => {
            const q = res.question;
            const evalScores = res.evaluation.scores;
            const rubricKeys = Object.keys(RUBRIC_WEIGHTS) as (keyof typeof evalScores)[];

            return (
              <AccordionItem key={q.id || index} value={`q-${index}`}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center justify-between gap-4 w-full pr-2 text-left">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-extrabold text-primary">
                        Q{index + 1}
                      </span>

                      <span className="font-semibold text-sm text-foreground truncate max-w-xs sm:max-w-md lg:max-w-xl">
                        {q.text}
                      </span>

                      {q.isFollowUp && (
                        <Badge variant="gradient" className="text-[10px] gap-1 shrink-0 px-2 py-0.5">
                          <Sparkles className="h-2.5 w-2.5" />
                          <span>Follow-up</span>
                        </Badge>
                      )}
                    </div>

                    <div className="shrink-0">
                      <ScoreBadge score={res.evaluation.overall} />
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="space-y-5 pt-3 pb-6">
                  {/* Full question text */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Full Question
                    </span>
                    <p className="text-sm font-medium text-foreground bg-muted/30 p-3.5 rounded-xl border border-border/60">
                      &ldquo;{q.text}&rdquo;
                    </p>
                  </div>

                  {/* Candidate Answer Quote */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                      Your Spoken Answer (Prisma Transcript)
                    </span>
                    <blockquote
                      className={cn(
                        'text-xs italic text-foreground/90 bg-primary/5 border-l-4 border-primary p-3.5 rounded-r-xl leading-relaxed',
                        language === 'ta' && 'font-tamil',
                        language === 'hi' && 'font-hindi'
                      )}
                    >
                      &ldquo;{res.transcript}&rdquo;
                    </blockquote>
                  </div>

                  {/* 5 Mini Rubric Score Pills */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Score Breakdown
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {rubricKeys.map((key) => {
                        const score = evalScores[key];
                        const label = RUBRIC_LABELS[key];
                        return (
                          <div
                            key={key}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card border border-border text-xs"
                          >
                            <span className="text-muted-foreground">{label}:</span>
                            <span className="font-bold text-foreground">{score}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Strengths & Improvements */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 rounded-xl bg-success/5 border border-success/20 space-y-2">
                      <span className="font-bold text-success flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Strengths</span>
                      </span>
                      <ul className="space-y-1 text-foreground/90">
                        {res.evaluation.strengths.map((str, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-success font-bold">•</span>
                            <span>{str}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3.5 rounded-xl bg-warning/5 border border-warning/20 space-y-2">
                      <span className="font-bold text-warning flex items-center gap-1.5">
                        <ChevronRight className="h-3.5 w-3.5" />
                        <span>Suggested Improvements</span>
                      </span>
                      <ul className="space-y-1 text-foreground/90">
                        {res.evaluation.improvements.map((imp, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-warning font-bold">•</span>
                            <span>{imp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Missing Concepts Badges */}
                  {res.evaluation.missingConcepts && res.evaluation.missingConcepts.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Missing or Unmentioned Concepts
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {res.evaluation.missingConcepts.map((concept, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="text-xs border-dashed border-border/80 text-muted-foreground"
                          >
                            {concept}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Model Answer (Collapsible with Listen button) */}
                  {res.evaluation.modelAnswer && (
                    <div className="p-4 rounded-xl bg-muted/40 border border-border/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-primary" />
                          <span className="text-xs font-bold text-foreground">
                            Ideal Model Answer
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="no-print h-7 text-xs text-primary hover:text-primary gap-1"
                          onClick={() =>
                            handleSpeakModelAnswer(q.id || `q-${index}`, res.evaluation.modelAnswer!)
                          }
                        >
                          <Volume2 className="h-3 w-3" />
                          <span>
                            {playingModelAnswerId === (q.id || `q-${index}`)
                              ? 'Stop'
                              : 'Listen to model'}
                          </span>
                        </Button>
                      </div>
                      <p className="text-xs text-foreground/90 leading-relaxed">
                        {res.evaluation.modelAnswer}
                      </p>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </div>
  );
}
