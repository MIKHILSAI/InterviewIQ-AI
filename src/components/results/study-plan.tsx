import { Link } from 'react-router-dom';
import { StudyPlanItem } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Compass, ArrowRight, HelpCircle } from 'lucide-react';

export function StudyPlan({ studyPlan }: { studyPlan: StudyPlanItem[] }) {
  const getDomainFromTopic = (topic: string) => {
    if (topic.toLowerCase().includes('sql')) return 'SQL';
    if (topic.toLowerCase().includes('communication') || topic.toLowerCase().includes('behavioral'))
      return 'Behavioural';
    if (topic.toLowerCase().includes('cpython') || topic.toLowerCase().includes('hash'))
      return 'Python';
    return 'Python';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Compass className="h-5 w-5 text-primary" />
        <div>
          <h2 className="text-lg font-bold text-foreground">
            Personalized Preparation Study Plan
          </h2>
          <p className="text-xs text-muted-foreground">
            Targeted drills recommended based on your specific missed concepts and pauses
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {studyPlan.map((item, idx) => {
          const domain = getDomainFromTopic(item.topic);
          const type = domain === 'Behavioural' ? 'hr' : 'technical';

          return (
            <Card
              key={idx}
              className="p-5 flex flex-col justify-between border-border hover:border-primary/40 transition-all shadow-xs"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs font-bold text-primary border-primary/30 bg-primary/5">
                    Priority #{idx + 1}
                  </Badge>
                  <span className="text-xs font-semibold text-muted-foreground">Focus Area</span>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-foreground leading-snug">
                    {item.topic}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    {item.reason}
                  </p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-border/60">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Suggested Drill Questions:
                  </span>
                  <ul className="space-y-1.5 text-xs text-foreground/80">
                    {item.suggestedQuestions.map((q, qIdx) => (
                      <li key={qIdx} className="flex items-start gap-1.5">
                        <HelpCircle className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-4 mt-2">
                <Button asChild variant="outline" size="sm" className="no-print w-full text-xs gap-1.5 rounded-xl">
                  <Link to={`/setup?type=${type}&domain=${encodeURIComponent(domain)}`}>
                    <span>Practice this topic</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
