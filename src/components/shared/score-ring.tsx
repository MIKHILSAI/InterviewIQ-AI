import { useEffect, useState } from 'react';
import { cn, scoreTone, scoreLabel } from '@/lib/utils';

export function ScoreRing({
  score,
  size = 140,
  strokeWidth = 10,
  label,
  className,
}: {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
}) {
  const [currentPercent, setCurrentPercent] = useState(0);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const tone = scoreTone(score);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPercent(Math.min(100, Math.max(0, score)));
    }, 80);
    return () => clearTimeout(timer);
  }, [score]);

  const strokeDashoffset = circumference - (currentPercent / 100) * circumference;

  const toneColors = {
    success: '#16A34A',
    warning: '#F59E0B',
    destructive: '#DC2626',
  };

  const toneTextClasses = {
    success: 'text-success',
    warning: 'text-warning',
    destructive: 'text-destructive',
  };

  return (
    <div
      className={cn('relative inline-flex flex-col items-center justify-center select-none', className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="rotate-[-90deg]">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted/60"
        />
        {/* Animated value stroke */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={toneColors[tone]}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          className="transition-all duration-1000 ease-out"
        />
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className={cn('text-3xl font-bold tracking-tight', toneTextClasses[tone])}>
          {Math.round(score)}
        </span>
        <span className="text-xs font-medium text-muted-foreground mt-0.5">
          {label ?? scoreLabel(score)}
        </span>
      </div>
    </div>
  );
}
