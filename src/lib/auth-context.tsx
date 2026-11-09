import {
  ClerkLoading,
  ClerkLoaded,
  useAuth as useClerkAuth,
  useUser as useClerkUser,
} from '@clerk/react';
import type { ReactNode } from 'react';

export { ClerkLoading, ClerkLoaded };

export function useAuth() {
  const { isLoaded, isSignedIn, getToken, signOut } = useClerkAuth();
  return { isLoaded, isSignedIn: Boolean(isSignedIn), getToken, signOut };
}

export function useUser() {
  const { isLoaded, isSignedIn, user } = useClerkUser();
  return { isLoaded, isSignedIn: Boolean(isSignedIn), user };
}

export function SignedIn({ children }: { children: ReactNode }) {
  const { isSignedIn } = useAuth();
  return isSignedIn ? <>{children}</> : null;
}

export function SignedOut({ children }: { children: ReactNode }) {
  const { isSignedIn } = useAuth();
  return isSignedIn ? null : <>{children}</>;
}
