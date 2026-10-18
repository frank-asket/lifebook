import type { FaithProfile, ProfileResponse } from './api';

// ============================================================
// ONBOARDING STEPS
// Settings and other pages link to one step with /onboarding?step=goals.
// ============================================================

export const ONBOARDING_STEPS = ['language', 'journey', 'goals', 'privacy'] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export function onboardingStepIndex(value: string | null | undefined): number {
    const index = ONBOARDING_STEPS.indexOf(value as OnboardingStep);
    return index < 0 ? 0 : index;
}

// ============================================================
// PROFILE LOADING
// A new member's profile is null, which is not an error. Any thrown
// error is a real failure, and saving the form's defaults after one
// would overwrite the member's stored choices.
// ============================================================

export type ProfileLoad =
    | { status: 'loading' }
    | { status: 'ready'; profile: FaithProfile | null }
    | { status: 'failed'; error: unknown };

export async function loadOnboardingProfile(
    read: () => Promise<ProfileResponse>
): Promise<ProfileLoad> {
    try {
        const response = await read();
        return { status: 'ready', profile: response.profile ?? null };
    } catch (error) {
        return { status: 'failed', error };
    }
}

export function canSaveOnboarding(load: ProfileLoad, saving: boolean): boolean {
    return load.status === 'ready' && !saving;
}
