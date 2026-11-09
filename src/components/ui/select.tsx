import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, Check } from 'lucide-react';

interface SelectProps {
  value: string;
  onValueChange: (val: string) => void;
  children: React.ReactNode;
  placeholder?: string;
  className?: string;
}

export function Select({ value, onValueChange, children, placeholder, className }: SelectProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={cn('relative inline-block w-full', className)}>
      <SelectContext.Provider value={{ value, onValueChange, open, setOpen, placeholder }}>
        {children}
      </SelectContext.Provider>
    </div>
  );
}

const SelectContext = React.createContext<{
  value: string;
  onValueChange: (val: string) => void;
  open: boolean;
  setOpen: (val: boolean) => void;
  placeholder?: string;
}>({
  value: '',
  onValueChange: () => {},
  open: false,
  setOpen: () => {},
});

export function SelectTrigger({
  className,
  children,
  id,
}: {
  className?: string;
  children?: React.ReactNode;
  id?: string;
}) {
  const { open, setOpen } = React.useContext(SelectContext);
  return (
    <button
      type="button"
      id={id}
      onClick={() => setOpen(!open)}
      className={cn(
        'flex h-10 w-full items-center justify-between rounded-xl border border-border bg-card px-3.5 py-2 text-sm text-foreground shadow-xs ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer hover:bg-muted/50 transition-colors',
        className
      )}
      aria-expanded={open}
    >
      <div className="flex-1 truncate text-left">{children}</div>
      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground ml-2" />
    </button>
  );
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const { value, placeholder: ctxPlaceholder } = React.useContext(SelectContext);
  return (
    <span className={cn('truncate', !value && 'text-muted-foreground')}>
      {value || placeholder || ctxPlaceholder || 'Select option'}
    </span>
  );
}

export function SelectContent({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const { open } = React.useContext(SelectContext);
  if (!open) return null;
  return (
    <div
      className={cn(
        'absolute left-0 top-full z-50 mt-1 max-h-60 w-full min-w-[8rem] overflow-auto rounded-xl border border-border bg-card p-1 text-card-foreground shadow-lg animate-in fade-in-80',
        className
      )}
    >
      {children}
    </div>
  );
}

export function SelectItem({
  value,
  children,
  className,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { value: selectedValue, onValueChange, setOpen } = React.useContext(SelectContext);
  const isSelected = selectedValue === value;

  return (
    <div
      onClick={() => {
        onValueChange(value);
        setOpen(false);
      }}
      className={cn(
        'relative flex w-full cursor-pointer select-none items-center rounded-lg py-2 pl-3 pr-8 text-sm outline-none hover:bg-muted transition-colors',
        isSelected && 'font-medium bg-primary/10 text-primary',
        className
      )}
    >
      <span className="truncate">{children}</span>
      {isSelected && (
        <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
          <Check className="h-4 w-4" />
        </span>
      )}
    </div>
  );
}
