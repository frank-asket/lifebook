'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';

import {
    ArrowRight,
    ArrowLeft,
    Check,
    Languages,
    Compass,
    ShieldCheck,
} from 'lucide-react';

import { Brand } from '../../components/shell';

import {
    api,
    FaithProfile,
    ProfileResponse,
    GOALS,
    FORMATS,
} from '../../lib/api';

// ============================================================
// FAITH JOURNEY OPTIONS
// Values must match the NestJS / Prisma FaithJourney enum.
// ============================================================

const JOURNEYS = [
    {
        value: 'EXPLORING',
        label: 'Exploring Christianity',
        description:
            'Discover Christianity and explore the Christian faith.',
    },
    {
        value: 'NEW_BELIEVER',
        label: 'New Believer',
        description:
            'Build a strong foundation in your new faith.',
    },
    {
        value: 'GROWING_BELIEVER',
        label: 'Growing Believer',
        description:
            'Deepen your understanding of Scripture and prayer.',
    },
    {
        value: 'DISCIPLESHIP',
        label: 'Structured Discipleship',
        description:
            'Follow a guided pathway for spiritual learning.',
    },
    {
        value: 'MINISTRY_PREPARATION',
        label: 'Ministry Preparation',
        description:
            'Explore biblical teaching and preparation for service.',
    },
    {
        value: 'SERVING_IN_MINISTRY',
        label: 'Serving in Ministry',
        description:
            'Continue learning while actively serving others.',
    },
] as const;

type JourneyValue = (typeof JOURNEYS)[number]['value'];

const VALID_JOURNEYS = new Set<string>(
    JOURNEYS.map((journey) => journey.value)
);

// ============================================================
// NORMALIZE LEGACY JOURNEY VALUES
// ============================================================

function normalizeJourney(
    journey?: string | null
): JourneyValue | undefined {
    if (!journey) return undefined;

    const legacyValues: Record<string, JourneyValue> = {
        EXPLORING_CHRISTIANITY: 'EXPLORING',
        STRUCTURED_DISCIPLESHIP: 'DISCIPLESHIP',
        SERVING: 'SERVING_IN_MINISTRY',
    };

    const normalized = legacyValues[journey] ?? journey;

    if (!VALID_JOURNEYS.has(normalized)) {
        return undefined;
    }

    return normalized as JourneyValue;
}

// ============================================================
// ONBOARDING STEPS
// ============================================================

const steps = [
    'Language',
    'Your journey',
    'Your goals',
    'Preferences & privacy',
];

const headings = [
    'What language feels most comfortable?',
    'Where would you like to begin?',
    'What would you like to explore?',
    'Make this space your own.',
];

const descriptions = [
    'Choose your preferred reading language.',
    'This is your own description of your journey—not a judgment or ranking.',
    'Choose as many as you like. You can change these later.',
    'Choose your preferred format and how your information may be used.',
];

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function Onboarding() {
    const router = useRouter();
    const { getToken } = useAuth();

    const [step, setStep] = useState(0);

    const [form, setForm] = useState<FaithProfile>({
        language: 'en',
        learningGoals: [],
        preferredFormats: [],
        personalizationConsent: false,
        aiProcessingConsent: false,
    });

    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // ==========================================================
    // LOAD EXISTING PROFILE
    // ==========================================================

    useEffect(() => {
        let mounted = true;

        async function loadProfile() {
            try {
                const token = await getToken();

                if (!token) {
                    throw new Error('Authentication required.');
                }

                const response = await api<ProfileResponse>(
                    '/me/profile',
                    token
                );

                if (mounted && response.profile) {
                    const profile = response.profile;

                    setForm((current) => ({
                        ...current,
                        ...profile,

                        journey: normalizeJourney(profile.journey),

                        learningGoals: profile.learningGoals ?? [],

                        preferredFormats: profile.preferredFormats ?? [],

                        personalizationConsent:
                            profile.personalizationConsent ?? false,

                        aiProcessingConsent:
                            profile.aiProcessingConsent ?? false,
                    }));
                }
            } catch (err) {
                // New users may not have a profile yet.
                // Authentication failures will also be handled on save.
                console.error('Unable to load onboarding profile:', err);
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        }

        loadProfile();

        return () => {
            mounted = false;
        };
    }, [getToken]);

    // ==========================================================
    // UPDATE FORM
    // ==========================================================

    function updateForm<K extends keyof FaithProfile>(
        key: K,
        value: FaithProfile[K]
    ) {
        setForm((current) => ({
            ...current,
            [key]: value,
        }));

        setError('');
    }

    // ==========================================================
    // TOGGLE MULTISELECT OPTIONS
    // ==========================================================

    function toggle(
        key: 'learningGoals' | 'preferredFormats',
        value: string
    ) {
        setForm((current) => {
            const existing = current[key] ?? [];

            const updated = existing.includes(value)
                ? existing.filter((item) => item !== value)
                : [...existing, value];

            return {
                ...current,
                [key]: updated,
            };
        });

        setError('');
    }

    // ==========================================================
    // SAVE ONBOARDING PROFILE
    // ==========================================================

    async function save() {
        if (saving || loading) return;

        setSaving(true);
        setError('');

        try {
            const token = await getToken();

            if (!token) {
                throw new Error(
                    'Your session has expired. Please sign in again.'
                );
            }

            const normalizedJourney = normalizeJourney(form.journey);

            const payload: FaithProfile = {
                language: form.language || 'en',

                learningGoals: form.learningGoals ?? [],

                preferredFormats: form.preferredFormats ?? [],

                personalizationConsent:
                    form.personalizationConsent ?? false,

                aiProcessingConsent:
                    form.aiProcessingConsent ?? false,

                ...(normalizedJourney
                    ? { journey: normalizedJourney }
                    : {}),
            };

            await api('/me/profile', token, {
                method: 'PUT',
                body: JSON.stringify(payload),
            });

            router.push('/dashboard');
            router.refresh();
        } catch (err) {
            console.error('Onboarding save failed:', err);

            setError(
                err instanceof Error
                    ? err.message
                    : 'Unable to save your preferences. Please try again.'
            );
        } finally {
            setSaving(false);
        }
    }

    // ==========================================================
    // NAVIGATION
    // ==========================================================

    function nextStep() {
        if (step < steps.length - 1) {
            setStep((current) => current + 1);
            setError('');
        }
    }

    function previousStep() {
        if (step > 0) {
            setStep((current) => current - 1);
            setError('');
        }
    }

    // ==========================================================
    // RENDER
    // ==========================================================

    return (
        <>
            <div
                style={{
                    maxWidth: 840,
                    margin: '25px auto 0',
                    padding: '0 20px',
                }}
            >
                <Brand />
            </div>

            <div className="onboard-wrap">
                <div className="onboard-card">
                    {/* STEP HEADER */}

                    <span className="eyebrow">
                        MAKE LIFEBOOK YOURS · STEP {step + 1} OF{' '}
                        {steps.length}
                    </span>

                    {/* PROGRESS INDICATOR */}

                    <div
                        className="stepper"
                        style={{ marginTop: 16 }}
                    >
                        {steps.map((item, index) => (
                            <span
                                key={item}
                                className={index <= step ? 'done' : ''}
                            />
                        ))}
                    </div>

                    {/* HEADING */}

                    <h1 className="page-heading">
                        {headings[step]}
                    </h1>

                    <p className="subheading">
                        {descriptions[step]}
                    </p>

                    <div style={{ margin: '28px 0 32px' }}>
                        {/* ============================================= */}
                        {/* STEP 1 — LANGUAGE */}
                        {/* ============================================= */}

                        {step === 0 && (
                            <div className="choice-grid">
                                {[
                                    {
                                        value: 'en',
                                        title: 'English',
                                        description: 'Continue in English',
                                    },
                                    {
                                        value: 'fr',
                                        title: 'Français',
                                        description: 'Continuer en français',
                                    },
                                ].map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        className={
                                            'choice ' +
                                            (form.language === option.value
                                                ? 'selected'
                                                : '')
                                        }
                                        onClick={() =>
                                            updateForm('language', option.value)
                                        }
                                    >
                                        <Languages
                                            size={22}
                                            color="#805cc5"
                                        />

                                        <span>
                                            <strong>{option.title}</strong>
                                            <small>{option.description}</small>
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* ============================================= */}
                        {/* STEP 2 — FAITH JOURNEY */}
                        {/* ============================================= */}

                        {step === 1 && (
                            <div className="choice-grid">
                                {JOURNEYS.map((journey) => (
                                    <button
                                        key={journey.value}
                                        type="button"
                                        className={
                                            'choice ' +
                                            (form.journey === journey.value
                                                ? 'selected'
                                                : '')
                                        }
                                        onClick={() =>
                                            updateForm(
                                                'journey',
                                                journey.value as FaithProfile['journey']
                                            )
                                        }
                                    >
                                        <Compass
                                            size={20}
                                            color="#805cc5"
                                        />

                                        <span>
                                            <strong>{journey.label}</strong>
                                            <small>
                                                {journey.description}
                                            </small>
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* ============================================= */}
                        {/* STEP 3 — LEARNING GOALS */}
                        {/* ============================================= */}

                        {step === 2 && (
                            <div className="tag-list">
                                {GOALS.map((goal) => (
                                    <button
                                        key={goal}
                                        type="button"
                                        className={
                                            'tag ' +
                                            (form.learningGoals?.includes(goal)
                                                ? 'active'
                                                : '')
                                        }
                                        onClick={() =>
                                            toggle('learningGoals', goal)
                                        }
                                    >
                                        {form.learningGoals?.includes(goal)
                                            ? '✓ '
                                            : ''}

                                        {goal}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* ============================================= */}
                        {/* STEP 4 — PREFERENCES & PRIVACY */}
                        {/* ============================================= */}

                        {step === 3 && (
                            <>
                                <div className="form-field">
                                    <label>
                                        How do you prefer to learn?
                                    </label>

                                    <div className="tag-list">
                                        {FORMATS.map((format) => (
                                            <button
                                                key={format}
                                                type="button"
                                                className={
                                                    'tag ' +
                                                    (form.preferredFormats?.includes(format)
                                                        ? 'active'
                                                        : '')
                                                }
                                                onClick={() =>
                                                    toggle('preferredFormats', format)
                                                }
                                            >
                                                {form.preferredFormats?.includes(format)
                                                    ? '✓ '
                                                    : ''}

                                                {format}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="divider" />

                                <div
                                    className="grid"
                                    style={{ gap: 18 }}
                                >
                                    {/* PERSONALIZATION CONSENT */}

                                    <label className="check-row">
                                        <input
                                            type="checkbox"
                                            checked={
                                                !!form.personalizationConsent
                                            }
                                            onChange={(event) =>
                                                updateForm(
                                                    'personalizationConsent',
                                                    event.target.checked
                                                )
                                            }
                                        />

                                        <span>
                                            <strong
                                                style={{
                                                    display: 'block',
                                                    color: '#383045',
                                                }}
                                            >
                                                Personalize my recommendations
                                            </strong>

                                            Use my selected journey, goals and
                                            preferences to suggest relevant
                                            LifeBook content.
                                        </span>
                                    </label>

                                    {/* AI CONSENT */}

                                    <label className="check-row">
                                        <input
                                            type="checkbox"
                                            checked={
                                                !!form.aiProcessingConsent
                                            }
                                            onChange={(event) =>
                                                updateForm(
                                                    'aiProcessingConsent',
                                                    event.target.checked
                                                )
                                            }
                                        />

                                        <span>
                                            <strong
                                                style={{
                                                    display: 'block',
                                                    color: '#383045',
                                                }}
                                            >
                                                Allow optional AI processing
                                            </strong>

                                            Allow AI features only when I choose
                                            to use them. Prayer entries require
                                            their own clear, contextual consent
                                            before processing.
                                        </span>
                                    </label>
                                </div>

                                {/* PRIVACY NOTICE */}

                                <div
                                    className="notice"
                                    style={{ marginTop: 22 }}
                                >
                                    <ShieldCheck
                                        size={15}
                                        style={{
                                            verticalAlign: 'middle',
                                            marginRight: 7,
                                        }}
                                    />

                                    You can change these choices later.
                                    Your spiritual journey is private and
                                    never automatically scored.
                                </div>
                            </>
                        )}
                    </div>

                    {/* ============================================= */}
                    {/* ERROR MESSAGE */}
                    {/* ============================================= */}

                    {error && (
                        <p className="alert" role="alert">
                            {error}
                        </p>
                    )}

                    {/* ============================================= */}
                    {/* NAVIGATION BUTTONS */}
                    {/* ============================================= */}

                    <div className="split-title">
                        <button
                            type="button"
                            className="btn btn-outline"
                            disabled={
                                step === 0 || saving || loading
                            }
                            onClick={previousStep}
                        >
                            <ArrowLeft size={16} />
                            Back
                        </button>

                        <div className="icon-line">
                            <button
                                type="button"
                                className="btn btn-soft"
                                disabled={saving || loading}
                                onClick={save}
                            >
                                Skip & save
                            </button>

                            {step < steps.length - 1 ? (
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    disabled={saving || loading}
                                    onClick={nextStep}
                                >
                                    Continue
                                    <ArrowRight size={16} />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    disabled={saving || loading}
                                    onClick={save}
                                >
                                    {saving ? 'Saving…' : 'Finish'}
                                    <Check size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* FOOTER */}

                <p
                    className="footer-note"
                    style={{ textAlign: 'center' }}
                >
                    LifeBook supports your choices; it does not
                    determine your spiritual maturity.
                </p>
            </div>
        </>
    );
}