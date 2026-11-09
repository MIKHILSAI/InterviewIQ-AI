import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { TopicScore } from '@/lib/types';
import { ArrowUpRight, Target } from 'lucide-react';
import { scoreTone } from '@/lib/utils';

export function WeakTopicsCard({ weakTopics }: { weakTopics: TopicScore[] }) {
  const getDomainQuery = (topic: string) => {
    if (topic.toLowerCase().includes('sql')) return 'SQL';
    if (topic.toLowerCase().includes('behavioral') || topic.toLowerCase().includes('conflict'))
      return 'Behavioural';
    if (topic.toLowerCase().includes('concurrency') || topic.toLowerCase().includes('deadlock'))
      return 'Operating Systems';
    if (topic.toLowerCase().includes('design')) return 'System Design';
    return 'Python';
  };

  const toneProgressClass = {
    success: 'bg-success',
    warning: 'bg-warning',
    destructive: 'bg-destructive',
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <CardTitle className="text-base font-bold text-foreground">Focus Areas</CardTitle>
        </div>
        <CardDescription className="text-xs text-muted-foreground">
          Topics identified with the greatest improvement potential
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        {weakTopics.map((item) => {
          const tone = scoreTone(item.score);
          const domain = getDomainQuery(item.topic);
          const type = domain === 'Behavioural' ? 'hr' : 'technical';

          return (
            <div key={item.topic} className="space-y-1.5 p-2 rounded-xl hover:bg-muted/40 transition-colors">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground truncate max-w-[170px]" title={item.topic}>
                  {item.topic}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground">{item.score}%</span>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[11px] text-primary hover:text-primary hover:bg-primary/10"
                  >
                    <Link to={`/setup?type=${type}&domain=${encodeURIComponent(domain)}`}>
                      <span>Practice</span>
                      <ArrowUpRight className="h-3 w-3 ml-0.5" />
                    </Link>
                  </Button>
                </div>
              </div>
              <Progress
                value={item.score}
                className="h-1.5"
                indicatorClassName={toneProgressClass[tone]}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
