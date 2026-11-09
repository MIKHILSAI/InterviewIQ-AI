import { SignIn } from '@clerk/react';

export function SignInCard() {
  return (
    <SignIn
      path="/sign-in"
      routing="path"
      signUpUrl="/sign-up"
      forceRedirectUrl="/dashboard"
    />
  );
}
