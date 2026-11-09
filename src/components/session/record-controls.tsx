import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, RotateCcw, Send, Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SessionPhase =
  | 'intro'
  | 'asking'
  | 'ready'
  | 'recording'
  | 'review'
  | 'processing'
  | 'finishing'
  | 'error';

interface RecordControlsProps {
  phase: SessionPhase;
  durationMs: number;
  blob: Blob | null;
  onStartRecord: () => void;
  onStopRecord: () => void;
  onRerecord: () => void;
  onSubmitAnswer: () => void;
}

export function RecordControls({
  phase,
  durationMs,
  blob,
  onStartRecord,
  onStopRecord,
  onRerecord,
  onSubmitAnswer,
}: RecordControlsProps) {
  const [isPlayingPreview, setIsPlayingPreview] = React.useState(false);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  // Keyboard shortcut listener: Space to toggle record/stop when in ready or recording state
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

        if (phase === 'ready') {
          e.preventDefault();
          onStartRecord();
        } else if (phase === 'recording') {
          e.preventDefault();
          onStopRecord();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, onStartRecord, onStopRecord]);

  const togglePreview = () => {
    if (!blob) return;
    if (audioPreviewRef.current) {
      if (isPlayingPreview) {
        audioPreviewRef.current.pause();
        setIsPlayingPreview(false);
      } else {
        audioPreviewRef.current.play().then(() => setIsPlayingPreview(true)).catch(() => {});
      }
    } else {
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioPreviewRef.current = audio;
      audio.onended = () => setIsPlayingPreview(false);
      audio.play().then(() => setIsPlayingPreview(true)).catch(() => {});
    }
  };

  const elapsedSec = Math.floor(durationMs / 1000);
  const elapsedMins = Math.floor(elapsedSec / 60);
  const elapsedRemSec = elapsedSec % 60;
  const timerStr = `${elapsedMins}:${elapsedRemSec.toString().padStart(2, '0')}`;

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      {/* Ready Phase: Big mic button */}
      {phase === 'ready' && (
        <div className="flex flex-col items-center space-y-2">
          <button
            type="button"
            onClick={onStartRecord}
            className="group relative flex h-20 w-20 items-center justify-center rounded-full bg-primary text-white shadow-xl shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95 cursor-pointer focus:outline-none focus:ring-4 focus:ring-primary/40"
            aria-label="Tap to speak your answer"
          >
            <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-25 group-hover:opacity-40" />
            <Mic className="h-8 w-8 relative z-10" />
          </button>
          <span className="text-sm font-semibold text-foreground">Tap to answer</span>
          <span className="text-[11px] text-muted-foreground">or press Spacebar</span>
        </div>
      )}

      {/* Recording Phase: Stop button & timer */}
      {phase === 'recording' && (
        <div className="flex flex-col items-center space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="font-mono text-sm font-bold text-rose-500">{timerStr} / 2:00</span>
          </div>

          <button
            type="button"
            onClick={onStopRecord}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-rose-600 text-white shadow-xl shadow-rose-500/30 transition-all hover:scale-105 active:scale-95 cursor-pointer focus:outline-none focus:ring-4 focus:ring-rose-500/40"
            aria-label="Tap to finish recording"
          >
            <Square className="h-8 w-8 fill-white" />
          </button>

          <span className="text-sm font-semibold text-foreground">Tap to stop</span>
          <span className="text-[11px] text-muted-foreground">Press Space or Enter to complete</span>
        </div>
      )}

      {/* Review Phase: Preview, re-record, submit */}
      {phase === 'review' && (
        <div className="w-full max-w-md p-4 rounded-2xl bg-card border border-border shadow-md space-y-4 text-center animate-in fade-in-50">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-semibold text-muted-foreground">Answer Recorded</span>
            <span className="text-xs font-mono font-medium text-foreground">{timerStr}</span>
          </div>

          {/* Audio preview playback bar */}
          <div className="flex items-center justify-center gap-3 py-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={togglePreview}
              className="gap-2 rounded-xl text-xs"
            >
              {isPlayingPreview ? (
                <>
                  <Pause className="h-3.5 w-3.5" />
                  <span>Pause playback</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Listen to your recording</span>
                </>
              )}
            </Button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onRerecord}
              className="flex-1 rounded-xl gap-1.5 cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Re-record</span>
            </Button>

            <Button
              type="button"
              variant="gradient"
              onClick={onSubmitAnswer}
              className="flex-1 rounded-xl gap-1.5 font-bold cursor-pointer"
            >
              <span>Submit answer</span>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Asking or Processing Status message */}
      {(phase === 'asking' || phase === 'processing' || phase === 'finishing') && (
        <div className="h-12 flex items-center justify-center">
          <span className="text-xs font-medium text-muted-foreground">
            {phase === 'asking' && 'Listen to the interviewer...'}
            {phase === 'processing' && 'Evaluating with Prisma & rubric models...'}
            {phase === 'finishing' && 'Finalizing interview performance report...'}
          </span>
        </div>
      )}
    </div>
  );
}
