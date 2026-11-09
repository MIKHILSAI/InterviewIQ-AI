import * as React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface SheetContextType {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SheetContext = React.createContext<SheetContextType>({
  open: false,
  onOpenChange: () => {},
});

export function Sheet({
  open,
  onOpenChange,
  children,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = open !== undefined;
  const currentOpen = isControlled ? open : internalOpen;
  const setOpen = (val: boolean) => {
    if (!isControlled) setInternalOpen(val);
    onOpenChange?.(val);
  };

  return (
    <SheetContext.Provider value={{ open: currentOpen, onOpenChange: setOpen }}>
      {children}
    </SheetContext.Provider>
  );
}

export function SheetTrigger({
  asChild,
  children,
}: {
  asChild?: boolean;
  children: React.ReactElement<React.HTMLAttributes<HTMLElement>>;
}) {
  const { onOpenChange } = React.useContext(SheetContext);
  if (asChild) {
    return React.cloneElement(children, {
      onClick: (e: React.MouseEvent<HTMLElement>) => {
        children.props.onClick?.(e);
        onOpenChange(true);
      },
    });
  }
  return <span onClick={() => onOpenChange(true)}>{children}</span>;
}

export function SheetContent({
  side = 'right',
  children,
  className,
}: {
  side?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactNode;
  className?: string;
}) {
  const { open, onOpenChange } = React.useContext(SheetContext);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    if (open) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  const sideClasses = {
    top: 'inset-x-0 top-0 border-b max-h-[85vh]',
    bottom: 'inset-x-0 bottom-0 border-t max-h-[85vh]',
    left: 'inset-y-0 left-0 h-full w-3/4 max-w-sm border-r',
    right: 'inset-y-0 right-0 h-full w-3/4 max-w-md border-l',
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={() => onOpenChange(false)}
      />
      <div
        className={cn(
          'fixed z-50 flex flex-col bg-card p-6 shadow-2xl transition-all duration-300 ease-in-out border-border',
          sideClasses[side],
          className
        )}
      >
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </button>
        {children}
      </div>
    </div>
  );
}

export function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-2 text-left mb-4', className)} {...props} />;
}

export function SheetTitle({
  className,
  asChild,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement> & { asChild?: boolean }) {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ className?: string }>, {
      className: cn('text-lg font-semibold text-foreground', className, (children as React.ReactElement<{ className?: string }>).props.className),
    });
  }
  return <h2 className={cn('text-lg font-semibold text-foreground', className)} {...props}>{children}</h2>;
}

export function SheetDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-muted-foreground', className)} {...props} />;
}
