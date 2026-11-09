import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { ApiError, getBadges, isMockMode } from '@/lib/api';
import type { Badge } from '@/lib/types';
import { BadgeGrid } from '@/components/badges/badge-grid';
import { PageHeader } from '@/components/shared/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Trophy } from 'lucide-react';

export function AchievementsPage() {
  const { getToken, isLoaded, isSignedIn, signOut } = useAuth();
  const navigate = useNavigate();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [authUnavailable, setAuthUnavailable] = useState(false);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    if (isMockMode || isLoaded) {
      setAuthUnavailable(false);
      return;
    }

    const timeout = window.setTimeout(() => setAuthUnavailable(true), 8000);
    return () => window.clearTimeout(timeout);
  }, [isLoaded]);

  const load = useCallback(async () => {
    if (!isMockMode && (!isLoaded || !isSignedIn)) return;
    setLoading(true);
    setErrorMessage('');
    setAuthError(false);
    try {
      const token = (await getToken({ skipCache: true })) ?? undefined;
      setBadges(await getBadges(token));
    } catch (error) {
      const isAuthError = error instanceof ApiError && error.status === 401;
      setAuthError(isAuthError);
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : 'A network error prevented loading achievements. Please retry.'
      );
    } finally {
      setLoading(false);
    }
  }, [getToken, isLoaded, isSignedIn]);

  const reauthenticate = async () => {
    try {
      await signOut();
      navigate('/sign-in');
    } catch {
      setErrorMessage('Could not reset your sign-in session. Please reload and try again.');
    }
  };

  useEffect(() => {
    if (!isMockMode && !isLoaded) return;
    if (!isMockMode && !isSignedIn) {
      setLoading(false);
      return;
    }
    void load();
  }, [isLoaded, isSignedIn, load]);

  const earnedCount = badges.filter((badge) => badge.earned).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Achievements"
        description={
          badges.length
            ? `${earnedCount} of ${badges.length} badges earned`
            : 'Track your milestones as you build interview confidence.'
        }
      />
      {!isMockMode && !isLoaded && !authUnavailable ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground" role="status">
          Checking your sign-in session…
        </div>
      ) : !isMockMode && !isLoaded ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <Trophy className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
          <p className="mt-3 text-sm text-foreground">Sign-in could not be initialized.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Achievements need a valid Clerk session. Check the Clerk publishable key and network access, then reload.
          </p>
          <Button type="button" variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            Reload
          </Button>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-52 rounded-2xl" />
          ))}
        </div>
      ) : !isMockMode && !isSignedIn ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">Sign in to view your achievements.</p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/sign-in">Sign in</Link>
          </Button>
        </div>
      ) : errorMessage ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <Trophy className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
          <p className="mt-3 text-sm text-muted-foreground">Could not load your achievements.</p>
          <p className="mt-2 text-sm text-destructive" role="alert">{errorMessage}</p>
          {authError ? (
            <Button type="button" variant="outline" className="mt-4" onClick={() => void reauthenticate()}>
              Sign in again
            </Button>
          ) : (
            <Button type="button" variant="outline" className="mt-4" onClick={load}>
              Retry
            </Button>
          )}
        </div>
      ) : (
        <BadgeGrid badges={badges} />
      )}
    </div>
  );
}
