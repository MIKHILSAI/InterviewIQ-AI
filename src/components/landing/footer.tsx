import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/shared/logo';
import { ArrowRight, Sparkles } from 'lucide-react';

export function LandingFooter() {
  return (
    <footer>
      {/* Final CTA band with signature gradient */}
      <div className="relative overflow-hidden bg-brand-gradient py-16 px-6 text-white text-center shadow-inner">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent pointer-events-none" />
        <div className="mx-auto max-w-4xl relative z-10 space-y-5">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Ready for your upcoming placement drive?</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Level up your interview communication today.
          </h2>
          <p className="text-white/85 text-base max-w-xl mx-auto leading-relaxed">
            Practice realistic voice rounds, overcome hesitations, and walk into your actual interview with proven confidence.
          </p>
          <div className="pt-2">
            <Button
              asChild
              size="lg"
              className="bg-white !text-primary hover:bg-white/95 font-bold px-8 h-12 shadow-xl rounded-xl"
            >
              <Link to="/setup">
                <span>Start Practicing Now</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Footer Links & Copyright */}
      <div className="border-t border-border bg-card/60 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Logo size="md" />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#languages" className="hover:text-foreground transition-colors">Languages</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
            <Link to="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
          </div>

          <p className="text-xs text-muted-foreground">
            &copy; 2026 InterviewIQ AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
