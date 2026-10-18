import type { Content } from '../lib/content';
import { CloseIcon } from './icons';

/** A faithful, static rendering of the app's prayer-time screens (not a screenshot), so it stays sharp and translatable. */
export function ProductPreview({ t }: { t: Content['preview'] }) {
  return <figure className="preview" aria-label={t.label}>
    <div className="device device-back" aria-hidden="true">
      <div className="device-bar"><CloseIcon size={14} /><span className="dots"><i className="done" /><i className="current" /><i /><i /><i /></span><span /></div>
      <p className="device-step">{t.stillStep}</p>
      <p className="device-title">{t.stillTitle}</p>
      <div className="breath"><span /></div>
      <p className="device-cue">{t.breathe}</p>
      <p className="device-clock">{t.time}</p>
    </div>
    <div className="device device-front">
      <div className="device-bar" aria-hidden="true"><CloseIcon size={14} /><span className="dots"><i className="current" /><i /><i /><i /><i /></span><span /></div>
      <p className="device-step">{t.step}</p>
      <blockquote className="device-verse">{t.verse}</blockquote>
      <p className="device-ref"><cite>{t.reference}</cite> · {t.translation}</p>
      <div className="device-actions" aria-hidden="true"><span>{t.back}</span><span className="primary">{t.next}</span></div>
    </div>
  </figure>;
}
