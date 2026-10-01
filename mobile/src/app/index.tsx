import { Redirect } from 'expo-router';

import { useStore } from '@/lib/store';

export default function Entry() {
  const { state } = useStore();
  return <Redirect href={state.profile.onboardingCompletedAt ? '/(tabs)' : '/onboarding'} />;
}
