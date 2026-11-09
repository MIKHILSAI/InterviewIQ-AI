import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Code, Database, Cpu, MessageSquareHeart, Clock, ArrowRight } from 'lucide-react';

const presets = [
  {
    type: 'technical',
    domain: 'Python',
    difficulty: 'intermediate',
    title: 'Python • Intermediate',
    desc: 'Memory management, GIL, generators, and decorators.',
    icon: Code,
    duration: '10 min',
  },
  {
    type: 'technical',
    domain: 'SQL',
    difficulty: 'beginner',
    title: 'SQL • Beginner',
    desc: 'Joins, aggregate queries, B-tree indexes, and normalization.',
    icon: Database,
    duration: '10 min',
  },
  {
    type: 'technical',
    domain: 'Operating Systems',
    difficulty: 'intermediate',
    title: 'Operating Systems • Intermediate',
    desc: 'Process vs thread, virtual memory, paging, and deadlocks.',
    icon: Cpu,
    duration: '10 min',
  },
  {
    type: 'hr',
    domain: 'Behavioural',
    difficulty: 'intermediate',
    title: 'HR • Behavioural',
    desc: 'Conflict resolution, ownership, and working under deadlines.',
    icon: MessageSquareHeart,
    duration: '10 min',
  },
];

export function QuickStart() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Quick Practice Presets</h2>
          <p className="text-xs text-muted-foreground">Jump right into standard placement round templates</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {presets.map((p) => {
          const Icon = p.icon;
          return (
            <Link
              key={p.title}
              to={`/setup?type=${p.type}&domain=${encodeURIComponent(p.domain)}&difficulty=${p.difficulty}&duration=10`}
              className="group block"
            >
              <Card className="p-5 h-full flex flex-col justify-between transition-all group-hover:border-primary/50 group-hover:shadow-md group-hover:-translate-y-0.5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge variant="outline" className="text-[11px] font-normal gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{p.duration}</span>
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                      {p.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                      {p.desc}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center text-xs font-semibold text-primary pt-3 border-t border-border/60">
                  <span>Start preset</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-1 transition-transform group-hover:translate-x-1" />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
