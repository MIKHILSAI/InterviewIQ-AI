import {createRoot} from 'react-dom/client';
import { ClerkProvider } from '@clerk/react';
import { AppErrorBoundary } from '@/components/shared/app-error-boundary';
import App from './App.tsx';
import './index.css';

const root = createRoot(document.getElementById('root')!);
const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPublishableKey) {
  root.render(
    <AppErrorBoundary>
      <main className="min-h-screen flex items-center justify-center bg-background p-6 text-foreground">
        <p>
          Clerk is not configured. Set <code>VITE_CLERK_PUBLISHABLE_KEY</code> in the root
          <code> .env.local</code> file and restart the frontend.
        </p>
      </main>
    </AppErrorBoundary>,
  );
} else {
  root.render(
    <AppErrorBoundary>
      <ClerkProvider publishableKey={clerkPublishableKey}>
        <App />
      </ClerkProvider>
    </AppErrorBoundary>,
  );
}
