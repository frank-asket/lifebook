'use client';

import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';

import { api } from '../lib/api';

// ============================================================
// TYPES
// ============================================================

export type Meditation = {
  id: string;
  title: string;
  scriptureReference: string;
  scriptureText: string | null;
  translation: string | null;
  explanation: string;
  questions: string[];
  guidedPrayer: string;
  publishDate: string | null;
};

type MeditationState = {
  reflection: string;
  completedAt: string | null;
  bookmarked: boolean;
};

type Feedback = {
  type: 'success' | 'error';
  text: string;
};

type ActionType = 'reflection' | 'complete' | 'bookmark';

const EMPTY_STATE: MeditationState = {
  reflection: '',
  completedAt: null,
  bookmarked: false,
};

// ============================================================
// COMPONENT
// ============================================================

export function MeditationView({
  meditation,
}: {
  meditation: Meditation;
}) {
  const {
    isLoaded,
    isSignedIn,
    userId,
    getToken,
  } = useAuth();

  const [state, setState] = useState<MeditationState>(EMPTY_STATE);

  const [draft, setDraft] = useState('');

  const [loadingState, setLoadingState] = useState(true);

  const [busyAction, setBusyAction] = useState<ActionType | null>(
    null,
  );

  const [feedback, setFeedback] = useState<Feedback | null>(
    null,
  );

  // Prevent responses from an old meditation/account
  // from updating the current view.
  const requestVersion = useRef(0);

  const mounted = useRef(false);

  const authenticated = isLoaded && isSignedIn === true;

  const busy = busyAction !== null;

  const hasUnsavedChanges = draft !== state.reflection;

  // ============================================================
  // LOAD PERSONAL MEDITATION STATE
  // ============================================================

  const loadPersonalState = useCallback(
    async (version: number) => {
      if (!authenticated) return;

      setLoadingState(true);
      setFeedback(null);

      try {
        const token = await getToken();

        if (!token) {
          throw new Error('Please sign in again.');
        }

        const result = await api<MeditationState>(
          `/meditations/${meditation.id}/state`,
          token,
        );

        if (
          !mounted.current ||
          version !== requestVersion.current
        ) {
          return;
        }

        setState(result);
        setDraft(result.reflection);
        setLoadingState(false);
      } catch (error) {
        if (
          !mounted.current ||
          version !== requestVersion.current
        ) {
          return;
        }

        setLoadingState(false);

        setFeedback({
          type: 'error',
          text:
            error instanceof Error
              ? error.message
              : 'Unable to load your saved progress.',
        });
      }
    },
    [authenticated, getToken, meditation.id],
  );

  useEffect(() => {
    mounted.current = true;

    const version = ++requestVersion.current;

    setState(EMPTY_STATE);
    setDraft('');
    setFeedback(null);
    setBusyAction(null);

    if (!isLoaded) {
      setLoadingState(true);
    } else if (authenticated) {
      void loadPersonalState(version);
    } else {
      setLoadingState(false);
    }

    return () => {
      mounted.current = false;
      requestVersion.current += 1;
    };
  }, [
    isLoaded,
    authenticated,
    userId,
    meditation.id,
    loadPersonalState,
  ]);

  // ============================================================
  // AUTHENTICATED ACTIONS
  // ============================================================

  async function action(
    type: ActionType,
    path: string,
    method: 'PUT' | 'POST',
    body?: object,
  ) {
    if (
      !authenticated ||
      loadingState ||
      busy ||
      !mounted.current
    ) {
      return;
    }

    const version = requestVersion.current;

    setBusyAction(type);
    setFeedback(null);

    try {
      const token = await getToken();

      if (!token) {
        throw new Error('Please sign in again.');
      }

      await api(
        `/meditations/${meditation.id}/${path}`,
        token,
        {
          method,
          ...(body
            ? {
              body: JSON.stringify(body),
            }
            : {}),
        },
      );

      if (
        !mounted.current ||
        version !== requestVersion.current
      ) {
        return;
      }

      const next = await api<MeditationState>(
        `/meditations/${meditation.id}/state`,
        token,
      );

      if (
        !mounted.current ||
        version !== requestVersion.current
      ) {
        return;
      }

      setState(next);

      if (type === 'reflection') {
        setDraft(next.reflection);
      }

      const messages: Record<ActionType, string> = {
        reflection: 'Your reflection has been saved.',
        complete: 'Meditation marked as complete.',
        bookmark: next.bookmarked
          ? 'Meditation saved for later.'
          : 'Bookmark removed.',
      };

      setFeedback({
        type: 'success',
        text: messages[type],
      });
    } catch (error) {
      if (
        !mounted.current ||
        version !== requestVersion.current
      ) {
        return;
      }

      setFeedback({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Something went wrong. Please try again.',
      });
    } finally {
      if (
        mounted.current &&
        version === requestVersion.current
      ) {
        setBusyAction(null);
      }
    }
  }

  // ============================================================
  // SAVE REFLECTION
  // ============================================================

  function saveReflection() {
    const text = draft.trim();

    if (!text || text.length > 10000) return;

    void action(
      'reflection',
      'reflection',
      'PUT',
      { text },
    );
  }

  // ============================================================
  // MARK COMPLETE
  // ============================================================

  function markComplete() {
    void action(
      'complete',
      'complete',
      'POST',
    );
  }

  // ============================================================
  // TOGGLE BOOKMARK
  // ============================================================

  function toggleBookmark() {
    void action(
      'bookmark',
      'bookmark',
      'PUT',
      {
        saved: !state.bookmarked,
      },
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <article
      style={{
        maxWidth: 820,
        margin: '0 auto',
        padding: '30px 18px 90px',
        color: '#2d2445',
      }}
    >
      {/* Navigation */}

      <Link
        href="/meditation"
        style={{ color: '#7657bb' }}
      >
        ← Daily meditation
      </Link>

      {/* Header */}

      <header style={{ margin: '30px 0' }}>
        <span
          style={{
            color: '#805db5',
            fontWeight: 700,
            letterSpacing: 2,
          }}
        >
          TODAY IN THE WORD
        </span>

        <h1
          style={{
            fontSize: 'clamp(32px,5vw,52px)',
            margin: '12px 0',
          }}
        >
          {meditation.title}
        </h1>

        <p style={{ color: '#766b88' }}>
          {meditation.scriptureReference}

          {meditation.translation
            ? ` · ${meditation.translation}`
            : ''}
        </p>
      </header>

      {/* ======================================================
          1. READ SCRIPTURE
      ====================================================== */}

      <section style={box}>
        <h2>Read Scripture</h2>

        {meditation.scriptureText ? (
          <blockquote
            style={{
              fontSize: 23,
              lineHeight: 1.7,
              borderLeft: '4px solid #ab8ad8',
              paddingLeft: 20,
              marginLeft: 0,
            }}
          >
            {meditation.scriptureText}
          </blockquote>
        ) : (
          <p>
            Open your Bible to{' '}
            <strong>
              {meditation.scriptureReference}
            </strong>
            .
          </p>
        )}
      </section>

      {/* ======================================================
          2. UNDERSTAND THE WORD
      ====================================================== */}

      <section style={box}>
        <h2>Understand the Word</h2>

        <p
          style={{
            whiteSpace: 'pre-wrap',
            lineHeight: 1.9,
          }}
        >
          {meditation.explanation}
        </p>
      </section>

      {/* ======================================================
          3. REFLECT
      ====================================================== */}

      <section style={box}>
        <h2>Reflect</h2>

        {Array.isArray(meditation.questions) &&
          meditation.questions.length > 0 && (
            <ul style={{ lineHeight: 1.9 }}>
              {meditation.questions.map(
                (question, index) => (
                  <li key={index}>
                    {question}
                  </li>
                ),
              )}
            </ul>
          )}

        {!isLoaded ? (
          <p role="status">
            Checking your session…
          </p>
        ) : authenticated ? (
          <>
            <label
              htmlFor={`reflection-${meditation.id}`}
              style={{
                display: 'block',
                marginTop: 20,
                fontWeight: 600,
              }}
            >
              Your personal reflection
            </label>

            {loadingState ? (
              <p role="status">
                Loading your saved reflection…
              </p>
            ) : (
              <>
                <textarea
                  id={`reflection-${meditation.id}`}
                  aria-label="Your personal reflection"
                  value={draft}
                  onChange={(event) => {
                    setDraft(event.target.value);
                    setFeedback(null);
                  }}
                  maxLength={10000}
                  rows={7}
                  disabled={busy}
                  placeholder="What is God teaching you through this passage?"
                  style={{
                    display: 'block',
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: 14,
                    borderRadius: 12,
                    border: '1px solid #d4c9e5',
                    margin: '12px 0',
                    fontFamily: 'inherit',
                    fontSize: 15,
                    lineHeight: 1.7,
                    resize: 'vertical',
                  }}
                />

                <div
                  style={{
                    display: 'flex',
                    gap: 12,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                  }}
                >
                  <button
                    type="button"
                    disabled={
                      busy ||
                      !draft.trim() ||
                      !hasUnsavedChanges
                    }
                    onClick={saveReflection}
                    style={button}
                  >
                    {busyAction === 'reflection'
                      ? 'Saving…'
                      : 'Save reflection'}
                  </button>

                  {hasUnsavedChanges && (
                    <span
                      style={{
                        color: '#805db5',
                        fontSize: 13,
                      }}
                    >
                      Unsaved changes
                    </span>
                  )}
                </div>

                <p
                  style={{
                    fontSize: 13,
                    color: '#766b88',
                    lineHeight: 1.6,
                  }}
                >
                  Your reflection is associated with your
                  account. Avoid entering sensitive personal
                  information until additional privacy
                  protections are implemented.
                </p>
              </>
            )}
          </>
        ) : (
          <p>
            <Link href="/sign-in">
              Sign in
            </Link>{' '}
            to save your personal reflection.
          </p>
        )}
      </section>

      {/* ======================================================
          4. RESPOND IN PRAYER
      ====================================================== */}

      <section style={box}>
        <h2>Respond in Prayer</h2>

        <p
          style={{
            whiteSpace: 'pre-wrap',
            lineHeight: 1.9,
          }}
        >
          {meditation.guidedPrayer}
        </p>
      </section>

      {/* ======================================================
          5. CONTINUE YOUR JOURNEY
      ====================================================== */}

      {authenticated && (
        <section style={box}>
          <h2>Continue Your Journey</h2>

          {loadingState ? (
            <p role="status">
              Loading your progress…
            </p>
          ) : (
            <>
              <p>
                {state.completedAt
                  ? 'You completed this meditation.'
                  : 'Ready to mark this meditation complete?'}
              </p>

              {hasUnsavedChanges && (
                <p
                  style={{
                    color: '#805db5',
                    fontSize: 14,
                  }}
                >
                  Remember to save your reflection before
                  leaving this page.
                </p>
              )}

              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <button
                  type="button"
                  style={button}
                  disabled={
                    busy ||
                    Boolean(state.completedAt)
                  }
                  onClick={markComplete}
                >
                  {busyAction === 'complete'
                    ? 'Completing…'
                    : state.completedAt
                      ? 'Completed ✓'
                      : 'Mark complete'}
                </button>

                <button
                  type="button"
                  style={button}
                  disabled={busy}
                  onClick={toggleBookmark}
                >
                  {busyAction === 'bookmark'
                    ? 'Updating…'
                    : state.bookmarked
                      ? 'Remove bookmark'
                      : 'Save for later'}
                </button>
              </div>
            </>
          )}
        </section>
      )}

      {/* ======================================================
          FEEDBACK
      ====================================================== */}

      {feedback && (
        <p
          role={
            feedback.type === 'error'
              ? 'alert'
              : 'status'
          }
          aria-live="polite"
          style={{
            color:
              feedback.type === 'error'
                ? '#b42318'
                : '#327a52',
            marginBottom: 24,
          }}
        >
          {feedback.text}
        </p>
      )}

      {/* Footer navigation */}

      {authenticated && (
        <Link
          href="/meditation/history"
          style={{
            color: '#7657bb',
            fontWeight: 600,
          }}
        >
          View meditation history →
        </Link>
      )}
    </article>
  );
}

// ============================================================
// SHARED STYLES
// ============================================================

const box: CSSProperties = {
  background: '#fff',
  border: '1px solid #eee7f5',
  borderRadius: 22,
  padding: 'clamp(20px,4vw,36px)',
  marginBottom: 22,
  boxShadow: '0 6px 24px rgba(50,30,80,.04)',
};

const button: CSSProperties = {
  background: '#6842a5',
  color: 'white',
  border: 0,
  borderRadius: 10,
  padding: '12px 20px',
  cursor: 'pointer',
  fontWeight: 650,
};