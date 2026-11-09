import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import {
  InterviewConfig,
  Question,
  TranscriptTurn,
  AnswerEvaluation,
  CodingProblem,
} from '@/lib/types';
import { SESSION_STORAGE_KEY } from '@/lib/constants';
import { submitAnswer, endSession } from '@/lib/api';
import { useAudioRecorder } from '@/hooks/use-audio-recorder';
import { useAudioPlayer } from '@/hooks/use-audio-player';
import { SessionTopbar } from '@/components/session/session-topbar';
import { InterviewerPanel } from '@/components/session/interviewer-panel';
import { Waveform } from '@/components/session/waveform';
import { RecordControls, SessionPhase } from '@/components/session/record-controls';
import { TranscriptPanel } from '@/components/session/transcript-panel';
import { ProcessingStepper } from '@/components/session/processing-stepper';
import { IntroCard } from '@/components/session/intro-card';
import { VoiceOrb } from '@/components/shared/voice-orb';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import { MessageSquare, RotateCcw, LogOut } from 'lucide-react';
import { CodingSession } from '@/components/session/coding/coding-session';

export function SessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { getToken } = useAuth();

  const [phase, setPhase] = useState<SessionPhase>('intro');
  const [config, setConfig] = useState<InterviewConfig | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [codingProblem, setCodingProblem] = useState<CodingProblem | undefined>();
  const [questionIndex, setQuestionIndex] = useState(0);
  const [turns, setTurns] = useState<TranscriptTurn[]>([]);
  const [evaluations, setEvaluations] = useState<Record<number, AnswerEvaluation>>({});
  const [remainingSeconds, setRemainingSeconds] = useState(600);
  const [timeUp, setTimeUp] = useState(false);
  const [mobileTranscriptOpen, setMobileTranscriptOpen] = useState(false);

  const recorder = useAudioRecorder();
  const player = useAudioPlayer();
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Read session handoff data on mount
  useEffect(() => {
    if (!sessionId) {
      navigate('/setup');
      return;
    }

    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY(sessionId));
      if (!stored) {
        toast.error('Session not found. Please configure a new interview.');
        navigate('/setup');
        return;
      }

      const parsed = JSON.parse(stored);
      setConfig(parsed.config);
      setCurrentQuestion(parsed.firstQuestion);
      setCodingProblem(parsed.problem);
      setRemainingSeconds(parsed.config.durationMin * 60);

      // Append initial interviewer turn
      const firstTurn: TranscriptTurn = {
        id: `turn_${Date.now()}_0`,
        role: 'interviewer',
        text: parsed.firstQuestion.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setTurns([firstTurn]);
    } catch {
      toast.error('Failed to load session details.');
      navigate('/setup');
    }
  }, [sessionId, navigate]);

  // Tab close warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (phase !== 'intro' && phase !== 'finishing') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [phase]);

  // Countdown timer
  useEffect(() => {
    if (phase === 'intro' || phase === 'finishing') return;

    timerIntervalRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          setTimeUp(true);
          toast.warning("Time's up! Finish your current answer.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [phase]);

  // Handle asking question audio
  const askQuestion = useCallback(
    async (q: Question, lang: InterviewConfig['language']) => {
      setPhase('asking');
      try {
        await player.speak(q.text, q.audioUrl, lang);
      } catch {
        // speech player error caught
      } finally {
        setPhase('ready');
      }
    },
    [player]
  );

  // Begin interview from Intro card
  const handleBegin = () => {
    if (!currentQuestion || !config) return;
    askQuestion(currentQuestion, config.language);
  };

  // Start recording answer
  const handleStartRecord = async () => {
    player.stop();
    await recorder.start();
    setPhase('recording');
  };

  // Stop recording answer
  const handleStopRecord = () => {
    if (recorder.durationMs < 1500) {
      toast.error('That was too short. Please speak your answer.');
      recorder.reset();
      setPhase('ready');
      return;
    }
    recorder.stop();
    setPhase('review');
  };

  // Re-record answer
  const handleRerecord = () => {
    recorder.reset();
    setPhase('ready');
  };

  // Wrap up & generate final report
  const handleFinishing = useCallback(async () => {
    if (!sessionId) return;
    setPhase('finishing');
    player.stop();
    recorder.stop();

    try {
      const token = (await getToken()) ?? undefined;
      const response = await endSession(sessionId, token);
      if (response.newBadges.length > 0) {
        try {
          sessionStorage.setItem(
            `iiq:newBadges:${sessionId}`,
            JSON.stringify(response.newBadges)
          );
        } catch {
          toast.error('Interview ended, but the badge celebration could not be saved.');
        }
      }
      sessionStorage.removeItem(SESSION_STORAGE_KEY(sessionId));
      navigate(`/results/${sessionId}`);
    } catch {
      toast.error('Failed to finalize session.');
      navigate(`/results/${sessionId}`);
    }
  }, [sessionId, getToken, navigate, player, recorder]);

  // Submit recorded answer
  const handleSubmitAnswer = async () => {
    if (!sessionId || !currentQuestion || !recorder.blob) return;

    setPhase('processing');
    const recordedBlob = recorder.blob;

    try {
      const token = (await getToken()) ?? undefined;
      const res = await submitAnswer(sessionId, currentQuestion.id, recordedBlob, token);

      // Append candidate turn
      const candidateTurn: TranscriptTurn = {
        id: `turn_${Date.now()}_cand`,
        role: 'candidate',
        text: res.transcript,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setTurns((prev) => [...prev, candidateTurn]);
      setEvaluations((prev) => ({
        ...prev,
        [questionIndex]: res.evaluation,
      }));

      // Check if session should finish
      if (res.isComplete || !res.nextQuestion || timeUp) {
        await handleFinishing();
        return;
      }

      // Prepare next question
      const nextQ = res.nextQuestion;
      setCurrentQuestion(nextQ);
      setQuestionIndex((prev) => prev + 1);

      // Append new interviewer turn
      const nextInterviewerTurn: TranscriptTurn = {
        id: `turn_${Date.now()}_ai`,
        role: 'interviewer',
        text: nextQ.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setTurns((prev) => [...prev, nextInterviewerTurn]);

      recorder.reset();

      // Speak next question
      if (config) {
        askQuestion(nextQ, config.language);
      }
    } catch {
      setPhase('error');
      toast.error('Could not submit answer. Your audio recording was preserved.');
    }
  };

  if (!sessionId || !config || !currentQuestion) {
    return null;
  }

  if (config.type === 'coding') {
    return (
      <CodingSession
        sessionId={sessionId}
        config={config}
        firstQuestion={currentQuestion}
        problem={codingProblem}
      />
    );
  }

  // Pre-interview Intro Screen
  if (phase === 'intro') {
    return (
      <div className="min-h-screen bg-background">
        <IntroCard config={config} onBegin={handleBegin} />
      </div>
    );
  }

  // Finalizing Screen
  if (phase === 'finishing') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-center space-y-6">
        <VoiceOrb state="thinking" size={170} />
        <div className="space-y-2 max-w-md">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">
            Wrapping up your interview…
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Synthesizing rubric scoring, identifying key strengths, and compiling your personalized study plan.
          </p>
        </div>
      </div>
    );
  }

  const orbState =
    phase === 'asking'
      ? 'speaking'
      : phase === 'recording'
      ? 'listening'
      : phase === 'processing'
      ? 'thinking'
      : 'idle';

  const statusLabel =
    phase === 'asking'
      ? 'Interviewer is speaking…'
      : phase === 'recording'
      ? 'Listening to your response…'
      : phase === 'processing'
      ? 'Thinking & evaluating…'
      : phase === 'review'
      ? 'Review your recording'
      : 'Your turn to answer';

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-500/10 blur-[140px] rounded-full pointer-events-none -z-10" />

      {/* Top Bar */}
      <SessionTopbar
        config={config}
        questionIndex={questionIndex}
        totalQuestions={config.durationMin === 5 ? 4 : config.durationMin === 10 ? 6 : 8}
        remainingSeconds={remainingSeconds}
        onEndEarly={handleFinishing}
      />

      {/* Main Stage Grid: ~65% Stage, ~35% Transcript */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch min-h-0">
        {/* Left Column: Interviewer Stage & Controls (~65%) */}
        <div className="lg:col-span-8 flex flex-col justify-between space-y-6">
          {/* Interviewer Speech & Captions */}
          <InterviewerPanel
            question={currentQuestion}
            language={config.language}
            orbState={orbState}
            statusLabel={statusLabel}
            isSpeaking={player.isSpeaking}
            needsGesture={player.needsUserGesture}
            onPlayAudio={() => askQuestion(currentQuestion, config.language)}
            onSkipAudio={() => {
              player.stop();
              setPhase('ready');
            }}
            onReplayAudio={() => askQuestion(currentQuestion, config.language)}
          />

          {/* Live Audio Waveform when recording */}
          <div className="flex justify-center min-h-[64px] items-center">
            {phase === 'recording' ? (
              <Waveform level={recorder.level} isRecording={true} />
            ) : phase === 'processing' ? (
              <ProcessingStepper />
            ) : null}
          </div>

          {/* Network Error Card */}
          {phase === 'error' && (
            <div className="max-w-md mx-auto p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-center space-y-3">
              <p className="text-xs font-semibold text-destructive">
                Network error occurred while submitting your response. Your recording was not lost.
              </p>
              <div className="flex items-center justify-center gap-2">
                <Button onClick={handleSubmitAnswer} size="sm" variant="outline" className="gap-1 text-xs">
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Retry Submission</span>
                </Button>
                <Button onClick={handleFinishing} size="sm" variant="ghost" className="gap-1 text-xs text-destructive">
                  <LogOut className="h-3.5 w-3.5" />
                  <span>End &amp; Get Report</span>
                </Button>
              </div>
            </div>
          )}

          {/* Primary Record & Submit Controls Cluster */}
          <div className="pb-4">
            <RecordControls
              phase={phase}
              durationMs={recorder.durationMs}
              blob={recorder.blob}
              onStartRecord={handleStartRecord}
              onStopRecord={handleStopRecord}
              onRerecord={handleRerecord}
              onSubmitAnswer={handleSubmitAnswer}
            />
          </div>
        </div>

        {/* Right Column: Desktop Transcript Panel (~35%) */}
        <div className="hidden lg:block lg:col-span-4 h-[calc(100vh-6.5rem)] sticky top-20">
          <TranscriptPanel turns={turns} evaluations={evaluations} className="h-full" />
        </div>
      </main>

      {/* Mobile Transcript Drawer Trigger */}
      <div className="lg:hidden fixed bottom-4 right-4 z-40">
        <Sheet open={mobileTranscriptOpen} onOpenChange={setMobileTranscriptOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full shadow-lg border-primary/40 bg-card text-foreground gap-1.5 px-4 h-10"
            >
              <MessageSquare className="h-4 w-4 text-primary" />
              <span>Transcript ({turns.length})</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[75vh] p-0 flex flex-col bg-card rounded-t-2xl">
            <SheetHeader className="p-4 border-b border-border">
              <SheetTitle className="text-sm font-bold">Live Transcript</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-hidden p-2">
              <TranscriptPanel turns={turns} evaluations={evaluations} className="border-0 shadow-none h-full" />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
