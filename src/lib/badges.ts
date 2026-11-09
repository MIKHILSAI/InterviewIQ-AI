import {
  Award,
  Code2,
  Languages,
  Medal,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Trophy,
  TrendingUp,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { BadgeId } from './types';

export type BadgeTone = 'primary' | 'accent' | 'success' | 'warning';

export const badgePresentation: Record<
  BadgeId,
  { icon: LucideIcon; tone: BadgeTone }
> = {
  first_interview: { icon: Star, tone: 'primary' },
  five_interviews: { icon: Medal, tone: 'accent' },
  ten_interviews: { icon: Trophy, tone: 'warning' },
  streak_3: { icon: Zap, tone: 'success' },
  streak_7: { icon: ShieldCheck, tone: 'primary' },
  streak_30: { icon: Award, tone: 'warning' },
  score_80: { icon: Target, tone: 'success' },
  score_90: { icon: Trophy, tone: 'accent' },
  all_rounder: { icon: Sparkles, tone: 'primary' },
  multilingual: { icon: Languages, tone: 'accent' },
  comeback: { icon: RotateCcw, tone: 'warning' },
  goal_getter: { icon: TrendingUp, tone: 'success' },
  code_and_talk: { icon: Code2, tone: 'accent' },
};

export const badgeToneClasses: Record<
  BadgeTone,
  { icon: string; accent: string }
> = {
  primary: { icon: 'bg-primary/10 text-primary', accent: 'text-primary' },
  accent: { icon: 'bg-accent/10 text-accent', accent: 'text-accent' },
  success: { icon: 'bg-success/10 text-success', accent: 'text-success' },
  warning: { icon: 'bg-warning/10 text-warning', accent: 'text-warning' },
};
