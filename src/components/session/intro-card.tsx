import { InterviewConfig } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ConfigBadges } from '@/components/shared/config-badges';
import { VoiceOrb } from '@/components/shared/voice-orb';
import { Sparkles, Headphones, Mic, Volume2 } from 'lucide-react';

interface IntroCardProps {
  config: InterviewConfig;
  onBegin: () => void;
}

export function IntroCard({ config, onBegin }: IntroCardProps) {
  return (
    <div className="flex items-center justify-center min-h-[75vh] p-4">
      <Card className="w-full max-w-xl p-8 border-border bg-card shadow-2xl text-center space-y-6 animate-in fade-in-50 zoom-in-95 duration-300">
        <div className="flex justify-center">
          <VoiceOrb state="idle" size={130} />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Ready when you are
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            Your AI interviewer will speak the first question aloud. Listen closely, and tap to speak your response when prompted.
          </p>
        </div>

        <div className="flex justify-center">
          <ConfigBadges config={config} />
        </div>

        {/* Tips grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2">
          <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <Headphones className="h-3.5 w-3.5 text-primary" />
              <span>Headphones</span>
            </div>
            <p className="text-muted-foreground text-[11px]">Recommended to avoid audio echo feedback</p>
          </div>

          <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <Mic className="h-3.5 w-3.5 text-primary" />
              <span>Clear Speech</span>
            </div>
            <p className="text-muted-foreground text-[11px]">Speak at a natural pace with complete sentences</p>
          </div>

          <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <Volume2 className="h-3.5 w-3.5 text-primary" />
              <span>Audio On</span>
            </div>
            <p className="text-muted-foreground text-[11px]">Ensure your device volume is turned up</p>
          </div>
        </div>

        <div className="pt-2">
          <Button
            type="button"
            onClick={onBegin}
            variant="gradient"
            size="lg"
            className="w-full sm:w-auto px-10 h-12 text-base font-bold shadow-lg shadow-indigo-500/25 rounded-xl cursor-pointer"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            <span>Begin Interview</span>
          </Button>
        </div>
      </Card>
    </div>
  );
}
