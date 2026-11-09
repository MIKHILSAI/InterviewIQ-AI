import { cn } from '@/lib/utils';

export function Logo({
  size = 'md',
  showText = true,
  variant = 'default',
  className,
}: {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  variant?: 'default' | 'light';
  className?: string;
}) {
  const iconSizes = {
    sm: 32,
    md: 44,
    lg: 60,
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-3xl',
  };

  return (
    <div className={cn('flex items-center gap-3 select-none', className)}>
      <img
        src="/assets/icon.svg"
        alt="InterviewIQ AI"
        width={iconSizes[size]}
        height={iconSizes[size]}
        draggable={false}
        className="shrink-0"
      />
      {showText && (
        <span
          className={cn(
            'font-semibold tracking-tight',
            variant === 'light' ? 'text-white' : 'text-foreground',
            textSizes[size]
          )}
        >
          InterviewIQ{' '}
          <span className={cn('font-extrabold', variant === 'light' ? 'text-white' : 'text-primary')}>
            AI
          </span>
        </span>
      )}
    </div>
  );
}
