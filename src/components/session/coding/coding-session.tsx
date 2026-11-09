import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CodeEditor } from '@/components/session/coding/code-editor';
import { CodeReviewCard } from '@/components/session/coding/code-review-card';
import { VoiceOrb } from '@/components/shared/voice-orb';
import { Waveform } from '@/components/session/waveform';
import { Logo } from '@/components/shared/logo';
import { ConfigBadges } from '@/components/shared/config-badges';
import { useAudioPlayer } from '@/hooks/use-audio-player';
import { useAudioRecorder } from '@/hooks/use-audio-recorder';
import { ApiError, endSession, submitAnswer, submitCodingApproach, submitCode } from '@/lib/api';
import { CODING_LANGUAGES, SESSION_STORAGE_KEY } from '@/lib/constants';
import {
  CodingLanguage,
  CodingPhase,
  CodingProblem,
  CodeReview,
  InterviewConfig,
  Question,
  TranscriptTurn,
} from '@/lib/types';
import { toast } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';
import { Check, ChevronRight, Lightbulb, Lock, Mic, Play, RotateCcw, Send, Square } from 'lucide-react';

type CodingSessionProps = {
  sessionId: string;
  config: InterviewConfig;
  firstQuestion: Question;
  problem?: CodingProblem;
};

const codingSourceKey = (sessionId: string) => `iiq:codingCode:${sessionId}`;
const codingLanguageKey = (sessionId: string) => `iiq:codingLanguage:${sessionId}`;
const starterCodeFor = (problem: CodingProblem | undefined, language: CodingLanguage) => {
  const provided = problem?.starterCode[language];
  if (provided?.trim()) return provided;

  if (language === 'python') return 'def solution():\n    # Write your solution here.\n    pass\n';
  if (language === 'javascript') return 'function solution() {\n  // Write your solution here.\n}\n';
  return 'class Solution {\n    public void solve() {\n        // Write your solution here.\n    }\n}\n';
};
const steps: { id: Exclude<CodingPhase, 'done'>; label: string }[] = [
  { id: 'understand', label: 'Understand' },
  { id: 'approach', label: 'Explain approach' },
  { id: 'code', label: 'Write code' },
  { id: 'review', label: 'Review' },
];

export function CodingSession({ sessionId, config, firstQuestion, problem: incomingProblem }: CodingSessionProps) {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const player = useAudioPlayer();
  const recorder = useAudioRecorder();
  const problem = incomingProblem;
  const initialLanguage = config.codingLanguage || 'python';

  const [phase, setPhase] = useState<CodingPhase>('understand');
  const [language, setLanguage] = useState<CodingLanguage>(() => {
    try {
      const saved = sessionStorage.getItem(codingLanguageKey(sessionId));
      if (saved === 'python' || saved === 'javascript' || saved === 'java') return saved;
    } catch {
      // Use the configured language when storage is unavailable.
    }
    return initialLanguage;
  });
  const [code, setCode] = useState(() => {
    try {
      const savedCode = sessionStorage.getItem(codingSourceKey(sessionId));
      if (savedCode?.trim()) return savedCode;
    } catch {
      // Fall back to the problem scaffold when session storage is unavailable.
    }
    return problem ? starterCodeFor(problem, initialLanguage) : '';
  });
  const starterCode = starterCodeFor(problem, language);
  const [activeTab, setActiveTab] = useState<'problem' | 'transcript'>('problem');
  const [mobileTab, setMobileTab] = useState<'problem' | 'interviewer' | 'code'>('interviewer');
  const [hintCount, setHintCount] = useState(0);
  const [review, setReview] = useState<CodeReview | null>(null);
  const [highlightLine, setHighlightLine] = useState<number>();
  const [currentQuestion, setCurrentQuestion] = useState<Question>(firstQuestion);
  const [approachFollowup, setApproachFollowup] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [busyMessage, setBusyMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [turns, setTurns] = useState<TranscriptTurn[]>([
    { id: `initial-${firstQuestion.id}`, role: 'interviewer', text: firstQuestion.text, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
  ]);
  const retryAction = useRef<(() => Promise<void>) | null>(null);
  const permissionError = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (problem && !code.trim()) setCode(starterCode);
  }, [problem?.id, language, starterCode]);

  useEffect(() => {
    try {
      sessionStorage.setItem(codingSourceKey(sessionId), code);
    } catch {
      toast.error('Code could not be autosaved in this browser session.');
    }
  }, [code, sessionId]);

  useEffect(() => {
    try {
      sessionStorage.setItem(codingLanguageKey(sessionId), language);
    } catch {
      toast.error('The selected coding language could not be saved in this browser session.');
    }
  }, [language, sessionId]);

  useEffect(() => {
    if (recorder.status === 'stopped' && recorder.blob) setAudioReady(true);
    if (recorder.error && permissionError.current !== recorder.error) {
      permissionError.current = recorder.error;
      toast.error(recorder.error);
    }
  }, [recorder.status, recorder.blob, recorder.durationMs, recorder.error]);

  const speak = useCallback(async (question: Question) => {
    setCurrentQuestion(question);
    setTurns((previous) => [
      ...previous,
      { id: `interviewer-${Date.now()}`, role: 'interviewer', text: question.text, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    ]);
    try {
      await player.speak(question.text, question.audioUrl, config.language);
    } catch {
      toast.error('Audio playback failed. Use Replay to try again.');
    }
  }, [config.language, player]);

  const handleFinish = useCallback(async () => {
    player.stop();
    recorder.stop();
    setPhase('done');
    try {
      const token = (await getToken()) ?? undefined;
      const response = await endSession(sessionId, token);
      if (response.newBadges.length > 0) {
        sessionStorage.setItem(`iiq:newBadges:${sessionId}`, JSON.stringify(response.newBadges));
      }
      sessionStorage.removeItem(SESSION_STORAGE_KEY(sessionId));
      sessionStorage.removeItem(codingSourceKey(sessionId));
      sessionStorage.removeItem(codingLanguageKey(sessionId));
      navigate(`/results/${sessionId}`);
    } catch {
      toast.error('Could not finalize the coding interview. Please retry.');
      setPhase('review');
    }
  }, [getToken, navigate, player, recorder, sessionId]);

  const handleBeginApproach = () => {
    player.stop();
    setPhase('approach');
    setMobileTab('interviewer');
  };

  const startRecording = async () => {
    player.stop();
    setAudioReady(false);
    permissionError.current = undefined;
    await recorder.start();
  };

  const stopRecording = () => {
    if (recorder.durationMs < 1500) {
      toast.error('Please speak for at least 1.5 seconds.');
      recorder.reset();
      return;
    }
    recorder.stop();
  };

  const appendTurn = (role: TranscriptTurn['role'], text: string) => {
    setTurns((previous) => [
      ...previous,
      { id: `${role}-${Date.now()}`, role, text, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    ]);
  };

  const submitApproachAudio = async () => {
    if (!recorder.blob) {
      toast.error('Your recording is still being prepared. Please try again.');
      return;
    }
    if (!currentQuestion) {
      toast.error('The current interviewer question is unavailable. Please reload the session.');
      return;
    }
    const blob = recorder.blob;
    const question = currentQuestion;
    const action = async () => {
      setBusy(true);
      setErrorMessage('');
      setBusyMessage('Processing your approach…');
      try {
        const token = (await getToken()) ?? undefined;
        const response = await submitCodingApproach(sessionId, blob, token);
        const feedback = [
          ...response.evaluation.strengths,
          ...response.evaluation.improvements,
        ].join(' ');
        appendTurn('candidate', response.transcript);
        if (feedback) appendTurn('interviewer', feedback);
        recorder.reset();
        setAudioReady(false);
        if (response.nextQuestion) {
          const nextQuestion = response.nextQuestion;
          setCurrentQuestion(nextQuestion);
          setTurns((previous) => [
            ...previous,
            { id: `interviewer-${nextQuestion.id}`, role: 'interviewer', text: nextQuestion.text, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
          ]);
          setApproachFollowup(true);
          void player.speak(nextQuestion.text, nextQuestion.audioUrl, config.language).catch(() => {
            toast.error('Audio playback failed. Use Replay to try again.');
          });
        } else {
          setApproachFollowup(false);
          setPhase('code');
          setMobileTab('code');
        }
      } catch (error) {
        const detail = error instanceof ApiError ? error.message : 'Check your connection and retry.';
        setErrorMessage(`Could not submit your approach. Your recording is preserved. ${detail}`);
        toast.error(`Could not submit your approach. ${detail}`);
      } finally {
        setBusy(false);
        setBusyMessage('');
      }
    };
    retryAction.current = action;
    await action();
  };

  const submitVoiceFollowup = async () => {
    if (!recorder.blob || !currentQuestion) {
      toast.error('Record your response before submitting.');
      return;
    }
    const blob = recorder.blob;
    const question = currentQuestion;
    const action = async () => {
      setBusy(true);
      setErrorMessage('');
      setBusyMessage('Transcribing and evaluating your response…');
      try {
        const token = (await getToken()) ?? undefined;
        const response = await submitAnswer(sessionId, question.id, blob, token);
        appendTurn('candidate', response.transcript);
        recorder.reset();
        setAudioReady(false);
        if (phase === 'approach') {
          if (response.nextQuestion && !response.isComplete) {
            setApproachFollowup(true);
            void speak(response.nextQuestion);
          } else {
            setApproachFollowup(false);
            setPhase('code');
            setMobileTab('code');
          }
          return;
        }
        if (response.isComplete || !response.nextQuestion) {
          await handleFinish();
          return;
        }
        void speak(response.nextQuestion);
      } catch (error) {
        const detail = error instanceof ApiError
          ? error.message
          : 'A network error interrupted submission. Check your connection and retry.';
        setErrorMessage(`Could not submit your voice answer. Your recording is preserved. ${detail}`);
        toast.error(`Could not submit your answer. ${detail}`);
      } finally {
        setBusy(false);
        setBusyMessage('');
      }
    };
    retryAction.current = action;
    await action();
  };

  const submitVoice = () => {
    if (phase === 'approach' && !approachFollowup) void submitApproachAudio();
    else void submitVoiceFollowup();
  };

  const handleSubmitCode = async () => {
    if (!code.trim() || code.trim() === starterCode.trim()) return;
    if (code.length > 20000) {
      toast.error('Code must be 20,000 characters or fewer.');
      return;
    }
    const submittedCode = code;
    const action = async () => {
      setBusy(true);
      setBusyMessage('Reviewing your code…');
      setErrorMessage('');
      try {
        const token = (await getToken()) ?? undefined;
        const response = await submitCode(sessionId, submittedCode, language, token);
        setReview(response.review);
        setPhase('review');
        setMobileTab('interviewer');
        if (response.followUp) void speak(response.followUp);
        else await handleFinish();
      } catch {
        setErrorMessage('Could not review your code. Your code is preserved; retry when you are ready.');
        toast.error('Code review failed. Check your connection and retry.');
      } finally {
        setBusy(false);
        setBusyMessage('');
      }
    };
    retryAction.current = action;
    await action();
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && phase === 'code' && !busy) {
        event.preventDefault();
        void handleSubmitCode();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [phase, busy, handleSubmitCode]);

  const changeLanguage = (nextLanguage: CodingLanguage) => {
    if (nextLanguage === language) return;
    if (!window.confirm('Switching language replaces the current code with the new starter template. Continue?')) return;
    setLanguage(nextLanguage);
    setCode(starterCodeFor(problem, nextLanguage));
  };

  if (!problem) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 rounded-2xl" />
        <p className="text-sm text-destructive">The coding problem could not be loaded. Please return to setup and start again.</p>
        <Button onClick={() => navigate('/setup')} variant="outline">Back to setup</Button>
      </div>
    );
  }

  const displayedHint = hintCount > 0 ? problem.hints[hintCount - 1] : '';
  const currentStepIndex = steps.findIndex((step) => step.id === phase);
  const editorPane = (
    <div className="flex min-h-[420px] flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-foreground">Code editor</span>
          {phase !== 'code' && <Badge variant="outline" className="gap-1"><Lock className="h-3 w-3" />Read only</Badge>}
        </div>
        <select
          aria-label="Coding language"
          value={language}
          disabled={phase !== 'code' || busy}
          onChange={(event) => changeLanguage(event.target.value as CodingLanguage)}
          className="h-9 rounded-lg border border-border bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {CODING_LANGUAGES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
      </div>
      <div className="h-[360px] min-h-[360px] flex-1">
        <CodeEditor
          value={code}
          onChange={setCode}
          language={language}
          readOnly={phase !== 'code' || busy}
          highlightLine={highlightLine}
        />
      </div>
      {phase === 'code' && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border p-3">
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => setCode(starterCode)} disabled={busy}>
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />Reset to starter
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setHintCount((count) => Math.min(problem.hints.length, 3, count + 1))}
              disabled={hintCount >= Math.min(problem.hints.length, 3)}
            >
              <Lightbulb className="mr-1.5 h-3.5 w-3.5" />Show hint ({hintCount}/3)
            </Button>
          </div>
          <Button
            type="button"
            variant="gradient"
            onClick={() => void handleSubmitCode()}
            disabled={busy || !code.trim() || code.trim() === starterCode.trim()}
          >
            <Send className="mr-2 h-4 w-4" />Submit code <span className="ml-2 hidden text-xs opacity-80 sm:inline">Ctrl/⌘ + Enter</span>
          </Button>
        </div>
      )}
      {displayedHint && phase === 'code' && (
        <div className="border-t border-border bg-primary/5 p-3 text-sm text-foreground" aria-live="polite">
          <span className="font-semibold">Hint {hintCount}: </span>{displayedHint}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <header className="sticky top-0 z-30 flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-border bg-card/90 px-4 py-2 backdrop-blur-md sm:px-6">
        <div className="flex items-center gap-3">
          <Logo size="sm" showText={false} />
          <div className="hidden sm:block"><ConfigBadges config={config} /></div>
        </div>
        <Button variant="outline" size="sm" onClick={() => {
          if (window.confirm('End this coding interview and generate your report?')) void handleFinish();
        }}>End interview</Button>
      </header>

      <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6">
        <nav aria-label="Coding interview progress" className="grid grid-cols-4 gap-2">
          {steps.map((step, index) => {
            const isDone = phase === 'done' || index < currentStepIndex;
            const isCurrent = step.id === phase;
            return (
              <div key={step.id} className={cn('flex items-center gap-2 rounded-xl border p-2 text-xs sm:p-3 sm:text-sm', isCurrent ? 'border-primary bg-primary/10 text-primary' : isDone ? 'border-success/30 bg-success/5 text-success' : 'border-border bg-card text-muted-foreground')}>
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current">
                  {isDone ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </span>
                <span className="hidden font-semibold sm:inline">{step.label}</span>
              </div>
            );
          })}
        </nav>

        <main className="grid min-h-[calc(100vh-12rem)] grid-cols-1 gap-5 lg:grid-cols-12">
          <section className={cn('space-y-4 lg:col-span-5', mobileTab === 'code' && 'hidden lg:block')}>
            <Card className={cn('space-y-4 p-5', mobileTab !== 'interviewer' && 'hidden lg:block')}>
              {phase === 'code' ? (
                <div className="flex items-center gap-4">
                  <VoiceOrb size={74} state="idle" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-muted-foreground">Write code</p>
                    <p className="mt-1 text-sm leading-relaxed text-foreground">Your approach is captured. Write your solution in the code editor.</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4">
                    <VoiceOrb size={74} state={player.isSpeaking ? 'speaking' : recorder.status === 'recording' ? 'listening' : busy ? 'thinking' : 'idle'} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-muted-foreground">
                        {player.isSpeaking ? 'Interviewer is speaking…' : recorder.status === 'recording' ? 'Listening to your response…' : busy ? busyMessage : 'Interviewer'}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-foreground">{currentQuestion.text}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => void player.speak(currentQuestion.text, currentQuestion.audioUrl, config.language)}>
                      <Play className="mr-1.5 h-3.5 w-3.5" />Replay
                    </Button>
                    {phase === 'understand' && (
                      <>
                        <Button type="button" size="sm" variant="outline" onClick={() => player.stop()}>Skip audio</Button>
                        <Button type="button" size="sm" variant="gradient" onClick={handleBeginApproach}>
                          Continue <ChevronRight className="ml-1.5 h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </>
                )}

              {(phase === 'approach' || phase === 'review') && (
                <div className="space-y-3 border-t border-border pt-4">
                  <p className="text-sm font-semibold text-foreground">
                    {phase === 'approach' && !approachFollowup ? 'Explain your approach out loud' : 'Answer the follow-up out loud'}
                  </p>
                  {recorder.status === 'recording' && (
                    <>
                      <p className="text-center font-mono text-sm text-primary">
                        {Math.floor(recorder.durationMs / 60000)}:{String(Math.floor(recorder.durationMs / 1000) % 60).padStart(2, '0')} / 2:00
                      </p>
                      <Waveform level={recorder.level} isRecording />
                    </>
                  )}
                  {!audioReady && recorder.status !== 'recording' && (
                    <Button type="button" className="w-full rounded-xl" onClick={() => void startRecording()} disabled={busy}>
                      <Mic className="mr-2 h-5 w-5" />Start recording
                    </Button>
                  )}
                  {recorder.status === 'recording' && (
                    <Button type="button" variant="destructive" className="w-full rounded-xl" onClick={stopRecording}>
                      <Square className="mr-2 h-4 w-4" />Stop recording
                    </Button>
                  )}
                  {audioReady && (
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" className="flex-1" onClick={() => { recorder.reset(); setAudioReady(false); }}>
                        Re-record
                      </Button>
                      <Button type="button" variant="gradient" className="flex-1" disabled={busy} onClick={submitVoice}>
                        Submit answer <Send className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  {busy && <p className="text-center text-xs text-muted-foreground" aria-live="polite">{busyMessage}</p>}
                  {busy && phase === 'approach' && !approachFollowup && (
                    <ol className="grid gap-1 text-center text-xs text-muted-foreground sm:grid-cols-2" aria-label="Approach processing steps">
                      <li>Transcribing…</li>
                      <li>Reviewing your approach…</li>
                    </ol>
                  )}
                  {errorMessage && (
                    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive" role="alert">
                      <p>{errorMessage}</p>
                      <Button type="button" size="sm" variant="outline" className="mt-2" onClick={() => void retryAction.current?.()}>
                        Retry submission
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Card>

            <div className="hidden gap-2 lg:flex" role="tablist" aria-label="Problem and transcript">
              <Button size="sm" variant={activeTab === 'problem' ? 'default' : 'outline'} role="tab" aria-selected={activeTab === 'problem'} onClick={() => setActiveTab('problem')}>Problem</Button>
              <Button size="sm" variant={activeTab === 'transcript' ? 'default' : 'outline'} role="tab" aria-selected={activeTab === 'transcript'} onClick={() => setActiveTab('transcript')}>Transcript ({turns.length})</Button>
            </div>
            <div className={cn('space-y-4', mobileTab !== 'problem' && 'hidden lg:block', activeTab !== 'problem' && 'lg:hidden')}>
              <Card className="space-y-4 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h1 className="text-xl font-bold text-foreground">{problem.title}</h1>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{problem.topic}</Badge>
                    <Badge variant="secondary" className="capitalize">{problem.difficulty}</Badge>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{problem.statement}</p>
                <div>
                  <h2 className="mb-2 text-sm font-bold text-foreground">Constraints</h2>
                  <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                    {problem.constraints.map((constraint) => <li key={constraint}>{constraint}</li>)}
                  </ul>
                </div>
                <div className="space-y-2">
                  <h2 className="text-sm font-bold text-foreground">Examples</h2>
                  {problem.examples.map((example, index) => (
                    <div key={`${example.input}-${index}`} className="rounded-xl bg-muted/40 p-3 font-mono text-xs">
                      <p><span className="font-bold text-foreground">Input:</span> {example.input}</p>
                      <p className="mt-1"><span className="font-bold text-foreground">Output:</span> {example.output}</p>
                      {example.explanation && <p className="mt-1 font-sans text-muted-foreground">{example.explanation}</p>}
                    </div>
                  ))}
                </div>
                <details open className="rounded-xl border border-border p-3">
                  <summary className="cursor-pointer text-sm font-semibold text-foreground">Hints ({hintCount}/3 revealed)</summary>
                  <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-muted-foreground">
                    {problem.hints.slice(0, hintCount).map((hint, index) => <li key={hint}>{hint}</li>)}
                  </ol>
                  <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => setHintCount((count) => Math.min(problem.hints.length, 3, count + 1))} disabled={hintCount >= Math.min(problem.hints.length, 3)}>
                    Reveal next hint
                  </Button>
                </details>
              </Card>
            </div>
            <div className={cn('space-y-3', mobileTab !== 'problem' && 'hidden lg:block', activeTab !== 'transcript' && 'lg:hidden')}>
              {turns.length === 0 ? <p className="text-sm text-muted-foreground">No conversation yet.</p> : turns.map((turn) => (
                <Card key={turn.id} className="p-3">
                  <p className="text-[11px] font-bold uppercase text-muted-foreground">{turn.role === 'interviewer' ? 'Interviewer' : 'You'} · {turn.timestamp}</p>
                  <p className="mt-1 text-sm text-foreground">{turn.text}</p>
                </Card>
              ))}
            </div>
          </section>

          <section className={cn('space-y-4 lg:col-span-7', mobileTab !== 'code' && 'hidden lg:block')}>
            {editorPane}
            {phase === 'review' && review && (
              <CodeReviewCard review={review} onIssueSelect={(line) => setHighlightLine(line)} />
            )}
            {phase === 'done' && (
              <div className="space-y-3 rounded-2xl border border-border bg-card p-6 text-center">
                <VoiceOrb state="thinking" size={80} />
                <h2 className="text-lg font-bold text-foreground">Wrapping up… generating your report</h2>
              </div>
            )}
            {errorMessage && phase === 'code' && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive" role="alert">
                {errorMessage}
                <Button type="button" size="sm" variant="outline" className="ml-3" onClick={() => void retryAction.current?.()}>Retry</Button>
              </div>
            )}
          </section>
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-border bg-card/95 p-2 backdrop-blur lg:hidden" aria-label="Coding interview panels">
        {(['problem', 'interviewer', 'code'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            aria-pressed={mobileTab === tab}
            onClick={() => setMobileTab(tab)}
            className={cn('rounded-xl px-2 py-2 text-sm font-semibold capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', mobileTab === tab ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')}
          >
            {tab}
          </button>
        ))}
      </nav>
    </div>
  );
}
