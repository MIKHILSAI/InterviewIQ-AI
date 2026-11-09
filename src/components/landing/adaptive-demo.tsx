import { Sparkles, Bot, User, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function LandingAdaptiveDemo() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Context */}
          <div className="lg:col-span-5 space-y-5">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-600 dark:text-teal-400">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Real-Time Contextual Adaptation</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight leading-tight">
              Questions that evolve with your answers.
            </h2>

            <p className="text-muted-foreground text-base leading-relaxed">
              Static question banks reward memorization. InterviewIQ listens to the exact technical terminology you mention, detects ambiguities or missing edge cases, and dynamically crafts intelligent follow-ups on the fly.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-teal-500 shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">Extracts concepts from your voice transcription</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-teal-500 shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">Probes specific trade-offs and edge cases</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-teal-500 shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">Simulates authentic senior engineer interview rounds</span>
              </div>
            </div>
          </div>

          {/* Right Column: Chat-style transcript */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-border/80 pb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Adaptive Transcript Sample
                </span>
                <span className="text-xs text-primary font-medium">Domain: Operating Systems</span>
              </div>

              {/* Turn 1: AI initial question */}
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0 mt-1">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex-1 rounded-2xl rounded-tl-xs bg-muted/60 p-4 border border-border/60">
                  <p className="text-xs font-semibold text-primary mb-1">AI Interviewer</p>
                  <p className="text-sm text-foreground leading-relaxed">
                    "Can you explain the difference between a process and a thread, especially regarding memory space?"
                  </p>
                </div>
              </div>

              {/* Turn 2: Candidate Spoken Answer */}
              <div className="flex items-start gap-3 justify-end">
                <div className="flex-1 rounded-2xl rounded-tr-xs bg-primary/10 p-4 border border-primary/20 text-right max-w-lg">
                  <p className="text-xs font-semibold text-primary mb-1">Candidate (Spoken)</p>
                  <p className="text-sm text-foreground leading-relaxed text-left">
                    "A process has its own dedicated address space with text, data, and heap. Threads within that process share the same address space and shared memory, but each thread maintains its own stack and registers."
                  </p>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted text-foreground shrink-0 mt-1">
                  <User className="h-4 w-4" />
                </div>
              </div>

              {/* Turn 3: AI Follow-Up with Follow-up Badge */}
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-gradient text-white shrink-0 mt-1 shadow-sm">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="flex-1 rounded-2xl rounded-tl-xs bg-card border-2 border-primary/30 p-4 shadow-sm relative">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-foreground">AI Interviewer</span>
                    <Badge variant="gradient" className="text-[11px] gap-1 px-2 py-0.5">
                      <Sparkles className="h-3 w-3" />
                      <span>Adaptive Follow-up</span>
                    </Badge>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">
                    "You mentioned shared memory. What happens if two threads attempt to modify the same variable concurrently, and what synchronization mechanisms would you use to prevent race conditions?"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
