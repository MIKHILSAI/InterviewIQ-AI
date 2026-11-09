import { CODING_LANGUAGES } from '@/lib/constants';
import { CodingLanguage } from '@/lib/types';

export function CodingLanguageSelector({
  value,
  onChange,
}: {
  value: CodingLanguage;
  onChange: (language: CodingLanguage) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
          6
        </span>
        <label htmlFor="coding-language" className="text-base font-bold text-foreground">
          Coding Language
        </label>
      </div>
      <select
        id="coding-language"
        value={value}
        onChange={(event) => onChange(event.target.value as CodingLanguage)}
        className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {CODING_LANGUAGES.map((language) => (
          <option key={language.value} value={language.value}>
            {language.label}
          </option>
        ))}
      </select>
    </div>
  );
}
