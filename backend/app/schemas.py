"""Pydantic schemas matching the exact InterviewIQ AI camelCase API contract."""

from typing import Literal
from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

InterviewType = Literal["technical", "hr", "mixed", "coding"]
Difficulty = Literal["beginner", "intermediate", "advanced"]
Language = Literal["en", "ta", "hi"]
CodingLanguage = Literal["python", "javascript", "java"]
SessionStatus = Literal["in_progress", "completed", "abandoned"]
BadgeId = Literal[
    "first_interview",
    "five_interviews",
    "ten_interviews",
    "streak_3",
    "streak_7",
    "streak_30",
    "score_80",
    "score_90",
    "all_rounder",
    "multilingual",
    "comeback",
    "goal_getter",
    "code_and_talk",
]


class CamelModel(BaseModel):
    """Base model that automatically maps snake_case attributes to camelCase JSON keys."""

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


# -----------------------------------------------------------------------------
# Public API Schemas
# -----------------------------------------------------------------------------


class InterviewConfig(CamelModel):
    type: InterviewType
    domain: str
    difficulty: Difficulty
    duration_min: Literal[5, 10, 15]
    language: Language
    coding_language: CodingLanguage = "python"


class Question(CamelModel):
    id: str
    text: str
    audio_url: str | None = None
    topic: str | None = None
    is_follow_up: bool = False
    index: int


class RubricScores(CamelModel):
    technical_correctness: int
    conceptual_understanding: int
    completeness: int
    relevance: int
    communication_clarity: int


class AnswerEvaluation(CamelModel):
    overall: int
    scores: RubricScores
    strengths: list[str]
    improvements: list[str]
    missing_concepts: list[str]
    model_answer: str | None = None


class StartSessionResponse(CamelModel):
    session_id: str
    first_question: Question
    config: InterviewConfig
    started_at: str
    problem: "CodingProblem | None" = None


class SubmitAnswerResponse(CamelModel):
    transcript: str
    evaluation: AnswerEvaluation
    next_question: Question | None = None
    is_complete: bool


class Badge(CamelModel):
    id: BadgeId
    name: str
    description: str
    target: int
    current: int
    earned: bool
    earned_at: str | None = None


class BadgesResponse(CamelModel):
    badges: list[Badge]


class WeeklyGoal(CamelModel):
    target_interviews: int
    completed_interviews: int
    week_start: str
    week_end: str
    days_active: list[bool]
    achieved: bool
    streak_weeks: int


class SetGoalRequest(CamelModel):
    target_interviews: int = Field(ge=1, le=14)


class EndSessionResponse(CamelModel):
    session_id: str
    new_badges: list[Badge] = Field(default_factory=list)


class QuestionResult(CamelModel):
    question: Question
    transcript: str
    evaluation: AnswerEvaluation


class TopicScore(CamelModel):
    topic: str
    score: int


class StudyPlanItem(CamelModel):
    topic: str
    reason: str
    suggested_questions: list[str]


class InterviewReport(CamelModel):
    session_id: str
    config: InterviewConfig
    started_at: str
    completed_at: str
    duration_sec: int
    overall_score: int
    scores: RubricScores
    topic_scores: list[TopicScore]
    strengths: list[str]
    weaknesses: list[str]
    results: list[QuestionResult]
    study_plan: list[StudyPlanItem]
    summary_feedback: str
    summary_audio_url: str | None = None
    coding_result: "CodingResult | None" = None


class SessionSummary(CamelModel):
    session_id: str
    config: InterviewConfig
    started_at: str
    status: SessionStatus
    overall_score: int | None = None
    duration_sec: int


class TrendItem(CamelModel):
    date: str
    score: int


class DashboardStats(CamelModel):
    total_interviews: int
    avg_score: int
    best_score: int
    practice_minutes: int
    streak_days: int
    trend: list[TrendItem]
    weak_topics: list[TopicScore]


class ResumeProfileData(CamelModel):
    """Career details extracted from a resume; excludes contact and identity details."""

    summary: str
    skills: list[str]
    experience: list[str]
    projects: list[str]
    education: list[str]


class StoredResumeProfile(ResumeProfileData):
    user_id: str
    updated_at: str


class StoredUserBadge(CamelModel):
    user_id: str
    badge_id: BadgeId
    earned_at: str
    session_id: str | None = None


class StoredWeeklyGoal(CamelModel):
    user_id: str
    target_interviews: int = 3
    goal_achieved_at: str | None = None


# -----------------------------------------------------------------------------
# Internal (Engine & Database) Models
# -----------------------------------------------------------------------------


class BlueprintTopic(CamelModel):
    topic: str
    opening_question: str
    expected_concepts: list[str]
    follow_up_hints: list[str]


class Blueprint(CamelModel):
    topics: list[BlueprintTopic]


class CodingProblem(CamelModel):
    id: str
    title: str
    description: str
    difficulty: Difficulty
    input_format: str
    output_format: str
    examples: list[str]
    constraints: list[str]
    starter_code: dict[CodingLanguage, str]
    hints: list[str] = Field(default_factory=list, max_length=3)


class CodingReview(CamelModel):
    evaluation: AnswerEvaluation
    correctness_summary: str
    time_complexity: str
    space_complexity: str
    review: str


class CodingResult(CamelModel):
    problem: CodingProblem
    language: CodingLanguage
    submitted_code: str
    approach_transcript: str
    review: CodingReview


class CodingSessionState(CamelModel):
    problem: CodingProblem
    language: CodingLanguage
    question_id: str
    approach_transcript: str = ""
    follow_up_count: int = 0
    submitted_code: str | None = None
    review: CodingReview | None = None


class CodingApproachResponse(CamelModel):
    transcript: str
    evaluation: AnswerEvaluation
    next_question: Question | None = None
    is_complete: bool


class CodingSubmissionRequest(CamelModel):
    code: str = Field(min_length=1, max_length=50000)
    language: CodingLanguage | None = None


class CodingSubmissionResponse(CamelModel):
    result: CodingResult


class StoredTurn(CamelModel):
    question: Question
    transcript: str
    evaluation: AnswerEvaluation
    audio_duration_sec: float = 0.0
    wpm: int = 0
    filler_count: int = 0
    created_at: str


class StoredSession(CamelModel):
    id: str
    user_id: str
    config: InterviewConfig
    status: SessionStatus
    started_at: str
    completed_at: str | None = None
    blueprint: Blueprint
    current_question: Question
    current_expected_concepts: list[str] = []
    topic_index: int = 0
    questions_asked: int = 1
    follow_ups_on_topic: int = 0
    turns: list[StoredTurn] = []
    last_answer_response: SubmitAnswerResponse | None = None
    report: InterviewReport | None = None
    coding_state: CodingSessionState | None = None
