import { SiteFrame } from './site-frame';

/** Review-stage pages stay explicitly unapproved until the owner approves final legal text. */
export function LegalOverview({ locale = 'en', document }: { locale?: 'en' | 'fr'; document: 'privacy' | 'terms' }) {
  const french = locale === 'fr';
  const privacy = document === 'privacy';
  const heading = privacy ? (french ? 'Confidentialité chez LifeBook' : 'Privacy at LifeBook') : (french ? 'Conditions d’utilisation' : 'Terms of use');
  const sections = privacy ? (french ? [
    ['Notre démarche', 'LifeBook traite les prières et les préférences liées à la foi comme des informations sensibles. Vous devez pouvoir comprendre quelles données sont utilisées et pourquoi.'],
    ['Prière et personnalisation', 'Vos prières restent privées par défaut. Le traitement facultatif par l’IA nécessite un choix distinct. Vos écrits privés ne servent pas à déduire votre maturité spirituelle ou votre vocation.'],
  ] : [
    ['Our approach', 'LifeBook treats prayer entries and faith-related preferences as sensitive information. You should be able to understand what is collected and how it is used.'],
    ['Prayer and personalization', 'Prayer content remains private by default. Optional AI processing requires a separate choice. Private writing is not used to infer spiritual maturity or pastoral calling.'],
  ]) : (french ? [
    ['Notre objectif', 'LifeBook accompagne la lecture biblique, la prière et l’apprentissage chrétien. Il ne remplace pas une communauté pastorale, des soins médicaux ou psychologiques, ni les services d’urgence.'],
    ['Contenus et Écritures', 'Les traductions bibliques et les médias tiers restent soumis aux droits et licences de leurs ayants droit. Les conditions définitives préciseront les règles relatives aux contenus transmis.'],
  ] : [
    ['Our purpose', 'LifeBook supports Bible engagement, prayer, and Christian learning. It does not replace pastoral community, medical or mental-health care, or emergency services.'],
    ['Content and Scripture', 'Scripture translations and third-party media remain subject to their respective rights and licenses. The final terms will explain the rules for submitted content.'],
  ]);
  return <SiteFrame locale={locale}><main className="legal-page"><div className="container legal-content">
    <span className="eyebrow">{french ? 'AVANT LE LANCEMENT' : 'BEFORE LAUNCH'}</span>
    <h1>{heading}</h1>
    <p className="legal-notice">{french ? 'Cet aperçu avant lancement n’est pas une politique ou des conditions juridiques définitives. Le texte complet doit être validé avant l’accueil du public.' : 'This pre-launch overview is not a final privacy policy or legal terms. The complete text must be approved before public launch.'}</p>
    {sections.map(([title, text]) => <section key={title}><h2>{title}</h2><p>{text}</p></section>)}
    <h2>Contact</h2>
    <p>Franck Asket · <a href="mailto:lifebook.meditation@gmail.com">lifebook.meditation@gmail.com</a></p>
  </div></main></SiteFrame>;
}
