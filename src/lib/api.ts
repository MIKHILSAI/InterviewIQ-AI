import {
  InterviewConfig,
  StartSessionResponse,
  SubmitAnswerResponse,
  InterviewReport,
  SessionSummary,
  DashboardStats,
  ResumeProfile,
  Question,
  AnswerEvaluation,
  Badge,
  WeeklyGoal,
  CodingLanguage,
  CodingProblem,
  CodeReview,
} from './types';
import {
  mockStats,
  mockSessions,
  getMockQuestionsForDomain,
  mockReport,
  mockBadges,
  mockWeeklyGoal,
  mockCodeReview,
  mockCodingProblem,
  mockCodingReport,
  mockCodingSolutions,
} from './mock-data';

const getEnv = (key: string, fallback: string): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    if (import.meta.env[`VITE_${key}`]) return import.meta.env[`VITE_${key}`];
    if (import.meta.env[key]) return import.meta.env[key];
  }
  return fallback;
};

const BASE = getEnv('NEXT_PUBLIC_API_BASE_URL', 'http://localhost:8000');
const USE_MOCK = getEnv('NEXT_PUBLIC_USE_MOCK', 'true') === 'true';
export const isMockMode = USE_MOCK;

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// In-memory / localStorage state for realistic mock continuity
const SESSIONS_STORAGE_KEY = 'iq:sessions_list';
const SESSION_ANSWERS_KEY = (id: string) => `iq:answers:${id}`;
const SESSION_CODING_PHASE_KEY = (id: string) => `iq:codingPhase:${id}`;
const SESSION_CODING_FINAL_CODE_KEY = (id: string) => `iq:codingFinalCode:${id}`;
const SESSION_CODING_APPROACH_KEY = (id: string) => `iq:codingApproach:${id}`;
const MOCK_WEEKLY_GOAL_KEY = 'iiq:mockWeeklyGoal';

function getStoredSessions(): SessionSummary[] {
  try {
    const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore storage errors
  }
  return [...mockSessions];
}

function saveStoredSessions(sessions: SessionSummary[]) {
  try {
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    // Ignore storage errors
  }
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function normalizeCodingProblem(
  value: unknown,
  config: InterviewConfig
): CodingProblem | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const raw = value as Record<string, unknown>;
  const starterCode = (raw.starterCode ?? raw.starter_code) as Partial<Record<CodingLanguage, unknown>> | undefined;
  const rawExamples = Array.isArray(raw.examples) ? raw.examples : [];
  const examples = rawExamples.map((example) => {
    if (typeof example === 'string') {
      const labeledOutput = example.match(/(?:^|\r?\n)\s*output\s*:\s*/i);
      if (labeledOutput && labeledOutput.index !== undefined) {
        const input = example.slice(0, labeledOutput.index).replace(/^\s*input\s*:\s*/i, '').trim();
        const output = example.slice(labeledOutput.index + labeledOutput[0].length).trim();
        return { input, output };
      }
      const arrowIndex = example.search(/\s*(?:→|->)\s*/);
      if (arrowIndex >= 0) {
        const arrow = example.slice(arrowIndex).match(/^\s*(?:→|->)\s*/)?.[0] || '';
        return {
          input: example.slice(0, arrowIndex).replace(/^\s*input\s*:\s*/i, '').trim(),
          output: example.slice(arrowIndex + arrow.length).replace(/^\s*output\s*:\s*/i, '').trim(),
        };
      }
      return { input: example.replace(/^\s*input\s*:\s*/i, '').trim(), output: '' };
    }
    if (example && typeof example === 'object') {
      const item = example as Record<string, unknown>;
      return {
        input: typeof item.input === 'string' ? item.input : '',
        output: typeof item.output === 'string' ? item.output : '',
        ...(typeof item.explanation === 'string' ? { explanation: item.explanation } : {}),
      };
    }
    return { input: '', output: '' };
  });
  const stringArray = (candidate: unknown): string[] =>
    Array.isArray(candidate) ? candidate.filter((item): item is string => typeof item === 'string') : [];

  if (typeof raw.title !== 'string' || typeof raw.id !== 'string') return undefined;
  const statement =
    (typeof raw.statement === 'string' && raw.statement) ||
    (typeof raw.description === 'string' && raw.description) ||
    [
      typeof raw.inputFormat === 'string' ? `Input: ${raw.inputFormat}` : '',
      typeof raw.outputFormat === 'string' ? `Output: ${raw.outputFormat}` : '',
    ].filter(Boolean).join('\n');

  return {
    id: raw.id,
    title: raw.title,
    statement,
    topic: typeof raw.topic === 'string' ? raw.topic : config.domain,
    difficulty: raw.difficulty === 'beginner' || raw.difficulty === 'advanced' ? raw.difficulty : 'intermediate',
    constraints: stringArray(raw.constraints),
    examples,
    starterCode: {
      python: typeof starterCode?.python === 'string' ? starterCode.python : '',
      javascript: typeof starterCode?.javascript === 'string' ? starterCode.javascript : '',
      java: typeof starterCode?.java === 'string' ? starterCode.java : '',
    },
    hints: stringArray(raw.hints).slice(0, 3).length
      ? stringArray(raw.hints).slice(0, 3)
      : [
          'Start with a straightforward approach and estimate its time and space cost.',
          'Look for a data structure or invariant that avoids repeating work.',
          'Check boundary cases such as the smallest input, duplicates, and missing matches.',
        ],
  };
}

async function request<T>(
  url: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${BASE}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = `API request failed with status ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson.message) message = errJson.message;
      else if (typeof errJson.detail === 'string') message = errJson.detail;
      else if (errJson.detail?.message) message = errJson.detail.message;
    } catch {
      // ignore json parse error
    }
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

export async function startSession(
  config: InterviewConfig,
  token?: string
): Promise<StartSessionResponse> {
  if (USE_MOCK) {
    await delay(700 + Math.random() * 500);
    const sessionId = `sess_${Date.now()}`;
    const pool = getMockQuestionsForDomain(config.domain);
    const firstQuestion: Question = config.type === 'coding' ? {
      id: `q_${Date.now()}_intro`,
      index: 0,
      topic: config.domain,
      text: `Today's challenge is ${mockCodingProblem.title}. Return the indices of two values that add up to the target. Read the full statement on screen.`,
      isFollowUp: false,
      audioUrl: null,
    } : pool[0] ?? {
      id: `q_${Date.now()}_0`,
      index: 0,
      topic: config.domain,
      text: `Welcome to your ${config.domain} interview. Could you please introduce yourself and discuss your relevant background in this domain?`,
      isFollowUp: false,
      audioUrl: null,
    };

    const newSession: SessionSummary = {
      sessionId,
      config,
      startedAt: new Date().toISOString(),
      status: 'in_progress',
      overallScore: null,
      durationSec: 0,
    };

    const currentSessions = getStoredSessions();
    saveStoredSessions([newSession, ...currentSessions]);

    // Initialize answer counter in sessionStorage
    try {
      sessionStorage.setItem(SESSION_ANSWERS_KEY(sessionId), '0');
    } catch {
      // ignore
    }

    return {
      sessionId,
      firstQuestion,
      config,
      startedAt: newSession.startedAt,
      ...(config.type === 'coding' ? { problem: mockCodingProblem } : {}),
    };
  }

  const response = await request<StartSessionResponse & { codingProblem?: unknown }>(
    '/api/sessions',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    },
    token
  );
  const problem = normalizeCodingProblem(response.problem ?? response.codingProblem, response.config);
  if (response.config.type === 'coding' && !problem) {
    throw new ApiError(502, 'The coding problem was missing or invalid in the session response.');
  }
  return { ...response, ...(problem ? { problem } : {}) };
}

export async function getResumeProfile(token?: string): Promise<ResumeProfile | null> {
  return request<ResumeProfile | null>('/api/resume/profile', {}, token);
}

export async function uploadResume(file: File, token?: string): Promise<ResumeProfile> {
  const formData = new FormData();
  formData.append('file', file);
  return request<ResumeProfile>(
    '/api/resume/profile',
    { method: 'POST', body: formData },
    token
  );
}

export async function deleteResumeProfile(token?: string): Promise<void> {
  await request<void>('/api/resume/profile', { method: 'DELETE' }, token);
}

export async function submitAnswer(
  sessionId: string,
  questionId: string,
  audio: Blob,
  token?: string
): Promise<SubmitAnswerResponse> {
  if (USE_MOCK) {
    await delay(900 + Math.random() * 700);
    let answerCount = 0;
    try {
      const stored = sessionStorage.getItem(SESSION_ANSWERS_KEY(sessionId));
      answerCount = stored ? parseInt(stored, 10) : 0;
    } catch {
      // Continue with the mock default.
    }
    answerCount += 1;
    try {
      sessionStorage.setItem(SESSION_ANSWERS_KEY(sessionId), answerCount.toString());
    } catch {
      // Continue with the in-memory response.
    }

    const sessions = getStoredSessions();
    const session = sessions.find((s) => s.sessionId === sessionId);
    const domain = session?.config.domain || 'Python';
    const pool = getMockQuestionsForDomain(domain);
    const overallScore = Math.floor(75 + Math.random() * 18);
    const evaluation: AnswerEvaluation = {
      overall: overallScore,
      scores: {
        technicalCorrectness: Math.floor(78 + Math.random() * 18),
        conceptualUnderstanding: Math.floor(75 + Math.random() * 19),
        completeness: Math.floor(70 + Math.random() * 22),
        relevance: Math.floor(82 + Math.random() * 15),
        communicationClarity: Math.floor(75 + Math.random() * 18),
      },
      strengths: [
        'Direct, concise response addressing the core prompt promptly.',
        'Accurately defined underlying mechanisms and architectural trade-offs.',
      ],
      improvements: [
        'Provide concrete production figures or algorithmic complexities to reinforce key points.',
      ],
      missingConcepts: ['Edge case handling', 'Failure recovery scenario'],
      modelAnswer:
        'A comprehensive answer begins by stating the high-level principle, provides the exact data structure or runtime mechanism involved, and concludes with a trade-off comparison between alternative approaches in production.',
    };

    if (session?.config.type === 'coding') {
      const transcript = 'I would use a map to store visited values and check for the target complement in one pass.';
      let codingPhase = '';
      try {
        codingPhase = sessionStorage.getItem(SESSION_CODING_PHASE_KEY(sessionId)) || '';
      } catch {
        // Mock phase metadata is optional when storage is unavailable.
      }
      if (codingPhase === 'approach_followup') {
        try {
          sessionStorage.setItem(SESSION_CODING_PHASE_KEY(sessionId), 'code');
          sessionStorage.setItem(SESSION_ANSWERS_KEY(sessionId), '0');
        } catch {
          // Keep the mock response usable if storage is unavailable.
        }
        return { transcript, evaluation, nextQuestion: null, isComplete: false };
      }

      const isComplete = answerCount >= 2;
      const nextQuestion: Question | null = !isComplete ? {
        id: `q_${sessionId}_review_${answerCount}`,
        index: answerCount + 1,
        topic: session?.config.domain,
        text: answerCount === 1
          ? 'Which edge cases would you test for this solution?'
          : 'What is the time and space complexity of your approach?',
        isFollowUp: true,
        audioUrl: null,
      } : null;
      return { transcript, evaluation, nextQuestion, isComplete };
    }

    const isComplete = answerCount >= 4;
    const nextQIndex = answerCount;
    const nextQuestion = !isComplete && nextQIndex < pool.length ? pool[nextQIndex] : null;
    const transcripts = [
      'In our architecture, we prioritize isolation and stateless execution. When state must be shared, we employ synchronized queues or thread-safe atomic primitives to avoid deadlocks.',
      'Memory allocation is managed through reference tracking and generation sweeps. Cyclic structures are periodically scanned and collected when external links are severed.',
      'We use indexing on frequently filtered columns while ensuring high write-throughput tables avoid redundant compound indexes to prevent write amplification.',
      'When conflicts arise regarding technical architecture, I review empirical benchmarks and align decisions with our SLAs rather than subjective preferences.',
    ];
    const transcript =
      transcripts[(answerCount - 1) % transcripts.length] ||
      'I approach this problem by analyzing the trade-offs between space and time complexity, ensuring resilient fallback paths.';

    return {
      transcript,
      evaluation,
      nextQuestion,
      isComplete,
    };
  }

  const formData = new FormData();
  formData.append('questionId', questionId);
  formData.append('audio', audio);

  return request<SubmitAnswerResponse>(
    `/api/sessions/${sessionId}/answer`,
    {
      method: 'POST',
      body: formData,
    },
    token
  );
}

export async function submitCodingApproach(
  sessionId: string,
  audio: Blob,
  token?: string
): Promise<SubmitAnswerResponse> {
  if (USE_MOCK) {
    await delay(900);
    try {
      sessionStorage.setItem(SESSION_CODING_PHASE_KEY(sessionId), 'approach_followup');
      sessionStorage.setItem(SESSION_CODING_APPROACH_KEY(sessionId), 'I would use a hash map to store previously seen numbers and their indices.');
    } catch {
      // Phase persistence is best effort in mock mode.
    }
    const evaluation: AnswerEvaluation = {
      overall: 84,
      scores: {
        technicalCorrectness: 84,
        conceptualUnderstanding: 86,
        completeness: 80,
        relevance: 88,
        communicationClarity: 82,
      },
      strengths: ['Clear linear-time approach using a hash map.'],
      improvements: ['Explain how the approach avoids reusing the same element.'],
      missingConcepts: [],
    };
    return {
      transcript: 'I would use a hash map to store previously seen numbers and their indices.',
      evaluation,
      nextQuestion: {
        id: `q_${sessionId}_approach`,
        index: 1,
        topic: 'Approach',
        text: 'How would your map lookup handle duplicate values?',
        isFollowUp: true,
        audioUrl: null,
      },
      isComplete: false,
    };
  }
  const formData = new FormData();
  formData.append('audio', audio);
  return request<SubmitAnswerResponse>(
    `/api/sessions/${sessionId}/coding/approach`,
    { method: 'POST', body: formData },
    token
  );
}

export async function submitCode(
  sessionId: string,
  code: string,
  language: CodingLanguage,
  token?: string
): Promise<{ review: CodeReview; followUp: Question | null; phase: 'review' }> {
  if (USE_MOCK) {
    await delay(1100);
    try {
      sessionStorage.setItem(SESSION_CODING_PHASE_KEY(sessionId), 'review');
      sessionStorage.setItem(SESSION_ANSWERS_KEY(sessionId), '0');
      sessionStorage.setItem(SESSION_CODING_FINAL_CODE_KEY(sessionId), code);
    } catch {
      // Mock phase persistence is best effort.
    }
    return {
      review: mockCodeReview,
      followUp: {
        id: `q_${sessionId}_review_1`,
        index: 2,
        topic: 'Complexity',
        text: 'What are the time and space complexity of this solution?',
        isFollowUp: true,
        audioUrl: null,
      },
      phase: 'review',
    };
  }
  return request<{ review: CodeReview; followUp: Question | null; phase: 'review' }>(
    `/api/sessions/${sessionId}/coding/submit`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, language }),
    },
    token
  );
}

export async function endSession(
  sessionId: string,
  token?: string
): Promise<{ sessionId: string; newBadges: Badge[] }> {
  if (USE_MOCK) {
    await delay(600);
    const sessions = getStoredSessions();
    const updated = sessions.map((s) => {
      if (s.sessionId === sessionId) {
        return {
          ...s,
          status: 'completed' as const,
          overallScore: Math.floor(80 + Math.random() * 12),
          durationSec: Math.max(s.durationSec, 380 + Math.floor(Math.random() * 200)),
        };
      }
      return s;
    });
    saveStoredSessions(updated);
    return { sessionId, newBadges: [] };
  }

  const response = await request<{ sessionId: string; newBadges?: Badge[] }>(
    `/api/sessions/${sessionId}/end`,
    { method: 'POST' },
    token
  );
  return { ...response, newBadges: response.newBadges ?? [] };
}

export async function getBadges(token?: string): Promise<Badge[]> {
  if (USE_MOCK) {
    await delay(250);
    return mockBadges.map((badge) => ({ ...badge }));
  }
  const response = await request<{ badges: Badge[] }>('/api/badges', {}, token);
  return response.badges;
}

export async function getWeeklyGoal(token?: string): Promise<WeeklyGoal> {
  if (USE_MOCK) {
    await delay(250);
    try {
      const saved = localStorage.getItem(MOCK_WEEKLY_GOAL_KEY);
      if (saved) return JSON.parse(saved) as WeeklyGoal;
    } catch {
      // Use the fixture if local storage is unavailable or invalid.
    }
    return { ...mockWeeklyGoal, daysActive: [...mockWeeklyGoal.daysActive] };
  }
  return request<WeeklyGoal>('/api/goals/weekly', {}, token);
}

export async function setWeeklyGoal(
  targetInterviews: number,
  token?: string
): Promise<WeeklyGoal> {
  if (!Number.isInteger(targetInterviews) || targetInterviews < 1 || targetInterviews > 14) {
    throw new RangeError('Weekly interview target must be from 1 to 14.');
  }
  if (USE_MOCK) {
    await delay(250);
    const goal = await getWeeklyGoal(token);
    const updated = {
      ...goal,
      targetInterviews,
      achieved: goal.completedInterviews >= targetInterviews,
    };
    try {
      localStorage.setItem(MOCK_WEEKLY_GOAL_KEY, JSON.stringify(updated));
    } catch {
      // Keep the updated goal in this response even if persistence is unavailable.
    }
    return updated;
  }
  return request<WeeklyGoal>(
    '/api/goals/weekly',
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetInterviews }),
    },
    token
  );
}

export async function getReport(
  sessionId: string,
  token?: string
): Promise<InterviewReport> {
  if (USE_MOCK) {
    await delay(700);
    const report = mockReport(sessionId);
    const session = getStoredSessions().find((item) => item.sessionId === sessionId);
    if (session) {
      report.config = session.config;
      if (session.config.type === 'coding') {
        const language = session.config.codingLanguage || 'python';
        let finalCode = mockCodingSolutions[language];
        let approachTranscript = mockCodingReport.approachTranscript;
        try {
          finalCode = sessionStorage.getItem(SESSION_CODING_FINAL_CODE_KEY(sessionId)) || finalCode;
          approachTranscript = sessionStorage.getItem(SESSION_CODING_APPROACH_KEY(sessionId)) || approachTranscript;
        } catch {
          // Use fixture values when browser storage is unavailable.
        }
        report.coding = {
          ...mockCodingReport,
          language,
          finalCode,
          approachTranscript,
        };
      }
    }
    return report;
  }

  return request<InterviewReport>(`/api/sessions/${sessionId}/report`, {}, token);
}

export async function listSessions(token?: string): Promise<SessionSummary[]> {
  if (USE_MOCK) {
    await delay(500);
    return getStoredSessions();
  }

  return request<SessionSummary[]>('/api/sessions', {}, token);
}

export async function getStats(token?: string): Promise<DashboardStats> {
  if (USE_MOCK) {
    await delay(500);
    const sessions = getStoredSessions();
    const completed = sessions.filter((s) => s.status === 'completed' && s.overallScore !== null);
    const totalInterviews = completed.length || mockStats.totalInterviews;
    const avgScore =
      completed.length > 0
        ? Math.round(completed.reduce((acc, s) => acc + (s.overallScore || 0), 0) / completed.length)
        : mockStats.avgScore;
    const bestScore =
      completed.length > 0
        ? Math.max(...completed.map((s) => s.overallScore || 0))
        : mockStats.bestScore;
    const practiceMinutes =
      completed.length > 0
        ? Math.round(completed.reduce((acc, s) => acc + s.durationSec, 0) / 60)
        : mockStats.practiceMinutes;

    return {
      ...mockStats,
      totalInterviews,
      avgScore,
      bestScore,
      practiceMinutes,
    };
  }

  return request<DashboardStats>('/api/stats', {}, token);
}
