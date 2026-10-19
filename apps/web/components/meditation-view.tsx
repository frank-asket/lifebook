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

import {useLanguage} from './language-provider';
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

type ActionType = 'reflection' | 'delete' | 'complete' | 'bookmark';

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
  headingLevel = 'h1',
}: {
  meditation: Meditation;
  headingLevel?: 'h1' | 'h2';
}) {
  const {language}=useLanguage();
  const tr=(en:string,fr:string)=>language==='fr'?fr:en;
  const Heading = headingLevel;
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

  // Prevent outdated requests from updating the current view.
  const requestVersion = useRef(0);

  const mounted = useRef(false);

  const authenticated = isLoaded && isSignedIn === true;

  const busy = busyAction !== null;

  const hasUnsavedChanges =
    draft.trim() !== state.reflection.trim();

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
    method: 'PUT' | 'POST' | 'DELETE',
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

      if (type === 'delete') {
        setState(previous => ({ ...previous, reflection: '' }));
        setDraft('');
        setFeedback({ type: 'success', text: tr('Reflection deleted. Your completion and bookmark are unchanged.', 'Réflexion supprimée. Votre progression et votre favori sont conservés.') });
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
        delete: 'Your reflection has been deleted.',
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

    if (!text || text.length > 10000) {
      return;
    }

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
        color: 'var(--text)',
      }}
    >
      {/* ======================================================
          NAVIGATION
      ====================================================== */}

      <Link
        href="/meditation"
        style={{
          color: 'var(--accent)',
          fontWeight: 600,
        }}
      >{tr("← Daily meditation","← Méditation quotidienne")}</Link>

      {/* ======================================================
          HEADER
      ====================================================== */}

      <header
        style={{
          margin: '30px 0',
        }}
      >
        <span
          style={{
            color: 'var(--accent)',
            fontWeight: 700,
            letterSpacing: 2,
            fontSize: 11,
          }}
        >{tr("TODAY IN THE WORD","AUJOURD’HUI DANS LA PAROLE")}</span>

        <Heading
          style={{
            fontSize: headingLevel === 'h1' ? 'clamp(32px,5vw,52px)' : 'clamp(26px,4vw,38px)',
            margin: '12px 0',
            color: 'var(--text)',
          }}
        >
          {meditation.title}
        </Heading>

        <p
          style={{
            color: 'var(--text-muted)',
            lineHeight: 1.6,
          }}
        >
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
        <h2>{tr("Read Scripture","Lire les Écritures")}</h2>

        {meditation.scriptureText ? (
          <blockquote
            style={{
              fontSize: 23,
              lineHeight: 1.7,
              borderLeft: '4px solid var(--accent)',
              paddingLeft: 20,
              marginLeft: 0,
              marginRight: 0,
              color: 'var(--text)',
            }}
          >
            {meditation.scriptureText}
          </blockquote>
        ) : (
          <p
            style={{
              lineHeight: 1.8,
              color: 'var(--text-muted)',
            }}
          >
            Open your Bible to{' '}
            <strong
              style={{
                color: 'var(--text)',
              }}
            >
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
        <h2>{tr("Understand the Word","Comprendre la Parole")}</h2>

        <p
          style={{
            whiteSpace: 'pre-wrap',
            lineHeight: 1.9,
            color: 'var(--text)',
          }}
        >
          {meditation.explanation}
        </p>
      </section>

      {/* ======================================================
          3. REFLECT
      ====================================================== */}

      <section style={box}>
        <h2>{tr("Reflect","Réfléchir")}</h2>

        {Array.isArray(meditation.questions) &&
          meditation.questions.length > 0 && (
            <ul
              style={{
                lineHeight: 1.9,
                color: 'var(--text)',
                paddingLeft: 24,
              }}
            >
              {meditation.questions.map(
                (question, index) => (
                  <li
                    key={index}
                    style={{
                      marginBottom: 8,
                    }}
                  >
                    {question}
                  </li>
                ),
              )}
            </ul>
          )}

        {!isLoaded ? (
          <p
            role="status"
            style={{
              color: 'var(--text-muted)',
            }}
          >{tr("Checking your session…","Vérification de votre session…")}</p>
        ) : authenticated ? (
          <>
            <label
              htmlFor={`reflection-${meditation.id}`}
              style={{
                display: 'block',
                marginTop: 20,
                fontWeight: 600,
                color: 'var(--text)',
              }}
            >{tr("Your personal reflection","Votre réflexion personnelle")}</label>

            {loadingState ? (
              <p
                role="status"
                style={{
                  color: 'var(--text-muted)',
                }}
              >{tr("Loading your saved reflection…","Chargement de votre réflexion…")}</p>
            ) : (
              <>
                <textarea
                  id={`reflection-${meditation.id}`}
                  aria-label={tr("Your personal reflection","Votre réflexion personnelle")}
                  value={draft}
                  onChange={(event) => {
                    setDraft(event.target.value);
                    setFeedback(null);
                  }}
                  maxLength={10000}
                  rows={7}
                  disabled={busy}
                  placeholder={tr("What is God teaching you through this passage?","Que vous enseigne Dieu à travers ce passage ?")}
                  style={{
                    display: 'block',
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: 14,
                    borderRadius: 12,
                    border: '1px solid var(--border)',
                    background: 'var(--surface-secondary)',
                    color: 'var(--text)',
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
                      ? tr("Saving…","Enregistrement…")
                      : tr("Save reflection","Enregistrer la réflexion")}
                  </button>

                  {state.reflection && <button type="button" className="btn btn-outline" disabled={busy} onClick={() => {
                    if (window.confirm(tr('Permanently delete this reflection and discard any unsaved draft? Your completion and bookmark will remain.', 'Supprimer définitivement cette réflexion et abandonner le brouillon ? Votre progression et votre favori seront conservés.'))) void action('delete', 'reflection', 'DELETE');
                  }}>{busyAction === 'delete' ? tr('Deleting…', 'Suppression…') : tr('Delete reflection', 'Supprimer la réflexion')}</button>}

                  {hasUnsavedChanges && (
                    <span
                      style={{
                        color: 'var(--accent)',
                        fontSize: 13,
                      }}
                    >{tr("Unsaved changes","Modifications non enregistrées")}</span>
                  )}
                </div>

                <p
                  style={{
                    fontSize: 13,
                    color: 'var(--text-muted)',
                    lineHeight: 1.6,
                    marginTop: 16,
                  }}
                >
                  {tr('Your saved reflection is encrypted in your account. You can delete it without changing your completed meditation or bookmark.', 'Votre réflexion enregistrée est chiffrée dans votre compte. Vous pouvez la supprimer sans modifier la méditation terminée ni le favori.')}
                </p>
              </>
            )}
          </>
        ) : (
          <p
            style={{
              color: 'var(--text-muted)',
              lineHeight: 1.7,
            }}
          >
            <Link
              href="/sign-in"
              style={{
                color: 'var(--accent)',
                fontWeight: 600,
              }}
            >{tr("Sign in","Se connecter")}</Link>{' '}
            to save your personal reflection.
          </p>
        )}
      </section>

      {/* ======================================================
          4. RESPOND IN PRAYER
      ====================================================== */}

      <section style={box}>
        <h2>{tr("Respond in Prayer","Répondre par la prière")}</h2>

        <p
          style={{
            whiteSpace: 'pre-wrap',
            lineHeight: 1.9,
            color: 'var(--text)',
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
          <h2>{tr("Continue Your Journey","Poursuivre votre parcours")}</h2>

          {loadingState ? (
            <p
              role="status"
              style={{
                color: 'var(--text-muted)',
              }}
            >{tr("Loading your progress…","Chargement de votre progression…")}</p>
          ) : (
            <>
              <p
                style={{
                  color: 'var(--text-muted)',
                  lineHeight: 1.7,
                }}
              >
                {state.completedAt
                  ? tr("You completed this meditation.","Vous avez terminé cette méditation.")
                  : tr("Ready to mark this meditation complete?","Prêt à terminer cette méditation ?")}
              </p>

              {hasUnsavedChanges && (
                <p
                  style={{
                    color: 'var(--accent)',
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
                    ? tr("Completing…","Enregistrement…")
                    : state.completedAt
                      ? tr("Completed ✓","Terminé ✓")
                      : tr("Mark complete","Terminer")}
                </button>

                <button
                  type="button"
                  style={secondaryButton}
                  disabled={busy}
                  onClick={toggleBookmark}
                >
                  {busyAction === 'bookmark'
                    ? tr("Updating…","Actualisation…")
                    : state.bookmarked
                      ? tr("Remove bookmark","Retirer le favori")
                      : tr("Save for later","Garder pour plus tard")}
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
                ? 'var(--error, #b42318)'
                : 'var(--success, #327a52)',
            marginBottom: 24,
            lineHeight: 1.6,
          }}
        >
          {feedback.text}
        </p>
      )}

      {/* ======================================================
          FOOTER NAVIGATION
      ====================================================== */}

      {authenticated && (
        <Link
          href="/meditation/history"
          style={{
            color: 'var(--accent)',
            fontWeight: 600,
          }}
        >{tr("View meditation history →","Voir l’historique des méditations →")}</Link>
      )}
    </article>
  );
}

// ============================================================
// SHARED STYLES
// ============================================================

const box: CSSProperties = {
  background: 'var(--surface)',
  color: 'var(--text)',
  border: '1px solid var(--border)',
  borderRadius: 22,
  padding: 'clamp(20px,4vw,36px)',
  marginBottom: 22,
  boxShadow: 'var(--shadow)',
};

const button: CSSProperties = {
  background: 'var(--primary)',
  color: 'var(--primary-contrast)',
  border: 0,
  borderRadius: 10,
  padding: '12px 20px',
  cursor: 'pointer',
  fontWeight: 650,
};

const secondaryButton: CSSProperties = {
  background: 'var(--surface-secondary)',
  color: 'var(--text)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  padding: '12px 20px',
  cursor: 'pointer',
  fontWeight: 650,
};
