import * as React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface DialogContextType {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextType>({
  open: false,
  onOpenChange: () => {},
});

export function AlertDialog({
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
    <DialogContext.Provider value={{ open: currentOpen, onOpenChange: setOpen }}>
      {children}
    </DialogContext.Provider>
  );
}

export function AlertDialogTrigger({
  asChild,
  children,
}: {
  asChild?: boolean;
  children: React.ReactElement<React.HTMLAttributes<HTMLElement>>;
}) {
  const { onOpenChange } = React.useContext(DialogContext);
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

export function AlertDialogContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { open, onOpenChange } = React.useContext(DialogContext);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    if (open) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        className={cn(
          'relative z-50 w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl animate-in fade-in-0 zoom-in-95',
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function AlertDialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-2 text-center sm:text-left', className)} {...props} />;
}

export function AlertDialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('text-lg font-semibold text-foreground', className)} {...props} />;
}

export function AlertDialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-muted-foreground leading-relaxed', className)} {...props} />;
}

export function AlertDialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6 gap-2', className)}
      {...props}
    />
  );
}

export function AlertDialogCancel({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const { onOpenChange } = React.useContext(DialogContext);
  return (
    <button
      type="button"
      onClick={() => {
        onClick?.();
        onOpenChange(false);
      }}
      className={cn(
        'inline-flex h-10 items-center justify-center rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted cursor-pointer',
        className
      )}
    >
      {children}
    </button>
  );
}

export function AlertDialogAction({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const { onOpenChange } = React.useContext(DialogContext);
  return (
    <button
      type="button"
      onClick={() => {
        onClick?.();
        onOpenChange(false);
      }}
      className={cn(
        'inline-flex h-10 items-center justify-center rounded-xl bg-destructive text-destructive-foreground px-4 py-2 text-sm font-medium hover:bg-destructive/90 cursor-pointer shadow-sm',
        className
      )}
    >
      {children}
    </button>
  );
}

// Dialog alias
export const Dialog = AlertDialog;
export const DialogTrigger = AlertDialogTrigger;
export const DialogContent = AlertDialogContent;
export const DialogHeader = AlertDialogHeader;
export const DialogTitle = AlertDialogTitle;
export const DialogDescription = AlertDialogDescription;
export const DialogFooter = AlertDialogFooter;
export function DialogClose({ onClick, className }: { onClick?: () => void; className?: string }) {
  const { onOpenChange } = React.useContext(DialogContext);
  return (
    <button
      type="button"
      onClick={() => {
        onClick?.();
        onOpenChange(false);
      }}
      className={cn('absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100', className)}
    >
      <X className="h-4 w-4" />
      <span className="sr-only">Close</span>
    </button>
  );
}
