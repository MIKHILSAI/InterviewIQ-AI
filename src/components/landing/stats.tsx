import { GitBranch, Gauge, Languages, FileText } from 'lucide-react';

const stats = [
  {
    icon: GitBranch,
    title: 'Adaptive follow-ups',
    subtitle: 'Questions probe your exact answers',
  },
  {
    icon: Gauge,
    title: '5-point rubric scoring',
    subtitle: 'Technical accuracy & clarity breakdown',
  },
  {
    icon: Languages,
    title: '3 voice languages',
    subtitle: 'English & Tamil speech models',
  },
  {
    icon: FileText,
    title: 'Instant PDF report',
    subtitle: 'Strengths, weaknesses & study plan',
  },
];

export function LandingStats() {
  return (
    <section className="border-y border-border/80 bg-muted/30 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="flex flex-col items-center text-center sm:items-start sm:text-left">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
                  <Icon className="h-5 w-5" />
                </div>
                <h4 className="text-base font-bold text-foreground">{s.title}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{s.subtitle}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
