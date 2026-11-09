import { Sliders, Mic, Sparkles, Award } from 'lucide-react';

const steps = [
  {
    step: '01',
    icon: Sliders,
    title: 'Configure your interview',
    desc: 'Select technical, HR or mixed rounds. Choose your tech stack, difficulty level, duration and spoken language.',
  },
  {
    step: '02',
    icon: Mic,
    title: 'Listen & answer by voice',
    desc: 'The AI interviewer speaks questions aloud using natural TTS. Respond naturally through your browser microphone.',
  },
  {
    step: '03',
    icon: Sparkles,
    title: 'Get adaptive follow-ups',
    desc: 'Your spoken answer is transcribed and analyzed. The interviewer probes your assertions just like a real engineering manager.',
  },
  {
    step: '04',
    icon: Award,
    title: 'Review your report',
    desc: 'Receive comprehensive 5-parameter rubric ratings, question-by-question model answers, and a targeted study plan.',
  },
];

export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-3">
            Workflow
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            How InterviewIQ AI Works
          </h2>
          <p className="mt-3 text-muted-foreground text-base">
            From configuration to scored assessment in four straightforward steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((st) => {
            const Icon = st.icon;
            return (
              <div
                key={st.step}
                className="relative flex flex-col rounded-2xl border border-border bg-card p-6 shadow-xs hover:border-primary/40 hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between mb-5">
                  <span className="font-mono text-2xl font-black text-primary/30 group-hover:text-primary transition-colors">
                    {st.step}
                  </span>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{st.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{st.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
