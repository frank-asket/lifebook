// Deliberately over-inclusive: a false alarm shows helplines instead of a meditation, which is the safe failure.
const patterns: RegExp[] = [
  // English
  /\b(kill(ing)?|hurt(ing)?|harm(ing)?|cut(ting)?) (my ?self|myself)\b/, /\bsuicid(e|al)\b/, /\bend (it all|my life)\b/, /\btake my (own )?life\b/,
  /\b(want|wanted|wish) to die\b/, /\bwish i (was|were) dead\b/, /\bbetter off dead\b/, /\b(don'?t|do not) want to (live|be alive|wake up)\b/,
  /\bno (reason|point) (to|in) (live|living)\b/, /\bself[- ]?harm\b/, /\boverdos(e|ing)\b/,
  /\bkill (him|her|them|someone|somebody)\b/, /\b(he|she|they) (hits?|beats?|hurts?) me\b/, /\b(raped|rape|molest(ed|ing)?|sexually abused|being abused)\b/,
  // English warning signs without explicit wording (found by the evaluation)
  /\b(goodbye|farewell) (letters?|notes?|messages?)\b/, /\bletters? to (my|our) (family|children|kids|wife|husband|parents)\b.*\b(after|understand|forgive)/,
  /\bgiv(e|ing|en) (away )?(all )?(my|away my) (things|belongings|possessions|stuff)\b/, /\bgiving (my )?(things|belongings|stuff) away\b/,
  /\bbetter off without me\b/, /\b(won'?t|will not) be (a (problem|burden)|around|here)( for (them|anyone))?( much)? longer\b/,
  /\b(make|stop) the pain (stop|for good)\b/, /\bmake the pain stop\b/, /\bstop being here\b/, /\bnever wake up\b/, /\bnot wake up (again|tomorrow)\b/,
  /\bsav(e|ed|ing) (up )?(all )?(my )?([a-z]+ )?(pills|tablets|medication|medicine|meds)\b/,
  // French (accents removed before matching)
  /\bsuicid(e|aire|er)\b/, /\bme suicider\b/, /\bmettre fin a (mes jours|ma vie)\b/, /\ben finir\b/, /\b(envie de|veux|voudrais) mourir\b/,
  /\bplus envie de vivre\b/, /\blettres? d'adieu\b/, /\bmieux sans moi\b/, /\bplus (un poids|un fardeau)\b/, /\bne plus (jamais )?me reveiller\b/,
  /\bque la douleur s'arrete\b/, /\bdisparaitre pour (toujours|de bon)\b/, /\b(mis de cote|garde|stocke) (tous )?mes (medicaments|cachets|comprimes)\b/, /\bdonne (toutes )?mes affaires\b/, /\bme (tuer|faire du mal|mutiler|scarifier)\b/, /\b(le|la|les) tuer\b/,
  /\b(il|elle|ils) me (frappe|frappent|bat|battent)\b/, /\b(violee?|viol|abus sexuels?|agressee? sexuellement)\b/,
];

export function crisisScreen(text: string): boolean {
  const normalized = text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, "'");
  return patterns.some(p => p.test(normalized));
}

/** High-confidence numbers only (see docs/M3.7_CRISIS_CONTACTS_DRAFT.md); local verification is still pending. */
export function crisisContacts(locale: 'en' | 'fr') {
  return locale === 'fr'
    ? [{ label: 'Urgence (danger immédiat)', number: '112' }, { label: 'Prévention du suicide, 24 h/24, gratuit (France)', number: '3114' }, { label: 'Ghana : ligne de soutien psychologique', number: '0800 678 678' }]
    : [{ label: 'Emergency (immediate danger)', number: '112' }, { label: 'Ghana: Mental Health Authority helpline', number: '0800 678 678' }, { label: 'France: suicide prevention, 24/7, free', number: '3114' }];
}
