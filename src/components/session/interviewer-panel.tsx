import { Question, Language } from '@/lib/types';
import { VoiceOrb, VoiceOrbState } from '@/components/shared/voice-orb';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, RotateCcw, FastForward, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InterviewerPanelProps {
  question: Question;
  language: Language;
  orbState: VoiceOrbState;
  statusLabel: string;
  isSpeaking: boolean;
  needsGesture: boolean;
  onPlayAudio: () => void;
  onSkipAudio: () => void;
  onReplayAudio: () => void;
}

export function InterviewerPanel({
  question,
  language,
  orbState,
  statusLabel,
  isSpeaking,
  needsGesture,
  onPlayAudio,
  onSkipAudio,
  onReplayAudio,
}: InterviewerPanelProps) {
  const isTamil = language === 'ta';
  const isHindi = language === 'hi';

  return (
    <div className="flex flex-col items-center justify-center text-center space-y-6 max-w-2xl mx-auto py-4">
      {/* Centered Voice Orb */}
      <div className="relative flex flex-col items-center">
        <VoiceOrb state={orbState} size={150} />

        {/* Status indicator under orb */}
        <div className="mt-4 flex items-center gap-2">
          {orbState === 'speaking' && (
            <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
          )}
          {orbState === 'listening' && (
            <span className="h-2 w-2 rounded-full bg-teal-400 animate-ping" />
          )}
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Autoplay blocked banner if required */}
      {needsGesture && (
        <Button
          onClick={onPlayAudio}
          variant="gradient"
          size="sm"
          className="rounded-xl shadow-md gap-2 animate-bounce"
        >
          <Play className="h-3.5 w-3.5 fill-white" />
          <span>Tap to play question audio</span>
        </Button>
      )}

      {/* Question Card & Live Captions */}
      <div className="w-full rounded-2xl border border-border bg-card p-6 shadow-sm text-left relative space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Interviewer Question
          </span>
          {question.isFollowUp && (
            <Badge variant="gradient" className="gap-1 text-xs px-2.5 py-0.5">
              <Sparkles className="h-3 w-3" />
              <span>Adaptive Follow-up</span>
            </Badge>
          )}
        </div>

        <p
          className={cn(
            'text-lg sm:text-xl font-medium text-foreground leading-relaxed',
            isTamil && 'font-tamil',
            isHindi && 'font-hindi'
          )}
        >
          &ldquo;{question.text}&rdquo;
        </p>

        {/* Audio control actions */}
        <div className="pt-2 flex items-center justify-end gap-2 border-t border-border/50 text-xs">
          {isSpeaking && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onSkipAudio}
              className="h-8 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <FastForward className="h-3.5 w-3.5 mr-1" />
              <span>Skip audio</span>
            </Button>
          )}
          {!isSpeaking && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onReplayAudio}
              className="h-8 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              <span>Replay question</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
