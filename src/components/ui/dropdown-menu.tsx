import * as React from 'react';
import { cn } from '@/lib/utils';

interface DropdownContextType {
  open: boolean;
  setOpen: (val: boolean) => void;
}

const DropdownContext = React.createContext<DropdownContextType>({
  open: false,
  setOpen: () => {},
});

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  return (
    <div ref={menuRef} className="relative inline-block text-left">
      <DropdownContext.Provider value={{ open, setOpen }}>
        {children}
      </DropdownContext.Provider>
    </div>
  );
}

export function DropdownMenuTrigger({
  asChild,
  children,
  className,
}: {
  asChild?: boolean;
  children: React.ReactElement<React.HTMLAttributes<HTMLElement>>;
  className?: string;
}) {
  const { open, setOpen } = React.useContext(DropdownContext);
  if (asChild) {
    return React.cloneElement(children, {
      onClick: (e: React.MouseEvent<HTMLElement>) => {
        children.props.onClick?.(e);
        setOpen(!open);
      },
    });
  }
  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className={cn('inline-flex items-center justify-center', className)}
    >
      {children}
    </button>
  );
}

export function DropdownMenuContent({
  align = 'end',
  className,
  children,
}: {
  align?: 'start' | 'end';
  className?: string;
  children: React.ReactNode;
}) {
  const { open } = React.useContext(DropdownContext);
  if (!open) return null;

  return (
    <div
      className={cn(
        'absolute z-50 mt-2 min-w-[8rem] overflow-hidden rounded-xl border border-border bg-card p-1 text-card-foreground shadow-lg animate-in fade-in-80',
        align === 'end' ? 'right-0' : 'left-0',
        className
      )}
    >
      {children}
    </div>
  );
}

export function DropdownMenuItem({
  onClick,
  className,
  children,
}: {
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  const { setOpen } = React.useContext(DropdownContext);
  return (
    <div
      onClick={() => {
        onClick?.();
        setOpen(false);
      }}
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2 text-sm outline-none transition-colors hover:bg-muted text-foreground focus:bg-muted',
        className
      )}
    >
      {children}
    </div>
  );
}
