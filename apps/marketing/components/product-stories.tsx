import { content, type Locale } from '../lib/content';
import { BookIcon, SunIcon, ArrowIcon, LockIcon } from './icons';

/** Examples explain the experience without presenting unpublished lessons or unlicensed media as available. */
export function ProductStories({ locale }: { locale: Locale }) {
  const t = content[locale];
  const fr = locale === 'fr';
  const stories = [
    { feature: t.features.groups[1].items[3], icon: <SunIcon />, kind: 'meditate', name: fr ? 'Méditation' : 'Meditation', text: fr ? 'Faites une pause autour d’un passage, puis prenez le temps d’y répondre.' : 'Pause with a passage, then take a little time to respond.', parts: t.screens.steps.slice(1, 4) },
    { feature: t.features.groups[0].items[5], icon: <BookIcon />, kind: 'study', name: fr ? 'Étude biblique' : 'Bible Study', text: fr ? 'Lisez dans le contexte, posez vos questions et approfondissez le sens.' : 'Read in context, ask questions and explore what the passage means.', parts: fr ? ['Lire le passage', 'Comprendre le contexte', 'Mettre en pratique'] : ['Read the passage', 'Understand the context', 'Put it into practice'] },
    { feature: t.features.groups[2].items[2], icon: <BookIcon />, kind: 'livingword', name: 'LivingWord', text: fr ? 'Un espace pour des enseignements dont les sources, les droits et le contenu sont vérifiés avant publication.' : 'A home for teachings with sources, permissions and content checked before publication.', parts: fr ? ['Source identifiée', 'Droits vérifiés', 'Relecture pastorale'] : ['Source identified', 'Permissions checked', 'Pastoral review'] },
    { feature: t.features.groups[2].items[1], icon: <ArrowIcon />, kind: 'path', name: fr ? 'Parcours de formation' : 'Learning Paths', text: fr ? 'Explorez les fondements de la foi, une leçon après l’autre. Aucun classement de votre foi.' : 'Explore the foundations of faith, one lesson at a time. Your faith is never ranked.', parts: fr ? ['Découvrir', 'Réfléchir', 'Grandir'] : ['Discover', 'Reflect', 'Grow'] },
  ];
  return <section className="section product-stories" id="explore" aria-labelledby="explore-title">
    <div className="container">
      <header className="stories-heading"><div><p className="eyebrow">{fr ? 'Découvrez LifeBook' : 'A closer look at LifeBook'}</p><h2 id="explore-title">{fr ? 'Un espace pour chaque' : 'Space for every'}{' '}<em>{fr ? 'pas.' : 'step.'}</em></h2></div><p>{fr ? 'Commencez par la Bible et la prière. Nos bibliothèques de contenus grandissent au fil des relectures.' : 'Begin with Scripture and prayer. Our content libraries grow as each resource is reviewed.'}</p></header>
      <div className="story-grid">{stories.map(story => <article className={`story-card story-${story.kind}`} key={story.kind}><div className="story-inner">
        <div className="story-card-head"><span className="story-symbol" aria-hidden="true">{story.icon}</span><span className={`status-chip chip-${story.feature.status}`}>{t.status[story.feature.status]}</span></div>
        <div className="story-copy"><h3>{story.name}</h3><p>{story.text}</p></div>
        <div className="story-visual" aria-hidden="true">
          {story.kind === 'meditate' ? <><span className="story-caption">{t.screens.ref} · {t.screens.translation}</span><blockquote>{t.screens.verse}</blockquote><span className="story-caption">{story.parts.join(' · ')}</span></> : <><span className="story-caption">{fr ? 'Le cheminement' : 'The experience'}</span><ol>{story.parts.map((part, i) => <li key={part}><span className="story-step">{i + 1}</span>{part}{story.kind === 'livingword' && <LockIcon size={14} />}</li>)}</ol></>}
        </div>
      </div></article>)}</div>
      <p className="stories-footnote">{fr ? 'Exemples de parcours. Les contenus en préparation ne sont pas encore disponibles.' : 'Illustrations of the experience. Content marked as being prepared is not yet available.'} <a href="#features">{fr ? 'Voir toutes les fonctionnalités et leur statut' : 'See every feature and its status'} <ArrowIcon size={14} /></a></p>
    </div>
  </section>;
}
