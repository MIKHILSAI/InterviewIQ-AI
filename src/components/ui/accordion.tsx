import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AccordionContextType {
  openItems: string[];
  toggleItem: (value: string) => void;
  type?: 'single' | 'multiple';
}

const AccordionContext = React.createContext<AccordionContextType>({
  openItems: [],
  toggleItem: () => {},
  type: 'single',
});

export function Accordion({
  children,
  type = 'single',
  defaultValue,
  className,
}: {
  children: React.ReactNode;
  type?: 'single' | 'multiple';
  defaultValue?: string | string[];
  className?: string;
  collapsible?: boolean;
}) {
  const [openItems, setOpenItems] = React.useState<string[]>(() => {
    if (!defaultValue) return [];
    return Array.isArray(defaultValue) ? defaultValue : [defaultValue];
  });

  const toggleItem = (value: string) => {
    setOpenItems((prev) => {
      if (type === 'single') {
        return prev.includes(value) ? [] : [value];
      }
      return prev.includes(value)
        ? prev.filter((i) => i !== value)
        : [...prev, value];
    });
  };

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem, type }}>
      <div className={cn('divide-y divide-border/60', className)}>{children}</div>
    </AccordionContext.Provider>
  );
}

export function AccordionItem({
  value,
  children,
  className,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div data-value={value} className={cn('border-b border-border/60', className)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { itemValue: value } as Record<string, unknown>);
        }
        return child;
      })}
    </div>
  );
}

export function AccordionTrigger({
  children,
  className,
  itemValue,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { itemValue?: string }) {
  const { openItems, toggleItem } = React.useContext(AccordionContext);
  const isOpen = itemValue ? openItems.includes(itemValue) : false;

  return (
    <button
      type="button"
      onClick={() => itemValue && toggleItem(itemValue)}
      className={cn(
        'flex w-full items-center justify-between py-4 text-left font-medium transition-all hover:underline cursor-pointer [&[data-state=open]>svg]:rotate-180',
        className
      )}
      data-state={isOpen ? 'open' : 'closed'}
      aria-expanded={isOpen}
      {...props}
    >
      <div className="flex-1 text-left">{children}</div>
      <ChevronDown
        className={cn(
          'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ml-3',
          isOpen && 'rotate-180 text-foreground'
        )}
      />
    </button>
  );
}

export function AccordionContent({
  children,
  className,
  itemValue,
}: {
  children: React.ReactNode;
  className?: string;
  itemValue?: string;
}) {
  const { openItems } = React.useContext(AccordionContext);
  const isOpen = itemValue ? openItems.includes(itemValue) : false;

  return (
    <div
      className={cn(
        'overflow-hidden text-sm transition-all print:block!',
        isOpen ? 'block pb-4 pt-1' : 'hidden print:block'
      )}
      data-print-expand="true"
    >
      <div className={cn('pt-0', className)}>{children}</div>
    </div>
  );
}
