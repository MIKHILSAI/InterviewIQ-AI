import { SignUp } from '@clerk/react';

export function SignUpCard() {
  return (
    <SignUp
      path="/sign-up"
      routing="path"
      signInUrl="/sign-in"
      forceRedirectUrl="/onboarding/resume"
    />
  );
}
