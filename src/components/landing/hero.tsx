import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { VoiceOrb } from '@/components/shared/voice-orb';
import { ArrowRight, Sparkles, Volume2 } from 'lucide-react';

export function LandingHero() {
  const scrollToHowItWorks = () => {
    document.querySelector('#how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
      {/* Background radial gradient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-indigo-500/15 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[300px] bg-fuchsia-500/10 blur-[100px] rounded-full pointer-events-none -z-10" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Copy & Actions */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Powered by Gnani Prisma + Timbre</span>
            </div>

            {/* H1 */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.12]">
              Practice interviews you can{' '}
              <span className="text-brand-gradient">actually talk through</span>.
            </h1>

            {/* Subcopy */}
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto lg:mx-0">
              An AI interviewer that speaks, listens, asks smart follow-ups and scores your answers. Built for placements and tech interviews.
            </p>

            {/* Two CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
              <Button asChild variant="gradient" size="lg" className="w-full sm:w-auto text-base px-8 h-12 shadow-lg shadow-indigo-500/25">
                <Link to="/sign-up">
                  <span>Start practicing free</span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={scrollToHowItWorks}
                className="w-full sm:w-auto text-base h-12 bg-card hover:bg-muted"
              >
                See how it works
              </Button>
            </div>

            {/* Trust line */}
            <div className="pt-3 text-xs sm:text-sm text-muted-foreground font-medium flex items-center justify-center lg:justify-start gap-2">
              <span>Technical</span>
              <span>•</span>
              <span>HR</span>
              <span>•</span>
              <span>English &amp; Tamil</span>
            </div>
          </div>

          {/* Right Column: CSS-built mock of interview room */}
          <div className="lg:col-span-5 relative flex justify-center">
            {/* Floating Score Chips */}
            <div className="absolute -top-3 -left-2 sm:left-4 z-20 rounded-full border border-success/40 bg-card/90 backdrop-blur-md px-3.5 py-1.5 shadow-lg flex items-center gap-2 animate-bounce [animation-duration:4s]">
              <div className="h-2 w-2 rounded-full bg-success" />
              <span className="text-xs font-semibold text-foreground">Technical 85</span>
            </div>

            <div className="absolute -bottom-3 -right-2 sm:right-4 z-20 rounded-full border border-indigo-500/40 bg-card/90 backdrop-blur-md px-3.5 py-1.5 shadow-lg flex items-center gap-2 animate-bounce [animation-duration:5s] [animation-delay:1s]">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-xs font-semibold text-foreground">Clarity 70</span>
            </div>

            {/* Main Mock Room Card */}
            <div className="w-full max-w-md rounded-2xl border border-border/80 bg-card/90 backdrop-blur-xl p-6 shadow-2xl space-y-5">
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-destructive animate-pulse" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Live Session • Python
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
                  <Volume2 className="h-3.5 w-3.5 text-primary" />
                  <span>07:42 remaining</span>
                </div>
              </div>

              {/* Centered Voice Orb */}
              <div className="flex flex-col items-center justify-center py-2">
                <VoiceOrb state="speaking" size={130} />
                <span className="text-xs font-medium text-primary mt-3 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
                  Interviewer is speaking...
                </span>
              </div>

              {/* Question Caption Bubble */}
              <div className="rounded-xl border border-border/80 bg-muted/60 p-3.5 text-sm font-medium text-foreground leading-relaxed">
                <p className="text-xs text-primary font-semibold mb-1">Interviewer (Timbre):</p>
                "Can you explain the difference between a process and a thread in terms of memory sharing?"
              </div>

              {/* 24-bar animated waveform */}
              <div className="rounded-xl border border-border/60 bg-background/50 p-3 flex items-center justify-center gap-1 h-12">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1 rounded-full bg-gradient-to-t from-indigo-500 to-fuchsia-500"
                    style={{
                      height: `${Math.max(15, Math.sin(i * 0.45) * 85)}%`,
                      animation: 'pulse 1.4s ease-in-out infinite',
                      animationDelay: `${(i % 8) * 0.15}s`,
                    }}
                  />
                ))}
              </div>

              {/* Candidate Bubble */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
                <span className="font-semibold text-primary">Candidate (Transcribing Prisma...):</span>
                <p className="text-foreground/90 mt-0.5">
                  "Processes possess independent address spaces, whereas threads in the same process share heap memory..."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
