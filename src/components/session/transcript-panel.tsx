import { useState, useRef, useEffect } from 'react';
import { TranscriptTurn, AnswerEvaluation } from '@/lib/types';
import { Switch } from '@/components/ui/switch';
import { ScoreBadge } from '@/components/shared/score-badge';
import { Bot, User, Sparkles, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TranscriptPanelProps {
  turns: TranscriptTurn[];
  evaluations: Record<number, AnswerEvaluation>;
  className?: string;
}

export function TranscriptPanel({ turns, evaluations, className }: TranscriptPanelProps) {
  const [showLiveFeedback, setShowLiveFeedback] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [turns, evaluations, showLiveFeedback]);

  return (
    <div className={cn('flex flex-col h-full bg-card/60 rounded-2xl border border-border shadow-xs overflow-hidden', className)}>
      {/* Header with Live Feedback Switch */}
      <div className="flex items-center justify-between p-4 border-b border-border/80 bg-card">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Live Transcript</h3>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="live-feedback" className="text-xs font-medium text-muted-foreground cursor-pointer">
            Live feedback
          </label>
          <Switch
            id="live-feedback"
            checked={showLiveFeedback}
            onCheckedChange={setShowLiveFeedback}
          />
        </div>
      </div>

      {/* Message Chat Bubbles */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {turns.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted-foreground text-xs space-y-2">
            <Bot className="h-8 w-8 opacity-40" />
            <p>Transcript will appear here as you speak.</p>
          </div>
        ) : (
          turns.map((turn, index) => {
            const isInterviewer = turn.role === 'interviewer';
            const candidateAnswerIndex = Math.floor(index / 2);
            const evaluation = !isInterviewer ? evaluations[candidateAnswerIndex] : null;

            return (
              <div
                key={turn.id || index}
                className={cn(
                  'flex gap-2.5 animate-in fade-in-50 duration-200',
                  isInterviewer ? 'justify-start' : 'justify-end'
                )}
              >
                {isInterviewer && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary mt-1">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl p-3.5 space-y-1.5 text-xs leading-relaxed shadow-2xs',
                    isInterviewer
                      ? 'rounded-tl-xs bg-muted/60 text-foreground border border-border/60'
                      : 'rounded-tr-xs bg-primary/10 text-foreground border border-primary/20'
                  )}
                >
                  <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
                    <span className="font-semibold text-foreground/80">
                      {isInterviewer ? 'AI Interviewer' : 'Candidate'}
                    </span>
                    <span>{turn.timestamp}</span>
                  </div>

                  <p className="text-xs">{turn.text}</p>

                  {/* Optional Live Feedback Badge & Tip */}
                  {!isInterviewer && showLiveFeedback && evaluation && (
                    <div className="mt-2.5 pt-2 border-t border-border/40 space-y-1.5 animate-in fade-in-50">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-muted-foreground">Rubric Assessment:</span>
                        <ScoreBadge score={evaluation.overall} />
                      </div>
                      {evaluation.improvements && evaluation.improvements.length > 0 && (
                        <p className="text-[11px] text-muted-foreground bg-background/60 p-2 rounded-lg border border-border/40 flex items-start gap-1">
                          <Sparkles className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
                          <span>Tip: {evaluation.improvements[0]}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {!isInterviewer && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground mt-1">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
