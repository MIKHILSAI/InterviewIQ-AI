import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface TrendItem {
  date: string;
  score: number;
}

export function ScoreTrendChart({ trend }: { trend: TrendItem[] }) {
  const [slice, setSlice] = useState<'last7' | 'last30'>('last7');

  const displayedData = slice === 'last7' ? trend.slice(-7) : trend;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-base font-bold text-foreground">
            Performance Progression
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-0.5">
            Average composite score across recent voice rounds
          </CardDescription>
        </div>
        <div className="flex items-center rounded-xl bg-muted p-1 text-xs font-medium">
          <button
            onClick={() => setSlice('last7')}
            className={`rounded-lg px-2.5 py-1 transition-all cursor-pointer ${
              slice === 'last7'
                ? 'bg-card text-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Last 7
          </button>
          <button
            onClick={() => setSlice('last30')}
            className={`rounded-lg px-2.5 py-1 transition-all cursor-pointer ${
              slice === 'last30'
                ? 'bg-card text-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Last 30
          </button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={displayedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="scoreTrendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                stroke="#64748B"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[0, 100]}
                stroke="#64748B"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                ticks={[0, 25, 50, 75, 100]}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as TrendItem;
                    return (
                      <div className="rounded-xl border border-border bg-card p-3 shadow-lg">
                        <span className="text-xs font-semibold text-muted-foreground">
                          {data.date}
                        </span>
                        <div className="text-base font-bold text-primary mt-0.5">
                          {data.score} / 100
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine
                y={75}
                stroke="#14B8A6"
                strokeDasharray="4 4"
                label={{
                  value: 'Target (75)',
                  position: 'insideTopRight',
                  fill: '#14B8A6',
                  fontSize: 11,
                }}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="#4F46E5"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#scoreTrendGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
