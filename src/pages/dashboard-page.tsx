import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { ApiError, getStats, isMockMode, listSessions } from '@/lib/api';
import { DashboardStats, SessionSummary } from '@/lib/types';
import { WelcomeHeader } from '@/components/dashboard/welcome-header';
import { StatCard } from '@/components/shared/stat-card';
import { ScoreBadge } from '@/components/shared/score-badge';
import { ScoreTrendChart } from '@/components/dashboard/score-trend-chart';
import { WeakTopicsCard } from '@/components/dashboard/weak-topics-card';
import { QuickStart } from '@/components/dashboard/quick-start';
import { RecentSessions } from '@/components/dashboard/recent-sessions';
import { RecentBadges } from '@/components/badges/recent-badges';
import { WeeklyGoalCard } from '@/components/goals/weekly-goal-card';
import { EmptyState } from '@/components/shared/empty-state';
import { VoiceOrb } from '@/components/shared/voice-orb';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import {
  Mic,
  Award,
  Trophy,
  Clock,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export function DashboardPage() {
  const { getToken, isLoaded, isSignedIn, signOut } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [authError, setAuthError] = useState(false);

  const loadData = useCallback(async () => {
    if (!isMockMode && (!isLoaded || !isSignedIn)) return;
    setIsLoading(true);
    setErrorMessage('');
    setAuthError(false);
    try {
      const token = (await getToken({ skipCache: true })) ?? undefined;
      const [statsRes, sessionsRes] = await Promise.all([
        getStats(token),
        listSessions(token),
      ]);
      setStats(statsRes);
      setSessions(sessionsRes);
    } catch (error) {
      const message = error instanceof ApiError
        ? error.message
        : 'A network error interrupted the dashboard request.';
      setErrorMessage(message);
      const isAuthError = error instanceof ApiError && error.status === 401;
      setAuthError(isAuthError);
      if (!isAuthError) {
        toast.error(`Could not load your dashboard. ${message}`);
      }
    } finally {
      setIsLoading(false);
    }
  }, [getToken, isLoaded, isSignedIn]);

  const reauthenticate = async () => {
    try {
      await signOut();
      navigate('/sign-in');
    } catch {
      toast.error('Could not reset your sign-in session. Please reload and try again.');
    }
  };

  useEffect(() => {
    if (!isMockMode && !isLoaded) return;
    if (!isMockMode && !isSignedIn) {
      setIsLoading(false);
      return;
    }
    void loadData();
  }, [isLoaded, isSignedIn, loadData]);

  if ((!isMockMode && !isLoaded) || isLoading) {
    return (
      <div className="space-y-8 animate-in fade-in-50 duration-300">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
        <Skeleton className="h-44 rounded-2xl" />
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!isMockMode && !isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 rounded-2xl border border-border bg-card p-12 text-center my-8">
        <h2 className="text-xl font-bold text-foreground">Sign in to view your dashboard</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Your interview stats and practice history are linked to your account.
        </p>
        <Button asChild variant="gradient">
          <Link to="/sign-in">Sign in</Link>
        </Button>
      </div>
    );
  }

  if (errorMessage || !stats) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-destructive/30 bg-destructive/5 space-y-4 my-8">
        <div className="h-12 w-12 rounded-full bg-destructive/15 text-destructive flex items-center justify-center">
          <RotateCcw className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Couldn&apos;t load your dashboard</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          {errorMessage || 'Dashboard data is unavailable. Please retry.'}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {authError && (
            <Button type="button" variant="outline" onClick={() => void reauthenticate()}>
              Sign in again
            </Button>
          )}
          {!authError && (
            <Button onClick={loadData} variant="outline" className="gap-2">
              <RotateCcw className="h-4 w-4" />
              <span>Retry</span>
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Empty state when candidate has 0 interviews
  if (stats.totalInterviews === 0) {
    return (
      <div className="space-y-8">
        <WelcomeHeader streakDays={0} />

        <div className="rounded-2xl border border-border bg-card p-10 flex flex-col items-center justify-center text-center space-y-5">
          <VoiceOrb state="idle" size={130} />
          <div className="space-y-2 max-w-md">
            <h2 className="text-2xl font-bold text-foreground">No interviews yet</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your first mock interview takes under 10 minutes. Pick a domain, answer by voice, and get an immediate breakdown.
            </p>
          </div>
          <Button asChild variant="gradient" size="lg" className="rounded-xl px-8">
            <Link to="/setup">
              <Sparkles className="h-4 w-4 mr-2" />
              <span>Start Your First Interview</span>
            </Link>
          </Button>
        </div>

        <QuickStart />
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <WeeklyGoalCard />
          <RecentBadges />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 1. Greeting Header */}
      <WelcomeHeader streakDays={stats.streakDays} />

      {/* 2. Stat Cards Row (4 cards, responsive: 1 mobile, 2 md, 4 xl) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total interviews"
          value={stats.totalInterviews}
          icon={Mic}
          hint="Completed rounds"
        />
        <StatCard
          label="Average score"
          value={<ScoreBadge score={stats.avgScore} />}
          icon={Award}
          hint="Across all domains"
        />
        <StatCard
          label="Best score"
          value={`${stats.bestScore}%`}
          icon={Trophy}
          hint="Personal record"
        />
        <StatCard
          label="Practice time"
          value={`${stats.practiceMinutes}m`}
          icon={Clock}
          hint="Total talking time"
        />
      </div>

      {/* 3. Two-Column Grid: Trend Chart & Weak Topics Focus Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ScoreTrendChart trend={stats.trend} />
        </div>
        <div className="lg:col-span-1">
          <WeakTopicsCard weakTopics={stats.weakTopics} />
        </div>
      </div>

      {/* 4. Quick Start Presets Row */}
      <QuickStart />

      {/* 5. Weekly goal and recent achievements */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <WeeklyGoalCard />
        <RecentBadges />
      </div>

      {/* 6. Recent Interviews List */}
      <RecentSessions sessions={sessions} />
    </div>
  );
}
