'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { Shell } from '../../../components/shell';
import { useLanguage } from '../../../components/language-provider';
import { api, ApiError } from '../../../lib/api';
import { errorMessage } from '../../../lib/errors';
import type { DiscoveryPage, DiscoverySources } from '../../../lib/teaching-discovery';

export default function DiscoveryPageRoute() { const { userId } = useAuth(); return <Discovery key={userId ?? 'signed-out'} />; }
function Discovery() {
  const { isLoaded, isSignedIn, getToken } = useAuth(); const { language } = useLanguage(); const tr = (en: string, fr: string) => language === 'fr' ? fr : en;
  const [sources, setSources] = useState<DiscoverySources | null>(null); const [channel, setChannel] = useState(''); const [data, setData] = useState<DiscoveryPage | null>(null);
  const [error, setError] = useState(''); const [forbidden, setForbidden] = useState(false); const [busy, setBusy] = useState(false); const [retry, setRetry] = useState(0);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    const controller = new AbortController(); setSources(null); setError(''); setForbidden(false);
    (async () => { try { const token = await getToken(); if (!token) throw new Error(tr('Please sign in again.', 'Reconnectez-vous.')); const result = await api<DiscoverySources>('/teaching-discovery/sources', token, { signal: controller.signal }); if (!controller.signal.aborted) { setSources(result); setChannel(result.sources[0]?.id ?? ''); setData(null); } } catch (e) { if (!controller.signal.aborted) { if (e instanceof ApiError && e.status === 403) setForbidden(true); else setError(errorMessage(e, language)); } } })();
    return () => controller.abort();
  }, [isLoaded, isSignedIn, getToken, retry]);
  async function discover(pageToken?: string) {
    if (busy || (request.current && !request.current.signal.aborted) || !sources?.enabled || !channel) return;
    request.current?.abort(); const controller = new AbortController(); request.current = controller;
    setBusy(true); setError(''); setData(null);
    try { const token = await getToken(); if (!token) throw new Error(tr('Please sign in again.', 'Reconnectez-vous.')); if (controller.signal.aborted) return;
      const result = await api<DiscoveryPage>(`/teaching-discovery/videos?channelId=${encodeURIComponent(channel)}${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`, token, { signal: controller.signal });
      if (!controller.signal.aborted) setData(result);
    } catch (e) { if (!controller.signal.aborted) setError(errorMessage(e, language)); }
    finally { if (!controller.signal.aborted) { request.current = null; setBusy(false); } }
  }
  return <Shell title={tr('Teaching discovery', 'Découverte d’enseignements')}><Link className="text-link" href="/editorial">← {tr('Content workspace', 'Atelier de contenus')}</Link><h1 className="page-heading">{tr('Find resources for review', 'Trouver des ressources à relire')}</h1><p className="subheading">{tr('Read-only discovery from channels explicitly selected by LifeBook. Results are not approved teachings.', 'Découverte en lecture seule depuis les chaînes choisies explicitement par LifeBook. Les résultats ne sont pas des enseignements approuvés.')}</p>
    {!isLoaded ? <p role="status">{tr('Loading…', 'Chargement…')}</p> : !isSignedIn ? <p><Link href="/sign-in">{tr('Sign in', 'Se connecter')}</Link></p> : <>
      {forbidden ? <p className="notice">{tr('Discovery is for moderators and administrators.', 'La découverte est réservée aux modérateurs et administrateurs.')}</p> : null}
      {error ? <div className="alert reader-error" role="alert"><span>{error}</span><button type="button" className="btn btn-outline" disabled={busy} onClick={() => { request.current?.abort(); setBusy(false); setRetry(value => value + 1); }}>{tr('Reload sources', 'Recharger les sources')}</button></div> : null}
      {!sources && !error && !forbidden ? <p role="status">{tr('Checking access…', 'Vérification de l’accès…')}</p> : null}
      {sources ? <>
        {!sources.enabled ? <section className="card"><h2>{tr('Discovery is not enabled', 'La découverte n’est pas activée')}</h2><p>{tr('The operator must configure a server-only YouTube key and verified channel list. No videos have been imported.', 'L’exploitant doit configurer une clé YouTube côté serveur et une liste de chaînes vérifiées. Aucune vidéo n’a été importée.')}</p></section> : <>
          <p className="notice">{tr('Verify the speaker, copyright holder, permitted use and pastoral content at the original source. Channel names are not author or copyright proof. Nothing is saved, downloaded or published here.', 'Vérifiez l’intervenant, le titulaire des droits, l’usage autorisé et le contenu pastoral sur la source originale. Le nom d’une chaîne ne prouve ni l’auteur ni les droits. Rien n’est enregistré, téléchargé ni publié ici.')}</p>
          <form className="learning-toolbar" onSubmit={e => { e.preventDefault(); void discover(); }}><label className="form-field"><span className="field-label">{tr('Configured channel', 'Chaîne configurée')}</span><select className="select" value={channel} disabled={busy} onChange={e => { setChannel(e.target.value); setData(null); setError(''); }}>{sources.sources.map(source => <option key={source.id} value={source.id}>{source.id}</option>)}</select></label><button className="btn btn-primary" disabled={busy || !channel}>{busy ? tr('Checking videos…', 'Vérification des vidéos…') : tr('Find recent videos', 'Voir les vidéos récentes')}</button></form>
          <p className="muted"><a href={`https://www.youtube.com/channel/${encodeURIComponent(channel)}`} target="_blank" rel="noopener noreferrer">{tr('Check the original channel (new tab)', 'Vérifier la chaîne originale (nouvel onglet)')}</a></p>
        </>}
        {busy ? <p role="status">{tr('Reading current YouTube metadata…', 'Lecture des métadonnées YouTube actuelles…')}</p> : null}
        {data ? <section><h2>{tr('Editorial candidates', 'Pistes éditoriales')}</h2><p className="muted">{tr('Current response only; no candidate list is stored. Playback and rights still need review.', 'Réponse actuelle uniquement ; aucune liste n’est conservée. La lecture et les droits restent à vérifier.')}</p>{!data.items.length ? <p className="notice">{tr('No eligible videos on this page. Nothing has been approved.', 'Aucune vidéo éligible sur cette page. Rien n’a été approuvé.')}</p> : <div className="grid cols-2">{data.items.map(item => <article className="card" key={item.id}><span className="eyebrow">YouTube · {tr('REVIEW REQUIRED', 'À RELIRE')}</span><h3>{item.title}</h3><p>{tr('Channel', 'Chaîne')} : <a href={item.channelUrl} target="_blank" rel="noopener noreferrer">{item.publisher}</a></p><p className="muted">{item.language || tr('Language not supplied', 'Langue non renseignée')} · {item.duration || tr('Duration not supplied', 'Durée non renseignée')}</p>{item.regionRestricted ? <p className="notice">{tr('Regional restrictions reported; check playback for the intended audience.', 'Restrictions géographiques signalées ; vérifiez la lecture pour le public prévu.')}</p> : null}<p>{item.captionsAvailable ? tr('Publisher captions reported; availability still needs checking.', 'Sous-titres signalés ; leur disponibilité reste à vérifier.') : tr('No caption availability confirmed.', 'Disponibilité des sous-titres non confirmée.')}</p><a className="btn btn-outline" href={item.sourceUrl} target="_blank" rel="noopener noreferrer">{tr('Review on YouTube (new tab)', 'Examiner sur YouTube (nouvel onglet)')}</a></article>)}</div>}{data.nextPageToken ? <button type="button" className="btn btn-outline" disabled={busy} onClick={() => void discover(data.nextPageToken!)}>{tr('Next page', 'Page suivante')}</button> : null}</section> : null}
      </> : null}
      <p className="muted"><a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer">{tr('YouTube terms', 'Conditions YouTube')}</a> · <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">{tr('Google privacy policy', 'Confidentialité Google')}</a></p>
    </>}
  </Shell>;
}
