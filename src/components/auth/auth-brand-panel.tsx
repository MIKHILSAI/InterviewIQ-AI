import { Logo } from '@/components/shared/logo';
import { VoiceOrb } from '@/components/shared/voice-orb';
import { Check, Quote } from 'lucide-react';

export function AuthBrandPanel() {
  return (
    <div className="relative hidden lg:flex h-full w-full flex-col justify-between overflow-hidden bg-brand-gradient p-12 text-white">
      {/* Background glow effects */}
      <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-white/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-indigo-900/30 blur-3xl pointer-events-none" />

      {/* Top Logo */}
      <div className="relative z-10">
        <Logo size="lg" variant="light" />
      </div>

      {/* Middle: VoiceOrb & Headline & Benefits */}
      <div className="relative z-10 my-auto space-y-8 max-w-lg">
        <div className="flex justify-center py-4">
          <VoiceOrb state="speaking" size={170} />
        </div>

        <div className="space-y-4">
          <h2 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
            Your next interview starts here.
          </h2>
          <p className="text-white/85 text-base leading-relaxed">
            Practice realistic AI mock interviews with conversational voice follow-ups and comprehensive rubric evaluations.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-white shrink-0">
              <Check className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium text-white/95">
              Voice-based mock interviews
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-white shrink-0">
              <Check className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium text-white/95">
              Instant rubric feedback
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-white shrink-0">
              <Check className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium text-white/95">
              Tamil &amp; English support
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Quote Card */}
      <div className="relative z-10 mt-8 rounded-2xl bg-white/10 p-5 backdrop-blur-md border border-white/20">
        <Quote className="h-5 w-5 text-white/60 mb-2" />
        <p className="text-sm italic text-white/90 leading-relaxed">
          "The adaptive follow-ups felt shockingly like an actual technical round. I went from stumbling on OS concepts to cracking my placement interview."
        </p>
        <div className="mt-3 flex items-center justify-between text-xs text-white/75">
          <span className="font-semibold text-white">Aditya K.</span>
          <span>B.Tech Final Year • Placed at Tier-1 Tech</span>
        </div>
      </div>
    </div>
  );
}
