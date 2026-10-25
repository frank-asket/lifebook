import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../lib/app';
import type { PrayerVerse as Verse } from '../../web/lib/prayer-api';
import { Button, Card } from './ui';

/** The passage chosen when the prayer was saved, or helplines when the prayer may signal danger. */
export function PrayerVerse({ verse }: { verse: Verse }) {
  const { c, lang } = useApp();
  const router = useRouter();
  const tr = (en: string, fr: string) => lang === 'fr' ? fr : en;
  if (verse.status === 'crisis') return <Card style={{ gap: 10 }}>
    <View accessibilityRole="alert" style={{ gap: 10 }}>
      <Text style={{ color: c.ink, fontSize: 17, lineHeight: 26 }}>{tr('What you are carrying sounds very heavy, and you are not alone. If you, or someone you are praying for, may be in danger, please contact someone who can help right now.', 'Ce que vous portez semble très lourd, et vous n’êtes pas seul. Si vous, ou la personne pour qui vous priez, êtes peut-être en danger, contactez dès maintenant quelqu’un qui peut aider.')}</Text>
      {verse.contacts.map(contact => <Text key={contact.number} selectable style={{ color: c.ink, fontSize: 16 }}><Text style={{ fontWeight: '700' }}>{contact.number}</Text> · {contact.label}</Text>)}
    </View>
    <Button kind="soft" title={tr('Ask a pastor', 'Demander un pasteur')} onPress={() => router.push('/pastoral-care')} />
  </Card>;
  return <Card style={{ gap: 10 }}>
    <Text accessibilityRole="header" style={{ color: c.muted, fontSize: 13, fontWeight: '700' }}>{tr('A verse for your prayer', 'Un verset pour votre prière')}</Text>
    <Text style={{ color: c.ink, fontSize: 19, lineHeight: 30 }}>{verse.passage.text.replace(/\[\d+\]\s*/g, '').replace(/¶\s*/g, '').trim()}</Text>
    <Text style={{ color: c.deep, fontWeight: '600' }}>{verse.passage.reference} · {verse.locale === 'fr' ? 'Bible J.N. Darby' : 'King James Version'}</Text>
    <Text style={{ color: c.muted, fontSize: 13, lineHeight: 19 }}>{verse.source === 'ai'
      ? tr(`Chosen with AI from LifeBook’s prayer topics${verse.topic ? ` (${verse.topic})` : ''}, as you asked.`, `Choisi avec l’IA parmi les thèmes de prière de LifeBook${verse.topic ? ` (${verse.topic})` : ''}, comme vous l’avez demandé.`)
      : tr(`Chosen from LifeBook’s prayer topics${verse.topic ? ` (${verse.topic})` : ''} by the words of your prayer. Your prayer never leaves LifeBook for this.`, `Choisi parmi les thèmes de prière de LifeBook${verse.topic ? ` (${verse.topic})` : ''} d’après les mots de votre prière. Votre prière ne quitte pas LifeBook pour cela.`)}</Text>
  </Card>;
}
