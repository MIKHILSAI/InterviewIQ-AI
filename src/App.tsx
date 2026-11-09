import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/lib/theme-context';
import { Toaster } from '@/components/ui/sonner';

import { LandingPage } from '@/pages/landing-page';
import { AuthLayout } from '@/components/auth/auth-layout';
import { SignInPage } from '@/pages/sign-in-page';
import { SignUpPage } from '@/pages/sign-up-page';

import { AppLayout } from '@/components/app-shell/app-layout';
import { DashboardPage } from '@/pages/dashboard-page';
import { SetupPage } from '@/pages/setup-page';
import { ResultsPage } from '@/pages/results-page';
import { HistoryPage } from '@/pages/history-page';
import { ResumeOnboardingPage } from '@/pages/resume-onboarding-page';
import { AchievementsPage } from '@/pages/achievements-page';

import { SessionPage } from '@/pages/session-page';
import { NotFoundPage } from '@/pages/not-found-page';

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <BrowserRouter>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Authentication Flow */}
          <Route element={<AuthLayout />}>
            <Route path="/sign-in/*" element={<SignInPage />} />
            <Route path="/sign-in" element={<SignInPage />} />
            <Route path="/sign-up/*" element={<SignUpPage />} />
            <Route path="/sign-up" element={<SignUpPage />} />
          </Route>

          {/* Authenticated App Shell (Sidebar + Topbar) */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/onboarding/resume" element={<ResumeOnboardingPage />} />
            <Route path="/setup" element={<SetupPage />} />
            <Route path="/results/:sessionId" element={<ResultsPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/achievements" element={<AchievementsPage />} />
          </Route>

          {/* Immersive Voice Interview Room (No Sidebar) */}
          <Route path="/session/:sessionId" element={<SessionPage />} />

          {/* 404 & Fallback */}
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster richColors position="top-right" />
    </ThemeProvider>
  );
}
