import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';

const faqs = [
  {
    q: 'Is InterviewIQ AI free to practice with?',
    a: 'Yes! You can run unlimited mock interviews across technical stacks (Python, SQL, OS, DSA) and HR rounds completely free during our community release.',
  },
  {
    q: 'Which browsers support the microphone and voice features?',
    a: 'All modern browsers including Google Chrome, Microsoft Edge, Brave, Safari 14.1+, and Firefox support audio recording via the Web MediaStream and MediaRecorder APIs.',
  },
  {
    q: 'Are my audio recordings stored or shared?',
    a: 'No. Your audio chunks are processed transiently for transcription and rubric analysis. In mock mode, speech processing runs client-side without any audio upload.',
  },
  {
    q: 'How is my score calculated?',
    a: 'Your overall score is a weighted composite of 5 dimensions: Technical Correctness (35%), Conceptual Understanding (25%), Completeness (20%), Relevance (10%), and Communication Clarity (10%).',
  },
  {
    q: 'Can I practice interviews in Tamil?',
    a: 'Yes! InterviewIQ natively supports Tamil voice interviews powered by Gnani speech acoustic models. You can answer in pure Tamil or natural code-mixed Tamil-English.',
  },
  {
    q: 'Do I need to install any software or mobile app?',
    a: 'None at all. InterviewIQ runs directly in your web browser on desktop and mobile devices with zero external installs or plugins.',
  },
];

export function LandingFaq() {
  return (
    <section id="faq" className="py-20 bg-muted/20 border-t border-border/80">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-3">
            Got Questions?
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-muted-foreground text-base">
            Everything you need to know about the voice interviewer.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
          <Accordion type="single" collapsible defaultValue="item-0">
            {faqs.map((faq, idx) => (
              <AccordionItem key={idx} value={`item-${idx}`}>
                <AccordionTrigger className="text-base font-semibold text-foreground hover:text-primary">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pt-2">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
