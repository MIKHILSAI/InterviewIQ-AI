export function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(' ');
}

export function formatDuration(sec: number): string {
  if (isNaN(sec) || sec < 0) return '0m 00s';
  const mins = Math.floor(sec / 60);
  const remainingSecs = Math.floor(sec % 60);
  return `${mins}m ${remainingSecs.toString().padStart(2, '0')}s`;
}

export function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 'Recently';
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'Recently';
  }
}

export function scoreTone(score: number): 'success' | 'warning' | 'destructive' {
  if (score >= 75) return 'success';
  if (score >= 50) return 'warning';
  return 'destructive';
}

export function scoreLabel(score: number): 'Excellent' | 'Good' | 'Fair' | 'Needs work' {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Fair';
  return 'Needs work';
}
