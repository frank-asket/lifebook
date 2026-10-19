'use client';

import { useEffect, useRef, useState } from 'react';
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
import { useLanguage, type Language } from '../../components/language-provider';
import { pageTitle } from '../../lib/page-title';

import {
    api,
    FaithProfile,
    ProfileResponse,
    GOALS,
    FORMATS,
    faithJourneyLabel,
    learningGoalLabel,
    formatLabel,
} from '../../lib/api';
import { errorMessage } from '../../lib/errors';
import {
    ONBOARDING_STEPS,
    onboardingStepIndex,
    loadOnboardingProfile,
    canSaveOnboarding,
    type ProfileLoad,
} from '../../lib/onboarding';

// ============================================================
// FAITH JOURNEY OPTIONS
// Values must match the NestJS / Prisma FaithJourney enum.
// Labels come from faithJourneyLabel so Settings and onboarding agree.
// ============================================================

const JOURNEYS = [
    {
        value: 'EXPLORING',
        description: 'Discover Christianity and explore the Christian faith.',
        descriptionFr: 'Découvrir le christianisme et explorer la foi chrétienne.',
    },
    {
        value: 'NEW_BELIEVER',
        description: 'Build a strong foundation in your new faith.',
        descriptionFr: 'Poser des fondations solides pour votre nouvelle foi.',
    },
    {
        value: 'GROWING_BELIEVER',
        description: 'Deepen your understanding of Scripture and prayer.',
        descriptionFr: 'Approfondir votre compréhension des Écritures et de la prière.',
    },
    {
        value: 'DISCIPLESHIP',
        description: 'Follow a guided pathway for spiritual learning.',
        descriptionFr: 'Suivre un parcours guidé pour grandir spirituellement.',
    },
    {
        value: 'MINISTRY_PREPARATION',
        description: 'Explore biblical teaching and preparation for service.',
        descriptionFr: 'Explorer l’enseignement biblique et vous préparer au service.',
    },
    {
        value: 'SERVING_IN_MINISTRY',
        description: 'Continue learning while actively serving others.',
        descriptionFr: 'Continuer à apprendre tout en servant activement les autres.',
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
// STEP COPY
// ============================================================

const headings = [
    ['What language feels most comfortable?', 'Quelle langue vous convient le mieux ?'],
    ['Where would you like to begin?', 'Par où aimeriez-vous commencer ?'],
    ['What would you like to explore?', 'Qu’aimeriez-vous explorer ?'],
    ['Make this space your own.', 'Faites de cet espace le vôtre.'],
] as const;

const descriptions = [
    ['Choose your preferred reading language.', 'Choisissez votre langue de lecture.'],
    [
        'This is your own description of your journey—not a judgment or ranking.',
        'C’est votre propre description de votre parcours, ni un jugement ni un classement.',
    ],
    [
        'Choose as many as you like. You can change these later.',
        'Choisissez-en autant que vous voulez. Vous pourrez les modifier plus tard.',
    ],
    [
        'Choose your preferred format and how your information may be used.',
        'Choisissez votre format préféré et la façon dont vos informations peuvent être utilisées.',
    ],
] as const;

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function Onboarding() {
    const { language, setLanguage } = useLanguage();
    const tr = (en: string, fr: string) => (language === 'fr' ? fr : en);
    const router = useRouter();
    const { getToken } = useAuth();

    const [step, setStep] = useState(0);
    const heading = useRef<HTMLHeadingElement>(null);
    const firstRender = useRef(true);

    const [form, setForm] = useState<FaithProfile>({
        language,
        learningGoals: [],
        preferredFormats: [],
        personalizationConsent: false,
        aiProcessingConsent: false,
    });

    const [load, setLoad] = useState<ProfileLoad>({ status: 'loading' });
    const [attempt, setAttempt] = useState(0);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const canSave = canSaveOnboarding(load, saving);

    // ==========================================================
    // OPEN AT A LINKED STEP (/onboarding?step=privacy)
    // ==========================================================

    useEffect(() => {
        setStep(
            onboardingStepIndex(
                new URLSearchParams(window.location.search).get('step')
            )
        );
    }, []);

    // Announce each new step by moving focus to its heading.
    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }
        heading.current?.focus();
    }, [step]);

    // ==========================================================
    // LOAD EXISTING PROFILE
    // ==========================================================

    useEffect(() => {
        let mounted = true;

        setLoad({ status: 'loading' });

        loadOnboardingProfile(async () => {
            const token = await getToken();
            if (!token) throw new Error('Please sign in again.');
            return api<ProfileResponse>('/me/profile', token);
        }).then((result) => {
            if (!mounted) return;

            setLoad(result);

            if (result.status === 'ready' && result.profile) {
                const profile = result.profile;

                setForm((current) => ({
                    ...current,
                    ...profile,
                    language: profile.language || current.language,
                    journey: normalizeJourney(profile.journey),
                    learningGoals: profile.learningGoals ?? [],
                    preferredFormats: profile.preferredFormats ?? [],
                    personalizationConsent:
                        profile.personalizationConsent ?? false,
                    aiProcessingConsent:
                        profile.aiProcessingConsent ?? false,
                }));
            }
        });

        return () => {
            mounted = false;
        };
    }, [getToken, attempt]);

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

    // Show the rest of onboarding in the language just chosen.
    function chooseLanguage(value: Language) {
        updateForm('language', value);
        setLanguage(value);
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
        if (!canSave) return;

        setSaving(true);
        setError('');

        try {
            const token = await getToken();

            if (!token) {
                throw new Error('Please sign in again.');
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

            setLanguage(payload.language === 'fr' ? 'fr' : 'en');
            router.push('/dashboard');
            router.refresh();
        } catch (err) {
            setError(errorMessage(err, language));
        } finally {
            setSaving(false);
        }
    }

    // ==========================================================
    // NAVIGATION
    // ==========================================================

    function nextStep() {
        if (step < ONBOARDING_STEPS.length - 1) {
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
        <main id="main-content">
            <title>{pageTitle(tr('Set up your space', 'Préparez votre espace'))}</title>
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
                        {tr('MAKE LIFEBOOK YOURS', 'PERSONNALISEZ LIFEBOOK')} ·{' '}
                        {tr(
                            `STEP ${step + 1} OF ${ONBOARDING_STEPS.length}`,
                            `ÉTAPE ${step + 1} SUR ${ONBOARDING_STEPS.length}`
                        )}
                    </span>

                    {/* PROGRESS INDICATOR */}

                    <div
                        className="stepper"
                        style={{ marginTop: 16 }}
                        aria-hidden="true"
                    >
                        {ONBOARDING_STEPS.map((item, index) => (
                            <span
                                key={item}
                                className={index <= step ? 'done' : ''}
                            />
                        ))}
                    </div>

                    {/* HEADING */}

                    <h1 className="page-heading" ref={heading} tabIndex={-1}>
                        {tr(headings[step][0], headings[step][1])}
                    </h1>

                    <p className="subheading">
                        {tr(descriptions[step][0], descriptions[step][1])}
                    </p>

                    <div style={{ margin: '28px 0 32px' }}>
                        {/* ============================================= */}
                        {/* LOADING AND LOAD FAILURE */}
                        {/* Choices stay hidden until the saved profile is known. */}
                        {/* ============================================= */}

                        {load.status === 'loading' && (
                            <div role="status">
                                <div className="skeleton" style={{ height: 76 }} />
                                <span className="sr-only">
                                    {tr('Loading your choices…', 'Chargement de vos choix…')}
                                </span>
                            </div>
                        )}

                        {load.status === 'failed' && (
                            <div className="alert" role="alert">
                                <p>
                                    {errorMessage(load.error, language)}{' '}
                                    {tr(
                                        'Your saved choices have not been changed.',
                                        'Vos choix enregistrés n’ont pas été modifiés.'
                                    )}
                                </p>
                                <button
                                    type="button"
                                    className="btn btn-outline btn-sm"
                                    onClick={() => setAttempt((n) => n + 1)}
                                >
                                    {tr('Try again', 'Réessayer')}
                                </button>
                            </div>
                        )}

                        {/* ============================================= */}
                        {/* STEP 1 — LANGUAGE */}
                        {/* ============================================= */}

                        {load.status === 'ready' && step === 0 && (
                            <div className="choice-grid">
                                {([
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
                                ] as const).map((option) => (
                                    <button
                                        key={option.value}
                                        aria-pressed={form.language === option.value}
                                        type="button"
                                        lang={option.value}
                                        className={
                                            'choice ' +
                                            (form.language === option.value
                                                ? 'selected'
                                                : '')
                                        }
                                        onClick={() =>
                                            chooseLanguage(option.value)
                                        }
                                    >
                                        <Languages
                                            size={22}
                                            className="choice-icon"
                                            aria-hidden="true"
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

                        {load.status === 'ready' && step === 1 && (
                            <div className="choice-grid">
                                {JOURNEYS.map((journey) => (
                                    <button
                                        key={journey.value}
                                        aria-pressed={form.journey === journey.value}
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
                                            className="choice-icon"
                                            aria-hidden="true"
                                        />

                                        <span>
                                            <strong>
                                                {faithJourneyLabel(journey.value, language)}
                                            </strong>
                                            <small>
                                                {tr(journey.description, journey.descriptionFr)}
                                            </small>
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* ============================================= */}
                        {/* STEP 3 — LEARNING GOALS */}
                        {/* ============================================= */}

                        {load.status === 'ready' && step === 2 && (
                            <div className="tag-list">
                                {GOALS.map((goal) => (
                                    <button
                                        key={goal}
                                        aria-pressed={form.learningGoals?.includes(goal) ?? false}
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

                                        {learningGoalLabel(goal, language)}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* ============================================= */}
                        {/* STEP 4 — PREFERENCES & PRIVACY */}
                        {/* ============================================= */}

                        {load.status === 'ready' && step === 3 && (
                            <>
                                <div className="form-field">
                                    <span id="formats-label" className="label">
                                        {tr(
                                            'How do you prefer to learn?',
                                            'Comment préférez-vous apprendre ?'
                                        )}
                                    </span>

                                    <div
                                        className="tag-list"
                                        role="group"
                                        aria-labelledby="formats-label"
                                    >
                                        {FORMATS.map((format) => (
                                            <button
                                                key={format}
                                                aria-pressed={form.preferredFormats?.includes(format) ?? false}
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

                                                {formatLabel(format, language)}
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
                                            <strong className="check-row-title">
                                                {tr(
                                                    'Personalized suggestions',
                                                    'Suggestions personnalisées'
                                                )}
                                            </strong>

                                            {tr(
                                                'Use my journey and goals to suggest a reading plan or a small next step on Home. Today’s Word stays the same for everyone, and suggestions never use my prayers.',
                                                'Utiliser mon parcours et mes objectifs pour me suggérer un plan de lecture ou un petit pas sur l’accueil. La Parole du jour reste la même pour tous, et les suggestions n’utilisent jamais mes prières.'
                                            )}
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
                                            <strong className="check-row-title">
                                                {tr(
                                                    'Allow optional AI processing',
                                                    'Autoriser le traitement IA facultatif'
                                                )}
                                            </strong>

                                            {tr(
                                                'Allow AI features only when I choose to use them. Prayer entries require their own clear, contextual consent before processing.',
                                                'Autoriser les fonctions d’IA uniquement lorsque je choisis de les utiliser. Chaque prière demande son propre consentement explicite avant tout traitement.'
                                            )}
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
                                        aria-hidden="true"
                                        style={{
                                            verticalAlign: 'middle',
                                            marginRight: 7,
                                        }}
                                    />

                                    {tr(
                                        'You can change these choices later. Your spiritual journey is private and never automatically scored.',
                                        'Vous pourrez modifier ces choix plus tard. Votre parcours spirituel est privé et n’est jamais évalué automatiquement.'
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* ============================================= */}
                    {/* SAVE ERROR */}
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
                            disabled={step === 0 || !canSave}
                            onClick={previousStep}
                        >
                            <ArrowLeft size={16} aria-hidden="true" />
                            {tr('Back', 'Retour')}
                        </button>

                        <div className="icon-line">
                            <button
                                type="button"
                                className="btn btn-soft"
                                disabled={!canSave}
                                onClick={save}
                            >
                                {tr('Skip & save', 'Passer et enregistrer')}
                            </button>

                            {step < ONBOARDING_STEPS.length - 1 ? (
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    disabled={!canSave}
                                    onClick={nextStep}
                                >
                                    {tr('Continue', 'Continuer')}
                                    <ArrowRight size={16} aria-hidden="true" />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    disabled={!canSave}
                                    onClick={save}
                                >
                                    {saving
                                        ? tr('Saving…', 'Enregistrement…')
                                        : tr('Finish', 'Terminer')}
                                    <Check size={16} aria-hidden="true" />
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
                    {tr(
                        'LifeBook supports your choices; it does not determine your spiritual maturity.',
                        'LifeBook respecte vos choix ; il ne mesure pas votre maturité spirituelle.'
                    )}
                </p>
            </div>
        </main>
    );
}
