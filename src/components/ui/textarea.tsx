import * as React from 'react';
import { cn } from '@/lib/utils';

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-xl border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export function Avatar({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border bg-muted', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function AvatarImage({ src, alt, className }: { src?: string; alt?: string; className?: string }) {
  const [error, setError] = React.useState(false);
  if (!src || error) return null;
  return (
    <img
      src={src}
      alt={alt || 'Avatar'}
      onError={() => setError(true)}
      className={cn('aspect-square h-full w-full object-cover', className)}
    />
  );
}

export function AvatarFallback({ children, className }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex h-full w-full items-center justify-center rounded-full bg-muted font-medium text-xs text-muted-foreground', className)}>
      {children}
    </div>
  );
}
