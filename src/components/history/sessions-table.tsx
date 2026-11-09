import { useNavigate } from 'react-router-dom';
import { SessionSummary } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from '@/components/ui/table';
import { ScoreBadge } from '@/components/shared/score-badge';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatDuration } from '@/lib/utils';
import { SessionCard } from './session-card';
import { ChevronRight } from 'lucide-react';

export function SessionsTable({ sessions }: { sessions: SessionSummary[] }) {
  const navigate = useNavigate();

  return (
    <div>
      {/* Mobile view: Stacked cards */}
      <div className="md:hidden space-y-3">
        {sessions.map((session) => (
          <SessionCard key={session.sessionId} session={session} />
        ))}
      </div>

      {/* Desktop view: Table */}
      <div className="hidden md:block rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
        <Table>
          <TableCaption className="sr-only">List of past mock interview sessions</TableCaption>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[120px]">Date</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Language</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Score</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((s) => {
              const isCompleted = s.status === 'completed';

              return (
                <TableRow
                  key={s.sessionId}
                  onClick={() => isCompleted && navigate(`/results/${s.sessionId}`)}
                  className={
                    isCompleted
                      ? 'cursor-pointer hover:bg-muted/60 transition-colors'
                      : 'opacity-70'
                  }
                  tabIndex={isCompleted ? 0 : undefined}
                  onKeyDown={(e) => {
                    if (isCompleted && (e.key === 'Enter' || e.key === ' ')) {
                      navigate(`/results/${s.sessionId}`);
                    }
                  }}
                  aria-label={isCompleted ? `View report for ${s.config.domain}` : undefined}
                >
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(s.startedAt)}
                  </TableCell>

                  <TableCell className="font-semibold text-sm text-foreground">
                    {s.config.domain}
                  </TableCell>

                  <TableCell className="capitalize text-xs text-muted-foreground">
                    {s.config.type}
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline" className="text-[11px] capitalize">
                      {s.config.difficulty}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-xs uppercase text-muted-foreground font-mono">
                    {s.config.language}
                  </TableCell>

                  <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                    {formatDuration(s.durationSec)}
                  </TableCell>

                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${
                        s.status === 'completed'
                          ? 'bg-success/15 text-success'
                          : s.status === 'in_progress'
                          ? 'bg-primary/15 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {s.status.replace('_', ' ')}
                    </span>
                  </TableCell>

                  <TableCell className="text-right">
                    <ScoreBadge score={s.overallScore} />
                  </TableCell>

                  <TableCell className="text-right">
                    {isCompleted && (
                      <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
