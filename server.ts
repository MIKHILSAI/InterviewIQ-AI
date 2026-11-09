import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // In-memory sessions storage for full-stack Node server fallback
  const sessionsStore = new Map<string, any>();
  const answersStore = new Map<string, any[]>();

  // ---------------------------------------------------------------------------
  // API Routes
  // ---------------------------------------------------------------------------
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      app: 'interviewiq-ai',
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/health/deep', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      checks: {
        node_runtime: process.version,
        storage: 'memory_ok',
        frontend: 'vite_ready',
      },
    });
  });

  app.get('/api/stats', (_req: Request, res: Response) => {
    const completed = Array.from(sessionsStore.values()).filter((s) => s.status === 'completed');
    const totalInterviews = completed.length || 14;
    const scores = completed.map((s) => s.overallScore || 82);
    const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 84;
    const bestScore = scores.length ? Math.max(...scores) : 92;
    const practiceMinutes = completed.reduce((a, s) => a + Math.round(s.durationSec / 60), 0) || 120;

    res.json({
      totalInterviews,
      avgScore,
      bestScore,
      practiceMinutes,
      streakDays: 4,
      trend: [
        { date: '2026-11-01', score: 76 },
        { date: '2026-11-03', score: 81 },
        { date: '2026-11-05', score: 84 },
        { date: '2026-11-08', score: 88 },
      ],
      weakTopics: [
        { topic: 'System Design Trade-offs', score: 68 },
        { topic: 'Concurrency & Locking', score: 72 },
        { topic: 'Memory Profiling', score: 75 },
      ],
    });
  });

  app.post('/api/sessions', (req: Request, res: Response) => {
    const config = req.body;
    if (![5, 10, 15].includes(config.durationMin)) {
      return res.status(422).json({
        detail: {
          code: 'INVALID_DURATION',
          message: 'Duration must be 5, 10, or 15 minutes.',
        },
      });
    }

    const sessionId = `sess_${Date.now()}`;
    const firstQuestion = {
      id: `q_${Date.now()}_0`,
      index: 0,
      topic: config.domain || 'Fundamentals',
      text:
        config.language === 'ta'
          ? `வணக்கம்! உங்கள் ${config.domain} அனுபவம் மற்றும் அடிப்படை கோட்பாடுகளை பற்றி சுருக்கமாக விளக்குங்கள்.`
          : config.language === 'hi'
            ? `नमस्ते! ${config.domain} में अपने अनुभव और बुनियादी अवधारणाओं के बारे में बताइए।`
            : `Welcome to your ${config.domain} interview. Could you explain your background and core understanding of foundational concepts in this domain?`,
      isFollowUp: false,
      audioUrl: null,
    };

    const sessionRecord = {
      sessionId,
      config,
      startedAt: new Date().toISOString(),
      status: 'in_progress',
      currentQuestion: firstQuestion,
      overallScore: null,
      durationSec: 0,
      questionsAsked: 1,
    };

    sessionsStore.set(sessionId, sessionRecord);
    answersStore.set(sessionId, []);

    res.json({
      sessionId,
      firstQuestion,
      config,
      startedAt: sessionRecord.startedAt,
    });
  });

  app.post('/api/sessions/:id/answer', (req: Request, res: Response) => {
    const { id } = req.params;
    const session = sessionsStore.get(id);

    if (!session) {
      return res.status(404).json({
        detail: { code: 'SESSION_NOT_FOUND', message: 'Interview session not found.' },
      });
    }

    const answers = answersStore.get(id) || [];
    const turnCount = answers.length + 1;
    const isComplete = turnCount >= 4;

    const evaluation = {
      overall: Math.floor(78 + Math.random() * 15),
      scores: {
        technicalCorrectness: 82,
        conceptualUnderstanding: 80,
        completeness: 75,
        relevance: 88,
        communicationClarity: 85,
      },
      strengths: [
        'Clear structured thought process and precise vocabulary.',
        'Good command of underlying execution semantics.',
      ],
      improvements: [
        'Elaborate on production failure modes and recovery strategies.',
      ],
      missingConcepts: ['Edge case handling', 'Throughput trade-offs'],
      modelAnswer:
        'A comprehensive answer identifies the exact mechanism, highlights the trade-offs between space and time, and illustrates how production systems mitigate failures.',
    };

    const nextQuestion = isComplete
      ? null
      : {
          id: `q_${Date.now()}_${turnCount}`,
          index: turnCount,
          topic: session.config.domain,
          text:
            session.config.language === 'ta'
              ? 'அருமை. இப்போது இந்த அமைப்பில் ஏற்படும் concurrency சிக்கல்களை எவ்வாறு கையாளுவீர்கள்?'
              : `Building on your point, how would you address concurrency conflicts and scaling bottlenecks in ${session.config.domain}?`,
          isFollowUp: true,
          audioUrl: null,
        };

    answers.push({ questionId: req.body?.questionId, evaluation });
    answersStore.set(id, answers);

    res.json({
      transcript:
        'In our architecture, we prioritize stateless execution, defensive resource isolation, and explicit synchronization boundaries.',
      evaluation,
      nextQuestion,
      isComplete,
    });
  });

  app.post('/api/sessions/:id/end', (req: Request, res: Response) => {
    const { id } = req.params;
    const session = sessionsStore.get(id);

    if (session) {
      session.status = 'completed';
      session.overallScore = 84;
      session.durationSec = 360;
      session.completedAt = new Date().toISOString();
      sessionsStore.set(id, session);
    }

    res.json({ sessionId: id });
  });

  app.get('/api/sessions/:id/report', (req: Request, res: Response) => {
    const { id } = req.params;
    const session = sessionsStore.get(id) || {
      sessionId: id,
      config: {
        type: 'technical',
        domain: 'Python & Distributed Systems',
        difficulty: 'intermediate',
        durationMin: 5,
        language: 'en',
      },
      startedAt: new Date(Date.now() - 360000).toISOString(),
      completedAt: new Date().toISOString(),
      durationSec: 360,
    };

    res.json({
      sessionId: id,
      config: session.config,
      startedAt: session.startedAt,
      completedAt: session.completedAt || new Date().toISOString(),
      durationSec: session.durationSec || 360,
      overallScore: 84,
      scores: {
        technicalCorrectness: 86,
        conceptualUnderstanding: 82,
        completeness: 80,
        relevance: 90,
        communicationClarity: 85,
      },
      topicScores: [
        { topic: 'Core Concepts', score: 88 },
        { topic: 'Concurrency & Threading', score: 79 },
        { topic: 'System Design', score: 85 },
      ],
      strengths: [
        'Strong articulate grasp of process versus thread memory layout.',
        'Clear explanations with practical production examples.',
      ],
      weaknesses: [
        'Strengthen technical depth when explaining distributed locking mechanisms.',
        'Address memory reclamation overhead in high-throughput workloads.',
      ],
      results: [
        {
          question: {
            id: 'q1',
            index: 0,
            topic: 'Core Mechanics',
            text: 'Can you explain how processes and threads differ in memory management?',
            isFollowUp: false,
            audioUrl: null,
          },
          transcript:
            'A process has its own isolated virtual address space, while threads within a process share memory like the heap and data segments.',
          evaluation: {
            overall: 86,
            scores: {
              technicalCorrectness: 90,
              conceptualUnderstanding: 85,
              completeness: 80,
              relevance: 90,
              communicationClarity: 85,
            },
            strengths: ['Accurate definition of virtual memory spaces'],
            improvements: ['Mention TLB context switch overhead'],
            missingConcepts: ['TLB invalidation'],
            modelAnswer:
              'Processes represent isolated memory domains requiring IPC, while threads share heap and context within the same address space with lighter context switches.',
          },
        },
      ],
      studyPlan: [
        {
          topic: 'Concurrency Control & Race Conditions',
          reason: 'Identified opportunity to sharpen synchronization primitive details.',
          suggestedQuestions: [
            'How do optimistic and pessimistic locks differ under write-heavy loads?',
            'What causes priority inversion and how is it resolved?',
          ],
        },
      ],
      summaryFeedback:
        'You demonstrated confident technical competence and strong problem-solving skills throughout the interview. Deepening your explanations around concurrency edge cases will elevate your performance to senior engineering readiness.',
      summaryAudioUrl: null,
    });
  });

  app.get('/api/sessions', (_req: Request, res: Response) => {
    const list = Array.from(sessionsStore.values()).map((s) => ({
      sessionId: s.sessionId,
      config: s.config,
      startedAt: s.startedAt,
      status: s.status,
      overallScore: s.overallScore,
      durationSec: s.durationSec,
    }));
    res.json(list);
  });

  // ---------------------------------------------------------------------------
  // Vite Integration (Dev) vs Static Files (Prod)
  // ---------------------------------------------------------------------------
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req: Request, res: Response) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`InterviewIQ AI server listening on http://0.0.0.0:${PORT}`);
  });
}

createServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
