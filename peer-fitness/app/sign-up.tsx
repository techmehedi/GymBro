import { SignUp } from '@clerk/clerk-expo';
import { Stack } from 'expo-router';

export default function SignUpScreen() {
  return (
    <SignUp
      appearance={{
        elements: {
          formButtonPrimary: 'bg-primary-600 hover:bg-primary-700',
          card: 'shadow-lg',
        },
      }}
    />
  );
}
