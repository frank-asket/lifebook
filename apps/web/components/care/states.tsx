'use client';
import { useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { careErrorMessage, SIGN_IN_AGAIN } from '../../lib/care-errors';

type Ui = 'en' | 'fr';

/** A Clerk token getter that keeps its identity across renders, so effects do not refetch. */
export function useCareToken() {
  const { getToken } = useAuth();
  return useCallback(async () => { const value = await getToken(); if (!value) throw new Error(SIGN_IN_AGAIN); return value; }, [getToken]);
}

export function CareLoading({ label, lines = 3 }: { label: string; lines?: number }) {
  return <div className="care-loading" role="status"><span className="sr-only">{label}</span>{Array.from({ length: lines }, (_, i) => <div key={i} className="skeleton" aria-hidden="true"/>)}</div>;
}

export function CareError({ error, language, onRetry }: { error: unknown; language: Ui; onRetry?: () => void }) {
  return <div className="alert reader-error" role="alert"><span>{careErrorMessage(error, language)}</span>
    {onRetry && <button type="button" className="btn btn-soft" onClick={onRetry}>{language === 'fr' ? 'Réessayer' : 'Try again'}</button>}</div>;
}

export function CareEmpty({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return <div className="empty care-empty"><Icon size={28} aria-hidden="true"/><p>{children}</p></div>;
}
