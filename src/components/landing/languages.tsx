import { Check, Clock, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

const languageCards = [
  {
    code: 'en',
    title: 'English',
    native: 'English (Indian Accent Support)',
    desc: 'Trained on Indian tech student speech patterns and conversational English used in tech placement drives.',
    status: 'active',
  },
  {
    code: 'ta',
    title: 'Tamil',
    native: 'தமிழ் (Tamil)',
    desc: 'Speak naturally in Tamil or mixed Tamil-English (Tanglish). High-accuracy voice transcription via Prisma STT.',
    status: 'active',
  },
  {
    code: 'hi',
    title: 'Hindi',
    native: 'हिन्दी (Hindi)',
    desc: 'Practice interview questions in Hindi, with support for commonly used English technical terms.',
    status: 'active',
  },
];

export function LandingLanguages() {
  return (
    <section id="languages" className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-3">
            <Globe className="h-3.5 w-3.5" />
            <span>Inclusive Speech Tech</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Speak Your Natural Language
          </h2>
          <p className="mt-3 text-muted-foreground text-base">
            Language barriers should not prevent great engineers from clearing placement interviews.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {languageCards.map((l) => (
            <Card
              key={l.code}
              className={`p-6 relative overflow-hidden transition-all ${
                l.status === 'coming_soon' ? 'opacity-70 bg-card/60' : 'hover:border-primary/50 hover:shadow-lg'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className={`text-3xl font-bold ${l.code === 'hi' ? 'font-hindi' : l.code === 'ta' ? 'font-tamil' : ''} text-foreground`}>
                  {l.native.split(' ')[0]}
                </span>
                {l.status === 'active' ? (
                  <Badge variant="success" className="gap-1">
                    <Check className="h-3 w-3" />
                    <span>Available</span>
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <Clock className="h-3 w-3" />
                    <span>Coming soon</span>
                  </Badge>
                )}
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">{l.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{l.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
