import { Language } from '@/lib/types';
import { LANGUAGES } from '@/lib/constants';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Check, Info } from 'lucide-react';

interface LanguageSelectorProps {
  value: Language;
  onChange: (lang: Language) => void;
}

export function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
          5
        </span>
        <h3 className="text-base font-bold text-foreground">Interview Language</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {LANGUAGES.map((lang) => {
          const isSelected = value === lang.value;
          const isEnabled = lang.enabled;

          return (
            <Card
              key={lang.value}
              onClick={() => isEnabled && onChange(lang.value as Language)}
              className={cn(
                'p-4 text-left transition-all border-border',
                isEnabled ? 'cursor-pointer hover:border-primary/40' : 'cursor-not-allowed opacity-60 bg-muted/30',
                isSelected && 'border-primary bg-primary/5 ring-1 ring-primary/40'
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-foreground block">{lang.label}</span>
                  <span
                    className={cn(
                      'text-xs font-medium text-muted-foreground',
                      lang.value === 'ta' && 'font-tamil',
                      lang.value === 'hi' && 'font-hindi'
                    )}
                  >
                    {lang.native}
                  </span>
                </div>
                {isSelected && (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
                    <Check className="h-3 w-3" />
                  </div>
                )}
                {!isEnabled && (
                  <Badge variant="secondary" className="text-[10px]">
                    Soon
                  </Badge>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {value === 'ta' && (
        <div className="flex items-start gap-2.5 rounded-xl border border-teal-500/30 bg-teal-500/5 p-3 text-xs text-teal-700 dark:text-teal-300">
          <Info className="h-4 w-4 shrink-0 mt-0.5 text-teal-500" />
          <p className="leading-relaxed">
            Speak naturally. Tamil and Tamil-English (Tanglish) mixed speech is fully supported by our Gnani Prisma speech models.
          </p>
        </div>
      )}
      {value === 'hi' && (
        <div className="flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
          <Info className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
          <p className="leading-relaxed font-hindi">
            आप हिंदी में बोल सकते हैं। तकनीकी शब्द अंग्रेज़ी में बोलना भी ठीक है।
          </p>
        </div>
      )}
    </div>
  );
}
