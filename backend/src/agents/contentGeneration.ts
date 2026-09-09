import { Mood, Verse } from '../types';

// --------------------------------------------------------------------------
// Content generation agent
//
// Writes the meditation, reflection question, prayer, and action step
// around a verse that has ALREADY been chosen by the retrieval agent —
// this agent never picks or invents the verse itself.
//
// If ANTHROPIC_API_KEY is not set, this runs in dev-fallback mode: a
// clearly-labeled templated response so the whole pipeline is runnable
// and testable with zero setup. Wire in a real key to see live generation.
// --------------------------------------------------------------------------

export interface GeneratedPieces {
  whyThisVerse: string;
  meditation: string;
  reflectionQuestion: string;
  prayer: string;
  actionStep: string;
  mode: 'live' | 'dev-fallback';
}

const SYSTEM_PROMPT = `You are a warm, theologically careful Christian devotional guide inside an app called LifeBook.
You will be given a mood and a Bible verse that has already been selected — do not change it or cite a different one.
The mood will be one of: grateful, peaceful, seeking, doubting, distant (spiritual dryness — feeling far from God despite still practicing faith), or convicted (aware of sin, moved toward repentance).
Rules:
- Keep language doctrinally mainstream across denominations. No fringe theology, no prosperity-gospel framing.
- Treat doubting, distant, and convicted as normal, well-documented seasons of the Christian life — never respond with alarm, shame, or a tone that implies something is wrong with the person for feeling this way. Doubt and spiritual dryness in particular are common and thoroughly documented in both scripture (the Psalms) and pastoral literature.
- Never diagnose a mental health condition and never claim to replace professional care. If the mood or note suggests real distress, gently weave in a nudge toward a trusted person or professional, without being alarmist.
- Respond ONLY with a single JSON object, no preamble, no markdown code fences. Keys: whyThisVerse (one sentence), meditation (2-3 sentences), reflectionQuestion (one sentence), prayer (2-3 sentences), actionStep (one short practical sentence).`;

export async function generateContent(mood: Mood, verse: Verse, note?: string): Promise<GeneratedPieces> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return devFallback(mood, verse);
  }

  const userPrompt = `Mood: ${mood}${note ? `\nUser note: ${note}` : ''}\nVerse: "${verse.text}" (${verse.reference})\n\nWrite today's content.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 700,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) throw new Error(`Anthropic API returned ${response.status}`);
      const data: any = await response.json();
    const text = (data.content || []).map((b: any) => b.text || '').join('\n');
    const cleaned = text.replace(/```json|```/g, '').trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Could not parse model response as JSON');
    const parsed = JSON.parse(match[0]);
    return { ...parsed, mode: 'live' };
  } catch (err) {
    console.error('[contentGeneration] live call failed, using dev fallback:', err);
    return devFallback(mood, verse);
  }
}

// "Speaks directly to seeking" needs a noun ("doubt", "peace"); "were you
// wrestling with doubt" needs a full clause. One phrase can't grammatically
// serve both sentence shapes, so this is deliberately two maps, not one.
const MOOD_NOUN: Record<Mood, string> = {
  grateful: 'gratitude',
  peaceful: 'peace',
  seeking: 'seeking',
  doubting: 'doubt',
  distant: 'distance from God',
  convicted: 'conviction',
};
const MOOD_STATE: Record<Mood, string> = {
  grateful: 'feeling grateful',
  peaceful: 'feeling peaceful',
  seeking: 'in a season of seeking',
  doubting: 'wrestling with doubt',
  distant: 'feeling distant from God',
  convicted: 'feeling convicted',
};

function devFallback(mood: Mood, verse: Verse): GeneratedPieces {
  const noun = MOOD_NOUN[mood];
  const state = MOOD_STATE[mood];
  return {
    whyThisVerse: `This verse speaks directly to ${noun} — it's one of the passages LifeBook returns to most for that season.`,
    meditation: `Sit for a moment with "${verse.text}" Let the words settle rather than rushing past them. Notice what in your day left you ${state}.`,
    reflectionQuestion: `Where in the last day were you ${state}, and what would it look like to bring that moment to God?`,
    prayer: `Lord, thank You for meeting me in how I actually feel today, not how I think I should feel. Help me carry ${verse.reference} with me. Amen.`,
    actionStep: 'Send a one-line message to someone you trust, just to say hello.',
    mode: 'dev-fallback',
  };
}
