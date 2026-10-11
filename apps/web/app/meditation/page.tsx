'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

import { Shell } from '../../components/shell';
import { api } from '../../lib/api';

import {
    MeditationView,
    type Meditation,
} from '../../components/meditation-view';

type PageState = {
    item: Meditation | null;
    loading: boolean;
    error: string;
};

export default function DailyMeditationPage() {
    const [state, setState] = useState<PageState>({
        item: null,
        loading: true,
        error: '',
    });

    const [locale, setLocale] = useState<'en' | 'fr'>('en');

    const loadMeditation = useCallback(
        async (signal?: AbortSignal) => {
            setState((previous) => ({
                ...previous,
                loading: true,
                error: '',
            }));

            try {
                const meditation = await api<Meditation | null>(
                    `/meditations/today?locale=${locale}`,
                );

                if (signal?.aborted) return;

                setState({
                    item: meditation,
                    loading: false,
                    error: '',
                });
            } catch (error) {
                if (signal?.aborted) return;

                setState({
                    item: null,
                    loading: false,
                    error:
                        error instanceof Error
                            ? error.message
                            : 'Unable to load today’s meditation.',
                });
            }
        },
        [locale],
    );

    useEffect(() => {
        const controller = new AbortController();

        void loadMeditation(controller.signal);

        return () => {
            controller.abort();
        };
    }, [loadMeditation]);

    return (
        <Shell title="Daily Bible Meditation">
            <main
                style={{
                    width: '100%',
                    maxWidth: 820,
                    margin: '0 auto',
                    padding: '24px 16px',
                }}
            >
                {/* Page header */}
                <header
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 16,
                        flexWrap: 'wrap',
                        marginBottom: 32,
                    }}
                >
                    <div>
                        <h1>Daily Bible Meditation</h1>

                        <p>
                            Make space for Scripture, reflection, and prayer.
                        </p>
                    </div>

                    <select
                        aria-label="Meditation language"
                        value={locale}
                        onChange={(event) =>
                            setLocale(event.target.value as 'en' | 'fr')
                        }
                    >
                        <option value="en">English</option>
                        <option value="fr">Français</option>
                    </select>
                </header>

                {/* Loading */}
                {state.loading && (
                    <div role="status" aria-live="polite">
                        <h2>Preparing your meditation…</h2>

                        <p>
                            Your Scripture reflection is loading.
                        </p>
                    </div>
                )}

                {/* Error */}
                {!state.loading && state.error && (
                    <div role="alert">
                        <h2>We couldn’t load your meditation.</h2>

                        <p>{state.error}</p>

                        <button
                            type="button"
                            onClick={() => void loadMeditation()}
                        >
                            Try again
                        </button>
                    </div>
                )}

                {/* Meditation */}
                {!state.loading && !state.error && state.item && (
                    <>
                        <MeditationView meditation={state.item} />

                        <div
                            style={{
                                marginTop: 24,
                                display: 'flex',
                                gap: 16,
                                flexWrap: 'wrap',
                            }}
                        >
                            <button
                                type="button"
                                onClick={() => void loadMeditation()}
                            >
                                Refresh meditation
                            </button>

                            <Link href="/meditation/history">
                                View meditation history
                            </Link>
                        </div>
                    </>
                )}

                {/* Empty state */}
                {!state.loading && !state.error && !state.item && (
                    <section
                        style={{
                            padding: 32,
                            borderRadius: 16,
                            border: '1px solid #e5e7eb',
                            textAlign: 'center',
                        }}
                    >
                        <h2>Today’s meditation is being prepared</h2>

                        <p>
                            A new Scripture reflection will be available soon.
                        </p>

                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                gap: 16,
                                marginTop: 24,
                                flexWrap: 'wrap',
                            }}
                        >
                            <button
                                type="button"
                                onClick={() => void loadMeditation()}
                            >
                                Check again
                            </button>

                            <Link href="/dashboard">
                                Return to dashboard
                            </Link>
                        </div>
                    </section>
                )}
            </main>
        </Shell>
    );
}