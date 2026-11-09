import { TopicScore } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { scoreTone } from '@/lib/utils';

export function TopicChart({ topicScores }: { topicScores: TopicScore[] }) {
  const toneColors = {
    success: '#16A34A',
    warning: '#F59E0B',
    destructive: '#DC2626',
  };

  return (
    <Card className="p-6 border-border">
      <CardHeader className="p-0 mb-4">
        <CardTitle className="text-base font-bold text-foreground">
          Topic Performance Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="no-print h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={topicScores}
              margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
            >
              <XAxis
                type="number"
                domain={[0, 100]}
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="topic"
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                width={140}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as TopicScore;
                    return (
                      <div className="rounded-xl border border-border bg-card p-2.5 shadow-lg text-xs">
                        <span className="font-semibold text-foreground">{data.topic}</span>
                        <div className="font-bold text-primary mt-0.5">{data.score}%</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="score" radius={[0, 8, 8, 0]} barSize={16}>
                {topicScores.map((entry, index) => {
                  const tone = scoreTone(entry.score);
                  return <Cell key={`cell-${index}`} fill={toneColors[tone]} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="hidden print:block space-y-4">
          {topicScores.map((item) => (
            <div key={item.topic} className="space-y-1.5">
              <div className="flex items-start justify-between gap-4 text-sm">
                <span className="min-w-0 font-medium leading-relaxed">{item.topic}</span>
                <span className="shrink-0 font-semibold">{item.score} / 100</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-indigo-600"
                  style={{ width: `${Math.max(0, Math.min(100, item.score))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
