import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { ApiError, isMockMode, listSessions } from '@/lib/api';
import { SessionSummary } from '@/lib/types';
import { PageHeader } from '@/components/shared/page-header';
import { FiltersBar } from '@/components/history/filters-bar';
import { SummaryStrip } from '@/components/history/summary-strip';
import { SessionsTable } from '@/components/history/sessions-table';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { History, Plus, RotateCcw, FilterX } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

export function HistoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { getToken, isLoaded, isSignedIn, signOut } = useAuth();
  const navigate = useNavigate();

  const [allSessions, setAllSessions] = useState<SessionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Filters from URL searchParams
  const search = searchParams.get('q') || '';
  const type = searchParams.get('type') || 'all';
  const status = searchParams.get('status') || 'all';
  const sort = searchParams.get('sort') || 'newest';

  const updateParam = (key: string, value: string) => {
    setCurrentPage(1);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (!value || value === 'all' || (key === 'sort' && value === 'newest')) {
        next.delete(key);
      } else {
        next.set(key, value);
      }
      return next;
    });
  };

  const resetFilters = () => {
    setCurrentPage(1);
    setSearchParams(new URLSearchParams());
  };

  const fetchSessions = useCallback(async () => {
    if (!isMockMode && (!isLoaded || !isSignedIn)) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setHasError(false);
    setAuthError(false);
    try {
      const token = (await getToken({ skipCache: true })) ?? undefined;
      const res = await listSessions(token);
      setAllSessions(res);
    } catch (error) {
      setHasError(true);
      setAuthError(error instanceof ApiError && error.status === 401);
    } finally {
      setIsLoading(false);
    }
  }, [getToken, isLoaded, isSignedIn]);

  useEffect(() => {
    if (!isMockMode && !isLoaded) return;
    fetchSessions();
  }, [fetchSessions]);

  const reauthenticate = async () => {
    try {
      await signOut();
      navigate('/sign-in');
    } catch {
      setHasError(true);
    }
  };

  // Client-side filtering & sorting
  const filteredSessions = useMemo(() => {
    let list = [...allSessions];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s) => s.config.domain.toLowerCase().includes(q));
    }

    if (type !== 'all') {
      list = list.filter((s) => s.config.type === type);
    }

    if (status !== 'all') {
      list = list.filter((s) => s.status === status);
    }

    list.sort((a, b) => {
      if (sort === 'newest') {
        return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();
      }
      if (sort === 'oldest') {
        return new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime();
      }
      if (sort === 'highest') {
        return (b.overallScore || 0) - (a.overallScore || 0);
      }
      if (sort === 'lowest') {
        return (a.overallScore || 0) - (b.overallScore || 0);
      }
      return 0;
    });

    return list;
  }, [allSessions, search, type, status, sort]);

  // Pagination slice
  const totalItems = filteredSessions.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedSessions = filteredSessions.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const hasActiveFilters = Boolean(search || type !== 'all' || status !== 'all' || sort !== 'newest');

  if ((!isMockMode && !isLoaded) || isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Interview history"
          description="Every session you've practiced, in one place."
          actions={
            <Button asChild variant="gradient" size="sm">
              <Link to="/setup">
                <Plus className="h-4 w-4 mr-1.5" />
                <span>New interview</span>
              </Link>
            </Button>
          }
        />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!isMockMode && !isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 rounded-2xl border border-border bg-card p-12 text-center my-8">
        <h2 className="text-xl font-bold text-foreground">Sign in to view your history</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Your interview sessions are linked to your account.
        </p>
        <Button asChild variant="gradient">
          <Link to="/sign-in">Sign in</Link>
        </Button>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-destructive/30 bg-destructive/5 space-y-4 my-8">
        <h2 className="text-xl font-bold text-foreground">Couldn&apos;t load interview history</h2>
        <p className="text-sm text-muted-foreground">
          {authError
            ? 'Your sign-in session was rejected. Sign in again to continue.'
            : 'An error occurred while communicating with the session store.'}
        </p>
        {authError ? (
          <Button onClick={() => void reauthenticate()} variant="outline">
            Sign in again
          </Button>
        ) : (
          <Button onClick={fetchSessions} variant="outline" className="gap-2">
            <RotateCcw className="h-4 w-4" />
            <span>Retry</span>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <PageHeader
        title="Interview history"
        description="Every session you've practiced, in one place."
        actions={
          <Button asChild variant="gradient" size="sm">
            <Link to="/setup">
              <Plus className="h-4 w-4 mr-1.5" />
              <span>New interview</span>
            </Link>
          </Button>
        }
      />

      {/* Global Empty State: No sessions recorded at all */}
      {allSessions.length === 0 ? (
        <EmptyState
          icon={History}
          title="No interviews practiced yet"
          description="Configure your first mock interview to start building your speech history and score trends."
          action={
            <Button asChild variant="gradient">
              <Link to="/setup">
                <Plus className="h-4 w-4 mr-1.5" />
                <span>Start First Interview</span>
              </Link>
            </Button>
          }
        />
      ) : (
        <>
          {/* Filters Bar */}
          <FiltersBar
            search={search}
            type={type}
            status={status}
            sort={sort}
            onSearchChange={(val) => updateParam('q', val)}
            onTypeChange={(val) => updateParam('type', val)}
            onStatusChange={(val) => updateParam('status', val)}
            onSortChange={(val) => updateParam('sort', val)}
            onReset={resetFilters}
            hasActiveFilters={hasActiveFilters}
          />

          {/* Filtered Empty State: Filter results returned 0 */}
          {filteredSessions.length === 0 ? (
            <div className="py-8">
              <EmptyState
                icon={FilterX}
                title="No matching interviews found"
                description="Try broadening your domain search query or adjusting the type and status filters."
                action={
                  <Button onClick={resetFilters} variant="outline">
                    Clear filters
                  </Button>
                }
              />
            </div>
          ) : (
            <>
              {/* Summary Stats Strip */}
              <SummaryStrip sessions={filteredSessions} />

              {/* Sessions Table (Desktop) / Cards (Mobile) */}
              <SessionsTable sessions={paginatedSessions} />

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border/80 text-xs text-muted-foreground">
                  <div>
                    Showing {startIndex + 1}–
                    {Math.min(startIndex + ITEMS_PER_PAGE, totalItems)} of {totalItems} sessions
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="h-8 text-xs cursor-pointer"
                    >
                      Previous
                    </Button>
                    <span className="font-semibold text-foreground px-2">
                      {currentPage} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="h-8 text-xs cursor-pointer"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
