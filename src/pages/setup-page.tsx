import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { PageHeader } from '@/components/shared/page-header';
import { Card } from '@/components/ui/card';
import { TypeSelector } from '@/components/setup/type-selector';
import { DomainSelector } from '@/components/setup/domain-selector';
import { DifficultySelector } from '@/components/setup/difficulty-selector';
import { DurationSelector } from '@/components/setup/duration-selector';
import { LanguageSelector } from '@/components/setup/language-selector';
import { CodingLanguageSelector } from '@/components/setup/coding-language-selector';
import { SummaryCard } from '@/components/setup/summary-card';
import { MicCheck } from '@/components/setup/mic-check';
import { startSession } from '@/lib/api';
import {
  InterviewConfig,
  InterviewType,
  Difficulty,
  Language,
  CodingLanguage,
} from '@/lib/types';
import {
  TECHNICAL_DOMAINS,
  HR_DOMAINS,
  CODING_TOPICS,
  SESSION_STORAGE_KEY,
} from '@/lib/constants';
import { toast } from '@/components/ui/sonner';
import { AlertTriangle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SetupPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();

  const [hasMediaRecorder, setHasMediaRecorder] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize config with query parameters or sensible defaults
  const [config, setConfig] = useState<InterviewConfig>(() => {
    const rawType = searchParams.get('type') as InterviewType;
    const type: InterviewType = ['technical', 'hr', 'mixed', 'coding'].includes(rawType)
      ? rawType
      : 'technical';

    const rawDiff = searchParams.get('difficulty') as Difficulty;
    const difficulty: Difficulty = ['beginner', 'intermediate', 'advanced'].includes(rawDiff)
      ? rawDiff
      : 'intermediate';

    const rawDur = parseInt(searchParams.get('duration') || '10', 10);
    const durationMin: 5 | 10 | 15 = [5, 10, 15].includes(rawDur)
      ? (rawDur as 5 | 10 | 15)
      : 10;

    const rawLang = searchParams.get('language') as Language;
    const language: Language = ['en', 'ta', 'hi'].includes(rawLang)
      ? rawLang
      : 'en';

    const rawDomain = searchParams.get('domain') || '';
    const validDomain =
      type === 'coding'
        ? CODING_TOPICS.includes(rawDomain as (typeof CODING_TOPICS)[number])
          ? rawDomain
          : ''
        : type === 'technical'
        ? TECHNICAL_DOMAINS.includes(rawDomain as (typeof TECHNICAL_DOMAINS)[number])
          ? rawDomain
          : ''
        : type === 'hr'
        ? HR_DOMAINS.includes(rawDomain as (typeof HR_DOMAINS)[number])
          ? rawDomain
          : ''
        : TECHNICAL_DOMAINS.includes(rawDomain as (typeof TECHNICAL_DOMAINS)[number])
        ? rawDomain
        : '';

    const rawCodingLanguage = searchParams.get('codingLanguage') || '';
    return {
      type,
      domain: validDomain,
      difficulty,
      durationMin,
      language,
      ...(type === 'coding' ? {
        codingLanguage: (['python', 'javascript', 'java'].includes(rawCodingLanguage)
          ? rawCodingLanguage
          : 'python') as CodingLanguage,
      } : {}),
    };
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && !window.MediaRecorder) {
      setHasMediaRecorder(false);
    }
  }, []);

  const handleTypeChange = (newType: InterviewType) => {
    let newDomain = config.domain;
    if (newType === 'coding' && !CODING_TOPICS.includes(newDomain as (typeof CODING_TOPICS)[number])) {
      newDomain = '';
    } else if (newType === 'technical' && !TECHNICAL_DOMAINS.includes(newDomain as (typeof TECHNICAL_DOMAINS)[number])) {
      newDomain = '';
    } else if (newType === 'hr' && !HR_DOMAINS.includes(newDomain as (typeof HR_DOMAINS)[number])) {
      newDomain = '';
    } else if (newType === 'mixed' && !TECHNICAL_DOMAINS.includes(newDomain as (typeof TECHNICAL_DOMAINS)[number])) {
      newDomain = '';
    }
    setConfig((prev) => ({
      ...prev,
      type: newType,
      domain: newDomain,
      ...(newType === 'coding' ? { codingLanguage: prev.codingLanguage || 'python' } : {}),
    }));
  };

  const isValid = Boolean(config.domain.trim()) && (config.type !== 'coding' || Boolean(config.codingLanguage));

  const handleStart = async () => {
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const token = (await getToken()) ?? undefined;
      const sessionData = await startSession(config, token);

      // Save hand-off payload to sessionStorage
      const handoffData = {
        config: sessionData.config,
        firstQuestion: sessionData.firstQuestion,
        startedAt: sessionData.startedAt,
        problem: sessionData.problem,
      };
      sessionStorage.setItem(
        SESSION_STORAGE_KEY(sessionData.sessionId),
        JSON.stringify(handoffData)
      );

      toast.success('Interview initialized! Entering room...');
      navigate(`/session/${sessionData.sessionId}`);
    } catch {
      toast.error("Couldn't start the interview. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-24 lg:pb-8">
      {/* Page Header */}
      <PageHeader
        title="Set up your interview"
        description="Choose what you want to practice. We'll tailor the questions and follow-ups to you."
      />

      {/* MediaRecorder warning alert if unsupported */}
      {!hasMediaRecorder && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-warning/30 bg-warning/10 text-warning text-xs">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>
            Your browser does not natively support the MediaRecorder audio API. Audio recording may be simulated. We recommend Chrome, Edge, or Brave.
          </span>
        </div>
      )}

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: 5 Form Steps (col-span-8) */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="p-6 space-y-8 border-border">
            {/* Step 1: Type */}
            <TypeSelector
              value={config.type}
              onChange={handleTypeChange}
            />

            <div className="border-t border-border/60" />

            {/* Step 2: Domain */}
            <DomainSelector
              type={config.type}
              value={config.domain}
              onChange={(domain) => setConfig((prev) => ({ ...prev, domain }))}
            />

            <div className="border-t border-border/60" />

            {/* Step 3: Difficulty */}
            <DifficultySelector
              value={config.difficulty}
              onChange={(difficulty) => setConfig((prev) => ({ ...prev, difficulty }))}
            />

            <div className="border-t border-border/60" />

            {/* Step 4: Duration */}
            <DurationSelector
              value={config.durationMin}
              onChange={(durationMin) => setConfig((prev) => ({ ...prev, durationMin }))}
            />

            <div className="border-t border-border/60" />

            {/* Step 5: Language */}
            <LanguageSelector
              value={config.language}
              onChange={(language) => setConfig((prev) => ({ ...prev, language }))}
            />
            {config.type === 'coding' && (
              <>
                <div className="border-t border-border/60" />
                <CodingLanguageSelector
                  value={config.codingLanguage || 'python'}
                  onChange={(codingLanguage) => setConfig((prev) => ({ ...prev, codingLanguage }))}
                />
              </>
            )}
          </Card>
        </div>

        {/* Right Column: Sticky Summary & Mic Check (col-span-4) */}
        <div className="lg:col-span-4 space-y-6">
          <SummaryCard
            config={config}
            isValid={isValid}
            isSubmitting={isSubmitting}
            onSubmit={handleStart}
          />

          <MicCheck />
        </div>
      </div>

      {/* Mobile Sticky Bottom Action Bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur-md border-t border-border p-4 flex items-center justify-between gap-4 shadow-xl">
        <div className="text-xs truncate">
          <div className="font-bold text-foreground">
            {config.domain || (config.type === 'coding' ? 'Pick a topic' : 'Pick a domain')}
          </div>
          <div className="text-muted-foreground capitalize">
            {config.type === 'coding' ? `${config.codingLanguage} • ` : ''}{config.type} • {config.durationMin}m • {config.difficulty}
          </div>
        </div>

        <Button
          onClick={handleStart}
          disabled={!isValid || isSubmitting}
          variant="gradient"
          size="sm"
          className="rounded-xl px-5 h-10 font-bold shrink-0"
        >
          <Sparkles className="h-4 w-4 mr-1.5" />
          <span>Start</span>
        </Button>
      </div>
    </div>
  );
}
