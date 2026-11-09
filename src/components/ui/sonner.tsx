import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

type ToastListener = (toasts: ToastItem[]) => void;
let listeners: ToastListener[] = [];
let activeToasts: ToastItem[] = [];

function notify() {
  listeners.forEach((l) => l([...activeToasts]));
}

export const toast = {
  success: (message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    activeToasts = [...activeToasts, { id, type: 'success', message }];
    notify();
    setTimeout(() => {
      activeToasts = activeToasts.filter((t) => t.id !== id);
      notify();
    }, 4000);
  },
  error: (message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    activeToasts = [...activeToasts, { id, type: 'error', message }];
    notify();
    setTimeout(() => {
      activeToasts = activeToasts.filter((t) => t.id !== id);
      notify();
    }, 5000);
  },
  info: (message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    activeToasts = [...activeToasts, { id, type: 'info', message }];
    notify();
    setTimeout(() => {
      activeToasts = activeToasts.filter((t) => t.id !== id);
      notify();
    }, 4000);
  },
  warning: (message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    activeToasts = [...activeToasts, { id, type: 'warning', message }];
    notify();
    setTimeout(() => {
      activeToasts = activeToasts.filter((t) => t.id !== id);
      notify();
    }, 4500);
  },
};

export function Toaster({
  position = 'top-right',
}: {
  richColors?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const listener: ToastListener = (t) => setToasts(t);
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  const posClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  const removeToast = (id: string) => {
    activeToasts = activeToasts.filter((t) => t.id !== id);
    notify();
  };

  return (
    <div className={cn('fixed z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full', posClasses[position])}>
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'pointer-events-auto flex items-center justify-between gap-3 p-4 rounded-xl border shadow-lg text-sm font-medium animate-in slide-in-from-top-2 duration-200',
            t.type === 'success' && 'bg-card border-success/40 text-foreground text-success',
            t.type === 'error' && 'bg-card border-destructive/40 text-foreground text-destructive',
            t.type === 'warning' && 'bg-card border-warning/40 text-foreground text-warning',
            t.type === 'info' && 'bg-card border-primary/40 text-foreground text-primary'
          )}
        >
          <div className="flex items-center gap-2.5">
            {t.type === 'success' && <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />}
            {t.type === 'error' && <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />}
            {t.type === 'warning' && <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />}
            {t.type === 'info' && <Info className="h-4 w-4 shrink-0 text-primary" />}
            <span className="text-foreground">{t.message}</span>
          </div>
          <button
            onClick={() => removeToast(t.id)}
            className="text-muted-foreground hover:text-foreground cursor-pointer p-0.5 rounded"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
