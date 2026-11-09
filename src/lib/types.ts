export type InterviewType = 'technical' | 'hr' | 'mixed' | 'coding';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type Language = 'en' | 'ta' | 'hi';
export type CodingLanguage = 'python' | 'javascript' | 'java';
export type CodingPhase = 'understand' | 'approach' | 'code' | 'review' | 'done';
export type SessionStatus = 'in_progress' | 'completed' | 'abandoned';

export interface InterviewConfig {
  type: InterviewType;
  domain: string;
  difficulty: Difficulty;
  durationMin: 5 | 10 | 15;
  language: Language;
  codingLanguage?: CodingLanguage;
}

export interface CodingProblem {
  id: string;
  title: string;
  statement: string;
  topic: string;
  difficulty: Difficulty;
  constraints: string[];
  examples: { input: string; output: string; explanation?: string }[];
  starterCode: Record<CodingLanguage, string>;
  hints: string[];
}

export interface CodeIssue {
  severity: 'high' | 'medium' | 'low';
  line?: number;
  message: string;
}

export interface CodeReview {
  verdict: 'correct' | 'partially_correct' | 'incorrect' | 'unclear';
  summary: string;
  issues: CodeIssue[];
  timeComplexity: string;
  spaceComplexity: string;
  edgeCasesMissed: string[];
  suggestedImprovement: string;
}

export interface CodingScores {
  problemUnderstanding: number;
  approachAndAlgorithm: number;
  codeCorrectness: number;
  complexityAnalysis: number;
  communication: number;
}

export interface CodingReport {
  problem: CodingProblem;
  language: CodingLanguage;
  finalCode: string;
  approachTranscript: string;
  review: CodeReview;
  scores: CodingScores;
  overall: number;
}

export interface Question {
  id: string;
  text: string;
  audioUrl?: string | null;
  topic?: string;
  isFollowUp: boolean;
  index: number;
}

export interface RubricScores {
  technicalCorrectness: number;
  conceptualUnderstanding: number;
  completeness: number;
  relevance: number;
  communicationClarity: number;
} // each 0-100

export interface AnswerEvaluation {
  overall: number;
  scores: RubricScores;
  strengths: string[];
  improvements: string[];
  missingConcepts: string[];
  modelAnswer?: string;
}

export interface TranscriptTurn {
  id: string;
  role: 'interviewer' | 'candidate';
  text: string;
  timestamp: string;
}

export interface StartSessionResponse {
  sessionId: string;
  firstQuestion: Question;
  config: InterviewConfig;
  startedAt: string;
  problem?: CodingProblem;
}

export interface SubmitAnswerResponse {
  transcript: string;
  evaluation: AnswerEvaluation;
  nextQuestion: Question | null;
  isComplete: boolean;
}

export interface QuestionResult {
  question: Question;
  transcript: string;
  evaluation: AnswerEvaluation;
}

export interface TopicScore {
  topic: string;
  score: number;
}

export interface StudyPlanItem {
  topic: string;
  reason: string;
  suggestedQuestions: string[];
}

export interface InterviewReport {
  sessionId: string;
  config: InterviewConfig;
  startedAt: string;
  completedAt: string;
  durationSec: number;
  overallScore: number;
  scores: RubricScores;
  topicScores: TopicScore[];
  strengths: string[];
  weaknesses: string[];
  results: QuestionResult[];
  studyPlan: StudyPlanItem[];
  summaryFeedback: string;
  summaryAudioUrl?: string | null;
  coding?: CodingReport;
}

export interface SessionSummary {
  sessionId: string;
  config: InterviewConfig;
  startedAt: string;
  status: SessionStatus;
  overallScore: number | null;
  durationSec: number;
}

export interface DashboardStats {
  totalInterviews: number;
  avgScore: number;
  bestScore: number;
  practiceMinutes: number;
  streakDays: number;
  trend: { date: string; score: number }[];
  weakTopics: TopicScore[];
}

export interface ResumeProfile {
  summary: string;
  skills: string[];
  experience: string[];
  projects: string[];
  education: string[];
}

export type BadgeId =
  | 'first_interview'
  | 'five_interviews'
  | 'ten_interviews'
  | 'streak_3'
  | 'streak_7'
  | 'streak_30'
  | 'score_80'
  | 'score_90'
  | 'all_rounder'
  | 'multilingual'
  | 'comeback'
  | 'goal_getter'
  | 'code_and_talk';

export interface Badge {
  id: BadgeId;
  name: string;
  description: string;
  target: number;
  current: number;
  earned: boolean;
  earnedAt: string | null;
}

export interface WeeklyGoal {
  targetInterviews: number;
  completedInterviews: number;
  weekStart: string;
  weekEnd: string;
  daysActive: boolean[];
  achieved: boolean;
  streakWeeks: number;
}
