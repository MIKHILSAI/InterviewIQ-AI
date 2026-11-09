import { Mic, BrainCircuit, BarChart3, Languages, Compass, FileDown } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const features = [
  {
    icon: Mic,
    title: 'Voice-first interviews',
    desc: 'No typing or multiple-choice questions. Practice articulating technical concepts out loud, exactly as required in interviews.',
  },
  {
    icon: BrainCircuit,
    title: 'Adaptive questioning',
    desc: 'The interviewer listens to your explanation and asks contextual follow-ups to probe depth, edge cases, and architectural trade-offs.',
  },
  {
    icon: BarChart3,
    title: 'Rubric-based scoring',
    desc: 'Transparent evaluations across technical correctness, conceptual depth, completeness, relevance, and communication clarity.',
  },
  {
    icon: Languages,
    title: 'Multilingual (English & Tamil)',
    desc: 'Practice comfortably in English or Tamil. Optimized for Indian student placement rounds with natural accent comprehension.',
  },
  {
    icon: Compass,
    title: 'Personalised study plan',
    desc: 'Receive tailored study suggestions, gap analysis, and recommended drill questions based on your specific misses.',
  },
  {
    icon: FileDown,
    title: 'Downloadable report',
    desc: 'Export your comprehensive performance report to PDF with complete transcripts, score breakdowns, and model answers.',
  },
];

export function LandingFeatures() {
  return (
    <section id="features" className="py-20 bg-muted/20 border-y border-border/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-3">
            Core Capabilities
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Engineered for Placement &amp; Job Readiness
          </h2>
          <p className="mt-3 text-muted-foreground text-base">
            Every feature is designed to bridge the gap between knowing the answer and speaking it clearly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <Card key={f.title} className="p-6 transition-all hover:border-primary/40 hover:shadow-md">
                <CardHeader className="p-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg font-bold">{f.title}</CardTitle>
                  <CardDescription className="text-sm mt-2 leading-relaxed">
                    {f.desc}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
