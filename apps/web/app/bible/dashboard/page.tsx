'use client';
import Link from 'next/link';
import { BookOpen, CalendarDays, ArrowRight, ChartNoAxesCombined } from 'lucide-react';
import { Shell } from '../../../components/shell';
import { useLanguage } from '../../../components/language-provider';
import { ContinueReading } from '../../../components/bible/ContinueReading';
export default function BibleReadingDashboard() {
  const { language } = useLanguage();
  const tr = (en:string, fr:string) => language === 'fr' ? fr : en;
  return <Shell title={tr('My Bible Reading','Ma lecture biblique')}>
    <div className="page-intro"><span className="eyebrow">{tr('A LITTLE EACH DAY','UN PEU CHAQUE JOUR')}</span><h1 className="page-heading">{tr('Your reading journey','Votre parcours de lecture')}</h1><p className="subheading">{tr('Find your place in Scripture. Read at your own pace, follow a plan, or pick up where you left off.','Trouvez votre place dans les Écritures. Lisez à votre rythme, suivez un plan ou reprenez votre lecture.')}</p></div>
    <ContinueReading locale={language}/>
    <div className="reading-entry-grid">{[
      {href:`/bible/read?locale=${language}`,icon:BookOpen,title:tr('Open the Bible','Ouvrir la Bible'),description:tr('Choose a book and make space for the Word.','Choisissez un livre et faites place à la Parole.')},
      {href:'/bible/plans',icon:CalendarDays,title:tr('Find a reading plan','Trouver un plan de lecture'),description:tr('Build a gentle rhythm with guided daily readings.','Cultivez un rythme régulier avec des lectures guidées.')},
      {href:'/bible/my-reading',icon:ChartNoAxesCombined,title:tr('See your progress','Voir votre progression'),description:tr('Revisit recent chapters and continue your plans.','Retrouvez vos chapitres récents et poursuivez vos plans.')}
    ].map(({href,icon:Icon,title,description})=><Link className="card" href={href} key={href}><Icon size={26} aria-hidden="true"/><h2>{title}</h2><p>{description}</p><span className="text-link icon-line">{tr('Explore','Découvrir')} <ArrowRight size={16}/></span></Link>)}</div>
  </Shell>;
}
