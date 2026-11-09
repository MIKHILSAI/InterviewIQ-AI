import { cn } from '@/lib/utils';

export type VoiceOrbState = 'idle' | 'speaking' | 'listening' | 'thinking';

export function VoiceOrb({
  state = 'idle',
  size = 140,
  className,
}: {
  state?: VoiceOrbState;
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={cn('relative flex items-center justify-center select-none', className)}
      style={{ width: size, height: size }}
      aria-label={`Voice orb state: ${state}`}
    >
      {/* Outer ambient glow */}
      <div
        className={cn(
          'absolute inset-0 rounded-full blur-2xl transition-all duration-700 pointer-events-none motion-reduce:transition-none',
          state === 'speaking' && 'bg-indigo-500/35 scale-125 animate-pulse motion-reduce:animate-none',
          state === 'listening' && 'bg-teal-500/40 scale-120 animate-pulse motion-reduce:animate-none',
          state === 'thinking' && 'bg-purple-500/35 scale-110',
          state === 'idle' && 'bg-indigo-500/20 scale-100 opacity-60'
        )}
      />

      {/* State-specific animated rings */}
      {state === 'speaking' && (
        <>
          <div
            className="absolute rounded-full border border-indigo-500/40 animate-pulse-ring motion-reduce:animate-none"
            style={{ width: size * 1.35, height: size * 1.35 }}
          />
          <div
            className="absolute rounded-full border border-violet-500/30 animate-pulse-ring motion-reduce:animate-none"
            style={{ width: size * 1.6, height: size * 1.6, animationDelay: '0.6s' }}
          />
        </>
      )}

      {state === 'listening' && (
        <>
          <div
            className="absolute rounded-full border-2 border-teal-400/50 animate-ripple motion-reduce:animate-none"
            style={{ width: size * 1.25, height: size * 1.25 }}
          />
          <div
            className="absolute rounded-full border border-teal-300/30 animate-ripple motion-reduce:animate-none"
            style={{ width: size * 1.5, height: size * 1.5, animationDelay: '0.4s' }}
          />
        </>
      )}

      {/* Main Orb Body with layered gradient */}
      <div
        className={cn(
          'relative rounded-full shadow-2xl transition-all duration-500 overflow-hidden flex items-center justify-center motion-reduce:transition-none',
          state === 'thinking' && 'animate-spin-slow motion-reduce:animate-none shadow-purple-500/30',
          state === 'speaking' && 'scale-105 shadow-indigo-500/40',
          state === 'listening' && 'scale-105 shadow-teal-500/40',
          state === 'idle' && 'shadow-indigo-500/20'
        )}
        style={{
          width: size * 0.72,
          height: size * 0.72,
          background:
            state === 'listening'
              ? 'radial-gradient(circle at 35% 35%, #2DD4BF 0%, #0F766E 60%, #115E59 100%)'
              : state === 'thinking'
              ? 'radial-gradient(circle at 35% 35%, #C084FC 0%, #7E22CE 60%, #3B0764 100%)'
              : 'radial-gradient(circle at 35% 35%, #818CF8 0%, #4F46E5 45%, #312E81 90%, #1E1B4B 100%)',
        }}
      >
        {/* Specular highlight */}
        <div
          className="absolute top-2 left-3 rounded-full bg-white/40 blur-xs"
          style={{ width: size * 0.28, height: size * 0.16, transform: 'rotate(-25deg)' }}
        />

        {/* Inner dynamic core */}
        <div
          className={cn(
            'rounded-full bg-white/10 blur-xs transition-transform duration-300',
            state === 'speaking' && 'scale-125 bg-white/25',
            state === 'listening' && 'scale-115 bg-teal-200/20'
          )}
          style={{ width: size * 0.35, height: size * 0.35 }}
        />
      </div>
    </div>
  );
}
