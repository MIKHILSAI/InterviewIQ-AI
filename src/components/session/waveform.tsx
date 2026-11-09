import { useMemo } from 'react';
import { cn } from '@/lib/utils';

export function Waveform({
  level,
  isRecording,
  className,
}: {
  level: number;
  isRecording: boolean;
  className?: string;
}) {
  const bars = 40;

  // Generate varied wave shapes scaled by the audio input level
  const heights = useMemo(() => {
    return Array.from({ length: bars }).map((_, i) => {
      if (!isRecording) return 8;
      const normalizedPos = i / bars;
      const wave = Math.sin(normalizedPos * Math.PI) * 0.7 + 0.3;
      const jitter = (Math.sin(i * 1.8 + Date.now() / 200) + 1) * 0.2;
      const currentHeight = Math.max(8, Math.min(100, (wave + jitter) * level * 100));
      return currentHeight;
    });
  }, [bars, isRecording, level]);

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-[3px] h-16 w-full max-w-md px-4 py-2 rounded-2xl bg-card/60 border border-border/80 backdrop-blur-xs select-none',
        className
      )}
      aria-label="Audio recording waveform"
    >
      {heights.map((h, i) => (
        <div
          key={i}
          className={cn(
            'w-1.5 rounded-full transition-all duration-75',
            isRecording
              ? 'bg-gradient-to-t from-teal-500 via-indigo-500 to-fuchsia-500'
              : 'bg-muted h-2'
          )}
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}
