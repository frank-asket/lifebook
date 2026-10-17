import { BadRequestException, ConflictException, ForbiddenException, Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { crisisContacts, crisisScreen } from './crisis-screen';
import { OpenAiClient } from './openai-client';
import { PrayerCompanionService } from './prayer-companion.service';
import { PrayerService } from './prayer.service';

export const MEDITATION_LIMITS = { perDay: 5, reflectionWords: 120, prayerWords: 100, questionChars: 200 };
type Draft = { safety: 'none' | 'concern' | 'crisis'; passage_ids: string[]; reflection: string; questions: string[]; prayer: string };

const SYSTEM = `You help a Christian app called LifeBook offer a short guided meditation for someone's private prayer concern.
Rules:
- You support personal prayer. Never speak for God, never claim to know God's answer or will, never promise outcomes (healing, provision, success).
- No medical, legal, financial or psychological advice or diagnosis. Where it fits, gently encourage talking with a pastor, trusted friend or professional.
- Never judge the person's faith or worthiness. Warm, plain, humble language. No clichés, no sermonising.
- Choose 1 to 3 passage ids ONLY from the candidate list; never quote or invent Scripture text. LifeBook inserts the verified text.
- reflection: at most ${MEDITATION_LIMITS.reflectionWords} words, connecting the chosen passages to the concern without quoting them.
- questions: 2 or 3 short reflective questions.
- prayer: at most ${MEDITATION_LIMITS.prayerWords} words, first person ("I"), addressed to God, humble and hopeful.
- safety: "crisis" if the person may be at risk of suicide, self-harm, harming others, or is being abused; "concern" for serious distress without immediate risk; otherwise "none".
- Write everything in the language requested.`;

function trimWords(text: string, max: number) {
  const words = text.trim().split(/\s+/);
  if (words.length <= max) return text.trim();
  const cut = words.slice(0, max).join(' ');
  const end = Math.max(cut.lastIndexOf('.'), cut.lastIndexOf('!'), cut.lastIndexOf('?'));
  return end > cut.length * 0.6 ? cut.slice(0, end + 1) : `${cut}…`;
}

/** Guided meditation on a saved prayer: consent, crisis screening, then a structured AI draft built on verified Scripture. */
@Injectable()
export class GuidedMeditationService implements OnModuleDestroy {
  private readonly db = new PrismaClient();
  ai = new OpenAiClient();
  constructor(private readonly prayers: PrayerService, private readonly companion: PrayerCompanionService) {}
  async onModuleDestroy() { await this.db.$disconnect(); }

  private crisis(locale: 'en' | 'fr') {
    return {
      status: 'crisis' as const,
      message: locale === 'fr'
        ? 'Ce que vous traversez semble très lourd. Vous n’êtes pas seul. Nous ne préparons pas de méditation pour cette prière : parlez dès maintenant à quelqu’un qui peut vous aider.'
        : 'What you are carrying sounds very heavy, and you are not alone. We won’t write a meditation for this prayer. Please talk to someone who can help right now.',
      contacts: crisisContacts(locale),
    };
  }
  private log(userId: string, outcome: 'generated' | 'not-generated') {
    // Deliberately coarse: a "crisis" outcome tied to a person would itself be sensitive data.
    return this.db.aiUsage.create({ data: { userId, feature: 'meditation', outcome } });
  }

  async generate(auth: string | undefined, prayerId: string, input: Record<string, unknown>) {
    const userId = await this.prayers.userId(auth);
    if (input.consent !== true) throw new BadRequestException('Please confirm you want this prayer sent for guided meditation');
    const locale: 'en' | 'fr' = input.locale === 'fr' ? 'fr' : 'en';
    const profile = await this.db.faithProfile.findUnique({ where: { userId }, select: { aiProcessingConsent: true } });
    if (!profile?.aiProcessingConsent) throw new ForbiddenException('Optional AI processing is turned off in your preferences');
    const body = await this.prayers.ownedBody(userId, prayerId);
    const since = new Date(Date.now() - 86400000);
    if (await this.db.aiUsage.count({ where: { userId, feature: 'meditation', createdAt: { gte: since } } }) >= MEDITATION_LIMITS.perDay) {
      throw new ConflictException(`You can ask for ${MEDITATION_LIMITS.perDay} guided meditations a day. Please come back tomorrow.`);
    }
    const candidates = this.companion.candidates();

    // Our own screen first, then the provider's moderation, before any text is generated.
    if (crisisScreen(body) || await this.ai.flagsRisk(body)) { await this.log(userId, 'not-generated'); return this.crisis(locale); }

    const allIds = [...new Set(candidates.flatMap(c => c.passages))];
    const draft = await this.ai.structured<Draft>({
      model: process.env.OPENAI_MODEL?.trim() || 'gpt-4.1-mini', maxTokens: 900, schemaName: 'guided_meditation', system: SYSTEM,
      user: `Language: ${locale === 'fr' ? 'French' : 'English'}\n\nCandidate passages by theme:\n${candidates.map(c => `- ${c.title} (${c.description}): ${c.passages.join(', ')}`).join('\n')}\n\nPrayer concern:\n"""\n${body}\n"""`,
      schema: {
        type: 'object', additionalProperties: false, required: ['safety', 'passage_ids', 'reflection', 'questions', 'prayer'],
        properties: {
          safety: { type: 'string', enum: ['none', 'concern', 'crisis'] },
          passage_ids: { type: 'array', items: { type: 'string', enum: allIds } },
          reflection: { type: 'string' }, questions: { type: 'array', items: { type: 'string' } }, prayer: { type: 'string' },
        },
      },
    });
    if (draft.safety === 'crisis') { await this.log(userId, 'not-generated'); return this.crisis(locale); }

    // Never trust the shape blindly: keep only library passages and enforce limits.
    const ids = [...new Set(draft.passage_ids.filter(id => allIds.includes(id)))].slice(0, 3);
    const questions = draft.questions.map(q => q.trim()).filter(Boolean).slice(0, 3).map(q => q.slice(0, MEDITATION_LIMITS.questionChars));
    if (!ids.length || questions.length < 2 || !draft.reflection.trim() || !draft.prayer.trim()) {
      await this.log(userId, 'not-generated');
      throw new ConflictException('Guided meditation could not be written for this prayer. Please try again.');
    }
    const meditation = {
      locale, passages: await this.companion.resolve(locale, ids),
      reflection: trimWords(draft.reflection, MEDITATION_LIMITS.reflectionWords), questions,
      prayer: trimWords(draft.prayer, MEDITATION_LIMITS.prayerWords), concern: draft.safety === 'concern',
    };
    await this.prayers.saveMeditation(userId, prayerId, meditation);
    await this.log(userId, 'generated');
    return { status: 'ok' as const, meditation };
  }
}
