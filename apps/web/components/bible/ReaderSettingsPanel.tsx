'use client';
import { useEffect, useRef, useState } from 'react';
import { Check, Minus, Plus, Type } from 'lucide-react';
import { TEXT_SIZES, stepSize, type ReaderSettings } from '../../lib/reader-settings';
import { bibleApi, type BibleLocale } from '../../lib/bible-api';
import { PREVIEW_PASSAGE, versionsFor, type BibleVersion } from '../../lib/bible-versions';
import { reportScripture } from '../../lib/fums';

const PREVIEW_REFERENCE = { en: 'Psalm 119:105', fr: 'Psaume 119:105' } as const;

type Props = {
  locale: BibleLocale; version: BibleVersion; uiLanguage: 'en' | 'fr'; settings: ReaderSettings;
  onSettings: (next: ReaderSettings) => void; onLocale: (locale: BibleLocale) => void; onVersion: (id: string) => void;
};

/** Psalm 119:105 in the chosen version, so each change is visible before closing the menu. Public-domain texts are
 *  quoted from lib/bible-versions.ts; the others load from the API while the menu is open, and count as shown. */
function usePreview(version: BibleVersion, open: boolean): string {
  const [loaded, setLoaded] = useState<{ id: string; text: string } | null>(null);
  useEffect(() => {
    if (version.preview || !open || loaded?.id === version.id) return;
    const abort = new AbortController();
    bibleApi.passage(PREVIEW_PASSAGE, version.locale, version.id, abort.signal).then(p => {
      if (abort.signal.aborted) return;
      setLoaded({ id: version.id, text: p.text.replace(/^\s*\[\d+\]\s*/, '').replace(/\s+/g, ' ').trim() });
      reportScripture(`preview:${version.id}`, p.fumsToken);
    }).catch(() => undefined);
    return () => abort.abort();
  }, [version, open, loaded?.id]);
  return version.preview ?? (loaded?.id === version.id ? loaded.text : '…');
}

/** "Aa" menu: Bible language and version, text size, line spacing and typeface. Opens from its button and closes on Escape or an outside tap. */
export function ReaderSettingsPanel({ locale, version, uiLanguage, settings, onSettings, onLocale, onVersion }: Props) {
  const tr = (en: string, fr: string) => uiLanguage === 'fr' ? fr : en;
  const menu = useRef<HTMLDetailsElement>(null);
  const [open, setOpen] = useState(false);
  const preview = usePreview(version, open);
  useEffect(() => {
    const close = (e: Event) => {
      const el = menu.current;
      if (!el?.open) return;
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !el.contains(e.target as Node)) { el.open = false; if (e instanceof KeyboardEvent) el.querySelector('summary')?.focus(); }
    };
    document.addEventListener('pointerdown', close); document.addEventListener('keydown', close);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', close); };
  }, []);
  const set = (patch: Partial<ReaderSettings>) => onSettings({ ...settings, ...patch });
  const level = TEXT_SIZES.indexOf(settings.size);
  return <details className="reader-menu" ref={menu} onToggle={e => setOpen(e.currentTarget.open)}>
    <summary className="icon-button reader-menu-button" aria-label={tr(`Reading settings, ${version.name}`, `Réglages de lecture, ${version.name}`)}><Type size={18} aria-hidden="true" /><span className="reader-version-tag" aria-hidden="true">{version.abbreviation}</span></summary>
    <div className="reader-menu-panel" role="group" aria-label={tr('Reading settings', 'Réglages de lecture')}>
      <figure className="reader-preview" data-size={settings.size} data-spacing={settings.spacing} data-font={settings.font} aria-label={tr('Preview of your settings', 'Aperçu de vos réglages')}>
        <blockquote className="scripture-text" lang={locale}>{preview}</blockquote>
        <figcaption>{PREVIEW_REFERENCE[locale]} · {version.name}</figcaption>
      </figure>
      <div className="reader-setting">
        <span className="field-label" id="rs-language">{tr('Bible language', 'Langue de la Bible')}</span>
        <div className="mini-segmented" role="radiogroup" aria-labelledby="rs-language">
          {(['en', 'fr'] as const).map(l => <button key={l} type="button" role="radio" aria-checked={locale === l} onClick={() => onLocale(l)}>{l === 'en' ? 'English' : 'Français'}</button>)}
        </div>
      </div>
      <div className="reader-setting">
        <span className="field-label" id="rs-version">{tr('Version', 'Version')}</span>
        <div className="reader-versions" role="radiogroup" aria-labelledby="rs-version">
          {versionsFor(locale).map(v => <button key={v.id} type="button" role="radio" aria-checked={v.id === version.id} onClick={() => onVersion(v.id)}>
            <strong>{v.abbreviation}</strong><span>{v.name}</span>{v.id === version.id && <Check size={16} aria-hidden="true" />}
          </button>)}
        </div>
      </div>
      <div className="reader-setting">
        <span className="field-label" id="rs-size">{tr('Text size', 'Taille du texte')}</span>
        <div className="reader-size" role="group" aria-labelledby="rs-size">
          <button type="button" className="icon-button" disabled={level === 0} onClick={() => set({ size: stepSize(settings.size, -1) })} aria-label={tr('Smaller text', 'Texte plus petit')}><Minus size={16} aria-hidden="true" /></button>
          <span className="reader-size-dots" aria-live="polite" aria-label={tr(`Size ${level + 1} of ${TEXT_SIZES.length}`, `Taille ${level + 1} sur ${TEXT_SIZES.length}`)}>{TEXT_SIZES.map((s, i) => <span key={s} className={i <= level ? 'on' : ''} />)}</span>
          <button type="button" className="icon-button" disabled={level === TEXT_SIZES.length - 1} onClick={() => set({ size: stepSize(settings.size, 1) })} aria-label={tr('Larger text', 'Texte plus grand')}><Plus size={16} aria-hidden="true" /></button>
        </div>
      </div>
      <div className="reader-setting">
        <span className="field-label" id="rs-spacing">{tr('Line spacing', 'Interligne')}</span>
        <div className="mini-segmented" role="radiogroup" aria-labelledby="rs-spacing">
          <button type="button" role="radio" aria-checked={settings.spacing === 'normal'} onClick={() => set({ spacing: 'normal' })}><span className="spacing-sample" data-spacing="normal" aria-hidden="true"><i /><i /><i /></span>{tr('Standard', 'Standard')}</button>
          <button type="button" role="radio" aria-checked={settings.spacing === 'relaxed'} onClick={() => set({ spacing: 'relaxed' })}><span className="spacing-sample" data-spacing="relaxed" aria-hidden="true"><i /><i /><i /></span>{tr('Airy', 'Aéré')}</button>
        </div>
      </div>
      <div className="reader-setting">
        <span className="field-label" id="rs-font">{tr('Typeface', 'Police')}</span>
        <div className="mini-segmented" role="radiogroup" aria-labelledby="rs-font">
          <button type="button" role="radio" aria-checked={settings.font === 'serif'} onClick={() => set({ font: 'serif' })} className="font-serif-sample">{tr('Serif', 'Avec empattement')}</button>
          <button type="button" role="radio" aria-checked={settings.font === 'sans'} onClick={() => set({ font: 'sans' })} className="font-sans-sample">{tr('Sans', 'Sans empattement')}</button>
        </div>
      </div>
    </div>
  </details>;
}
