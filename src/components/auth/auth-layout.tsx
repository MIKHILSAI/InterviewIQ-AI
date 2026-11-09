import { Outlet, Link } from 'react-router-dom';
import { AuthBrandPanel } from './auth-brand-panel';
import { ArrowLeft } from 'lucide-react';
import { ThemeToggle } from '@/components/app-shell/theme-toggle';

export function AuthLayout() {
  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 bg-background">
      {/* Left Brand Panel (desktop only) */}
      <AuthBrandPanel />

      {/* Right Column: Centered Form */}
      <div className="relative flex min-h-screen flex-col justify-between p-6 sm:p-10 lg:p-12">
        {/* Top bar with back to home & theme toggle */}
        <div className="flex items-center justify-between w-full max-w-md mx-auto">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to home</span>
          </Link>
          <ThemeToggle />
        </div>

        {/* Centered form container */}
        <div className="w-full max-w-md mx-auto my-auto py-8">
          <Outlet />
        </div>

        {/* Bottom subtle copyright */}
        <div className="w-full max-w-md mx-auto text-center text-xs text-muted-foreground">
          Protected by InterviewIQ AI Secure Authentication
        </div>
      </div>
    </div>
  );
}
