import { LandingNavbar } from '@/components/landing/navbar';
import { LandingHero } from '@/components/landing/hero';
import { LandingStats } from '@/components/landing/stats';
import { LandingHowItWorks } from '@/components/landing/how-it-works';
import { LandingFeatures } from '@/components/landing/features';
import { LandingAdaptiveDemo } from '@/components/landing/adaptive-demo';
import { LandingScoringPreview } from '@/components/landing/scoring-preview';
import { LandingLanguages } from '@/components/landing/languages';
import { LandingFaq } from '@/components/landing/faq';
import { LandingFooter } from '@/components/landing/footer';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <LandingNavbar />
      <main className="flex-1">
        <LandingHero />
        <LandingStats />
        <LandingHowItWorks />
        <LandingFeatures />
        <LandingAdaptiveDemo />
        <LandingScoringPreview />
        <LandingLanguages />
        <LandingFaq />
      </main>
      <LandingFooter />
    </div>
  );
}
