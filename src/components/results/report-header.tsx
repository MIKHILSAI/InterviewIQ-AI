import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { InterviewReport } from '@/lib/types';
import { ConfigBadges } from '@/components/shared/config-badges';
import { Button } from '@/components/ui/button';
import { formatDate, formatDuration } from '@/lib/utils';
import { Download, Volume2, Square, RotateCcw, LayoutDashboard, Calendar, Clock } from 'lucide-react';

export function ReportHeader({ report }: { report: InterviewReport }) {
  const navigate = useNavigate();
  const [isPlayingSummary, setIsPlayingSummary] = useState(false);

  const handleToggleSummaryAudio = () => {
    if (isPlayingSummary) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setIsPlayingSummary(false);
      return;
    }

    if (report.summaryAudioUrl) {
      const audio = new Audio(report.summaryAudioUrl);
      audio.onended = () => setIsPlayingSummary(false);
      audio.play().catch(() => {});
      setIsPlayingSummary(true);
    } else if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(report.summaryFeedback);
      utterance.onend = () => setIsPlayingSummary(false);
      utterance.onerror = () => setIsPlayingSummary(false);
      window.speechSynthesis.speak(utterance);
      setIsPlayingSummary(true);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleRetake = () => {
    const { type, domain, difficulty, durationMin, language } = report.config;
    navigate(
      `/setup?type=${type}&domain=${encodeURIComponent(domain)}&difficulty=${difficulty}&duration=${durationMin}&language=${language}`
    );
  };

  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between border-b border-border/80 pb-6 mb-8">
      {/* Left: Info */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Interview Performance Report
        </h1>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <ConfigBadges config={report.config} />
          <span className="flex items-center gap-1 font-medium">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formatDate(report.completedAt)}</span>
          </span>
          <span className="flex items-center gap-1 font-mono font-medium">
            <Clock className="h-3.5 w-3.5" />
            <span>{formatDuration(report.durationSec)}</span>
          </span>
        </div>
      </div>

      {/* Right: Actions (no-print) */}
      <div className="flex flex-wrap items-center gap-2.5 no-print shrink-0">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleToggleSummaryAudio}
          className="rounded-xl text-xs gap-1.5 h-9 cursor-pointer"
        >
          {isPlayingSummary ? (
            <>
              <Square className="h-3.5 w-3.5 text-rose-500 fill-rose-500" />
              <span>Stop audio</span>
            </>
          ) : (
            <>
              <Volume2 className="h-3.5 w-3.5 text-primary" />
              <span>Listen to summary</span>
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handlePrint}
          className="rounded-xl text-xs gap-1.5 h-9 cursor-pointer"
        >
          <Download className="h-3.5 w-3.5 text-foreground" />
          <span>Download PDF</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleRetake}
          className="rounded-xl text-xs gap-1.5 h-9 cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5 text-foreground" />
          <span>Retake</span>
        </Button>

        <Button
          type="button"
          variant="gradient"
          size="sm"
          onClick={() => navigate('/dashboard')}
          className="rounded-xl text-xs gap-1.5 h-9 font-semibold cursor-pointer"
        >
          <LayoutDashboard className="h-3.5 w-3.5" />
          <span>Dashboard</span>
        </Button>
      </div>
    </div>
  );
}
