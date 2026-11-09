"""User performance analytics and dashboard telemetry calculations."""

import datetime
from app.schemas import DashboardStats, StoredSession, TopicScore, TrendItem


def compute_streak(completed_dates: set[datetime.date]) -> int:
    """Calculates consecutive active days streak ending today or yesterday in UTC."""
    if not completed_dates:
        return 0

    today = datetime.datetime.now(datetime.timezone.utc).date()
    yesterday = today - datetime.timedelta(days=1)

    # Check whether streak is alive
    if today in completed_dates:
        curr = today
    elif yesterday in completed_dates:
        curr = yesterday
    else:
        return 0

    return _streak_from(completed_dates, curr)


def longest_streak(completed_dates: set[datetime.date]) -> int:
    """Returns the longest consecutive run of active practice dates."""
    return max(
        (_streak_from(completed_dates, day) for day in completed_dates),
        default=0,
    )


def _streak_from(completed_dates: set[datetime.date], curr: datetime.date) -> int:
    streak = 0
    while curr in completed_dates:
        streak += 1
        curr -= datetime.timedelta(days=1)
    return streak


def calculate_dashboard_stats(sessions: list[StoredSession]) -> DashboardStats:
    """Aggregates all user sessions into executive dashboard metrics."""
    # Filter only completed sessions
    completed = [s for s in sessions if s.status == "completed" and s.report is not None]

    if not completed:
        return DashboardStats(
            total_interviews=0,
            avg_score=0,
            best_score=0,
            practice_minutes=0,
            streak_days=0,
            trend=[],
            weak_topics=[],
        )

    # Total and scores
    total_interviews = len(completed)
    scores = [s.report.overall_score for s in completed if s.report]
    avg_score = round(sum(scores) / len(scores)) if scores else 0
    best_score = max(scores) if scores else 0

    # Practice minutes
    total_sec = sum(s.report.duration_sec for s in completed if s.report)
    practice_minutes = round(total_sec / 60)

    # Streak
    completed_dates: set[datetime.date] = set()
    for s in completed:
        if s.completed_at:
            try:
                dt = datetime.datetime.fromisoformat(s.completed_at)
                completed_dates.add(dt.date())
            except ValueError:
                pass
    streak_days = compute_streak(completed_dates)

    # Trend: up to last 30 completed sessions, oldest -> newest
    sorted_completed = sorted(
        completed,
        key=lambda x: x.completed_at or x.started_at,
    )
    last_30 = sorted_completed[-30:]
    trend = [
        TrendItem(
            date=s.completed_at[:10] if s.completed_at else s.started_at[:10],
            score=s.report.overall_score,
        )
        for s in last_30
        if s.report
    ]

    # Weak topics: aggregate across all completed sessions
    topic_scores_map: dict[str, list[int]] = {}
    for s in completed:
        if s.report and s.report.topic_scores:
            for ts in s.report.topic_scores:
                topic_scores_map.setdefault(ts.topic, []).append(ts.score)

    weak_list: list[TopicScore] = []
    for topic, t_scores in topic_scores_map.items():
        avg = round(sum(t_scores) / len(t_scores))
        weak_list.append(TopicScore(topic=topic, score=avg))

    # Sort lowest first and pick top 3
    weak_list.sort(key=lambda x: x.score)
    top_3_weak = weak_list[:3]

    return DashboardStats(
        total_interviews=total_interviews,
        avg_score=avg_score,
        best_score=best_score,
        practice_minutes=practice_minutes,
        streak_days=streak_days,
        trend=trend,
        weak_topics=top_3_weak,
    )
