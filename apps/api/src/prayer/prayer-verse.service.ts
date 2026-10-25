import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { crisisContacts, crisisScreen } from './crisis-screen';
import { OpenAiClient } from './openai-client';
import { PrayerCompanionService } from './prayer-companion.service';

export const VERSE_LIMITS = { aiPerDay: 20 };
type Locale = 'en' | 'fr';
type AiLike = Pick<OpenAiClient, 'flagsRisk' | 'structured'>;

/** What is kept, encrypted, with the prayer. Scripture is the verified text from the topic library's translation. */
export type StoredVerse =
  | { status: 'ok'; locale: Locale; source: 'keywords' | 'ai'; topicId: string; passage: { id: string; reference: string; text: string; copyright: string | null } }
  | { status: 'crisis'; locale: Locale };

const SYSTEM = `You help a Christian app called LifeBook show one Bible passage under someone's private prayer.
Rules:
- Choose exactly one passage id ONLY from the candidate list; never quote or invent Scripture. LifeBook inserts the verified text.
- Choose the passage that best meets the person where they are. Never imply God's specific answer or promise an outcome.
- safety: "crisis" if the person may be at risk of suicide, self-harm, harming others, or is being abused or controlled, including indirect warning signs (farewells, giving things away, feeling a burden, wanting the pain to stop for good). When unsure, choose "crisis". Otherwise "none".`;

/** One AI choice from the candidates, after the provider's moderation. Returns null when the answer is unusable. */
export async function aiPick(ai: AiLike, candidates: { title: string; description: string; passages: string[] }[], body: string): Promise<'crisis' | string | null> {
  if (await ai.flagsRisk(body)) return 'crisis';
  const ids = [...new Set(candidates.flatMap(c => c.passages))];
  const result = await ai.structured<{ safety: 'none' | 'crisis'; passage_id: string }>({
    model: process.env.OPENAI_MODEL?.trim() || 'gpt-4.1-mini', maxTokens: 60, schemaName: 'prayer_verse', system: SYSTEM,
    user: `Candidate passages by theme:\n${candidates.map(c => `- ${c.title} (${c.description}): ${c.passages.join(', ')}`).join('\n')}\n\nPrayer:\n"""\n${body}\n"""`,
    schema: { type: 'object', additionalProperties: false, required: ['safety', 'passage_id'], properties: { safety: { type: 'string', enum: ['none', 'crisis'] }, passage_id: { type: 'string', enum: ids } } },
  });
  if (result.safety === 'crisis') return 'crisis';
  return ids.includes(result.passage_id) ? result.passage_id : null;
}

/**
 * Picks a passage for a newly written prayer. The crisis screen runs first for everyone: a prayer that may signal
 * danger gets helplines instead of a verse. The AI chooses from the topic library only when the member turned on
 * optional AI processing AND asked for it on this prayer (`allowAi`, the prayer's own consent, as onboarding
 * promises), up to VERSE_LIMITS.aiPerDay a day. Everyone else, and any AI failure, gets the keyword match, which
 * never leaves our server. Scripture only ever comes from the library's passages.
 */
@Injectable()
export class PrayerVerseService implements OnModuleDestroy {
  private readonly db = new PrismaClient();
  ai: AiLike = new OpenAiClient(undefined, 15000);
  constructor(private readonly companion: PrayerCompanionService) {}
  async onModuleDestroy() { await this.db.$disconnect(); }

  /** Null when the topic library isn't available here (it stays off in production until reviewed). */
  async choose(userId: string, prayerId: string, body: string, locale: Locale, allowAi = false): Promise<StoredVerse | null> {
    if (!this.companion.available()) return null;
    if (crisisScreen(body)) return { status: 'crisis', locale };
    let source: 'keywords' | 'ai' = 'keywords';
    let pick = this.companion.keywordPick(body, locale, prayerId);
    if (allowAi && await this.aiAllowed(userId)) {
      let outcome: 'generated' | 'not-generated' = 'not-generated';
      try {
        const chosen = await aiPick(this.ai, this.companion.candidates(), body);
        // Deliberately coarse, as for guided meditation: a "crisis" outcome tied to a person would itself be sensitive.
        if (chosen === 'crisis') { await this.log(userId, outcome); return { status: 'crisis', locale }; }
        if (chosen) { pick = { ...pick, passageId: chosen, topicId: this.companion.topicOf(chosen) ?? pick.topicId }; source = 'ai'; outcome = 'generated'; }
      } catch { /* fall back to the keyword match */ }
      await this.log(userId, outcome);
    }
    const [passage] = await this.companion.resolve(locale, [pick.passageId]);
    return { status: 'ok', locale, source, topicId: pick.topicId, passage };
  }

  /** The verse as members see it: the topic's title in their language, and helplines for a crisis. */
  present(verse: StoredVerse) {
    if (verse.status === 'crisis') return { ...verse, contacts: crisisContacts(verse.locale) };
    return { ...verse, topic: this.companion.topicTitle(verse.topicId, verse.locale) };
  }

  private async aiAllowed(userId: string) {
    if (!process.env.OPENAI_API_KEY?.trim()) return false;
    const profile = await this.db.faithProfile.findUnique({ where: { userId }, select: { aiProcessingConsent: true } });
    if (!profile?.aiProcessingConsent) return false;
    const since = new Date(Date.now() - 86400000);
    return await this.db.aiUsage.count({ where: { userId, feature: 'prayer-verse', createdAt: { gte: since } } }) < VERSE_LIMITS.aiPerDay;
  }
  private log(userId: string, outcome: 'generated' | 'not-generated') {
    return this.db.aiUsage.create({ data: { userId, feature: 'prayer-verse', outcome } });
  }
}
