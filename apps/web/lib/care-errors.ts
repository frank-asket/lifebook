// Shown in the member's language: the API and lib/api.ts only return English messages.
type Ui = 'en' | 'fr';

export const SIGN_IN_AGAIN = 'Please sign in again.';

const french: Record<string, string> = {
  [SIGN_IN_AGAIN]: 'Reconnectez-vous.',
  'Cannot connect to LifeBook right now. Please check your connection and try again.': 'Impossible de joindre LifeBook pour le moment. Vérifiez votre connexion et réessayez.',
  'LifeBook is temporarily unavailable. Please try again later.': 'LifeBook est momentanément indisponible. Réessayez plus tard.',
  'LifeBook is temporarily unavailable. Please try again shortly.': 'LifeBook est momentanément indisponible. Réessayez dans un instant.',
  'Too many requests. Please wait a moment and try again.': 'Trop de demandes. Patientez un instant puis réessayez.',
  'We could not load this content. Please try again shortly.': 'Impossible de charger ce contenu. Réessayez dans un instant.',
  'The requested content could not be found.': 'Le contenu demandé est introuvable.',
  'This conversation cannot be opened right now': 'Cette conversation ne peut pas être ouverte pour le moment.',
  'Consent is required to share this with a pastor': 'Votre accord est nécessaire pour partager ce message avec un pasteur.',
  'Enter a phone number with country code, e.g. +233 20 000 0000': 'Saisissez un numéro avec l’indicatif du pays, par ex. +233 20 000 0000.',
  'A phone number is only used for a callback': 'Le numéro de téléphone sert uniquement pour un rappel.',
  'You already have two open requests. Close one before asking again.': 'Vous avez déjà deux demandes en cours. Terminez-en une pour en faire une nouvelle.',
  'This conversation is closed': 'Cette conversation est terminée.',
  'Request not found': 'Demande introuvable.',
  'Only active, verified pastors can do this': 'Seuls les pasteurs vérifiés et actifs peuvent faire cela.',
  'Turn on “accepting requests” before claiming': 'Activez « J’accepte de nouvelles demandes » avant de prendre une demande.',
  'You cannot take your own request': 'Vous ne pouvez pas prendre votre propre demande.',
  'This request is in a language you have not listed': 'Cette demande est dans une langue que vous n’avez pas indiquée.',
  'Another pastor has already taken this request': 'Un autre pasteur a déjà pris cette demande.',
  'Choose what the concern is about': 'Choisissez l’objet du signalement.',
  'Say whether to share the conversation': 'Indiquez si la conversation doit être partagée.',
  'You have sent several reports today. If someone is in danger, call 112 now.': 'Vous avez déjà envoyé plusieurs signalements aujourd’hui. Si quelqu’un est en danger, appelez le 112 maintenant.',
  'Only the safeguarding lead can open this': 'Seul le référent protection peut ouvrir ceci.',
  'Report not found': 'Signalement introuvable.',
  'Pastor not found': 'Pasteur introuvable.',
  'Describe how the report was resolved': 'Décrivez comment le signalement a été résolu.',
  'This report is already resolved': 'Ce signalement est déjà résolu.',
  'This report is not waiting for acknowledgement': 'Ce signalement n’attend pas de prise en compte.',
  'Give a reason for the suspension': 'Indiquez le motif de la suspension.',
  'You cannot suspend yourself': 'Vous ne pouvez pas vous suspendre vous-même.',
};
const generic = { en: 'Something went wrong. Please try again.', fr: 'Une erreur est survenue. Veuillez réessayer.' };

/** Turns a thrown API or network error into text for the current UI language. */
export function careErrorMessage(error: unknown, ui: Ui): string {
  const raw = error && typeof error === 'object' && 'message' in error ? (error as { message: unknown }).message : null;
  const message = typeof raw === 'string' ? raw.trim() : '';
  if (!message) return generic[ui];
  if (ui === 'en') return message;
  if (french[message]) return french[message];
  const limit = /^You already have (\d+) open conversations, your limit$/.exec(message);
  if (limit) return `Vous avez déjà ${limit[1]} conversations ouvertes, votre limite.`;
  return generic.fr;
}
