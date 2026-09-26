import { desc, eq, sql } from 'drizzle-orm';
import { db } from './index.ts';
import {
  communityPrayers,
  journalEntries,
  scriptureNotes,
  teacherQuestions,
} from './schema.ts';
import { getOrCreateUser } from './users.ts';

export async function getTeacherQuestionsBySlug(teacherSlug: string) {
  try {
    return await db
      .select()
      .from(teacherQuestions)
      .where(eq(teacherQuestions.teacherSlug, teacherSlug))
      .orderBy(desc(teacherQuestions.createdAt));
  } catch (error) {
    console.error('Database query failed in getTeacherQuestionsBySlug:', error);
    throw new Error('Failed to load pastoral questions. Please try again later.', { cause: error });
  }
}

export async function createTeacherQuestion(data: {
  teacherSlug: string;
  userUid: string;
  email: string;
  authorName: string;
  requestType: string;
  content: string;
  pastoralReply?: string;
}) {
  try {
    await getOrCreateUser(data.userUid, data.email, data.authorName);
    const result = await db
      .insert(teacherQuestions)
      .values({
        teacherSlug: data.teacherSlug,
        userUid: data.userUid,
        authorName: data.authorName,
        requestType: data.requestType,
        content: data.content,
        pastoralReply: data.pastoralReply || null,
        amenCount: 1,
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Database query failed in createTeacherQuestion:', error);
    throw new Error('Failed to submit your pastoral question. Please try again later.', { cause: error });
  }
}

export async function incrementTeacherQuestionAmen(questionId: number) {
  try {
    const result = await db
      .update(teacherQuestions)
      .set({
        amenCount: sql`${teacherQuestions.amenCount} + 1`,
      })
      .where(eq(teacherQuestions.id, questionId))
      .returning();
    return result[0];
  } catch (error) {
    console.error('Database query failed in incrementTeacherQuestionAmen:', error);
    throw new Error('Failed to record prayer encouragement. Please try again later.', { cause: error });
  }
}

export async function getCommunityPrayers(lifeSeason?: string) {
  try {
    if (lifeSeason && lifeSeason !== 'All') {
      return await db
        .select()
        .from(communityPrayers)
        .where(eq(communityPrayers.lifeSeason, lifeSeason))
        .orderBy(desc(communityPrayers.createdAt));
    }
    return await db
      .select()
      .from(communityPrayers)
      .orderBy(desc(communityPrayers.createdAt));
  } catch (error) {
    console.error('Database query failed in getCommunityPrayers:', error);
    throw new Error('Failed to load community prayers. Please try again later.', { cause: error });
  }
}

export async function createCommunityPrayer(data: {
  userUid: string;
  email: string;
  authorName: string;
  lifeSeason: string;
  content: string;
  scriptureAnchor?: string;
  isTestimony?: boolean;
}) {
  try {
    await getOrCreateUser(data.userUid, data.email, data.authorName);
    const result = await db
      .insert(communityPrayers)
      .values({
        userUid: data.userUid,
        authorName: data.authorName,
        lifeSeason: data.lifeSeason,
        content: data.content,
        scriptureAnchor: data.scriptureAnchor || null,
        prayingCount: 1,
        isTestimony: Boolean(data.isTestimony),
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Database query failed in createCommunityPrayer:', error);
    throw new Error('Failed to share prayer request. Please try again later.', { cause: error });
  }
}

export async function incrementCommunityPrayerCount(prayerId: number) {
  try {
    const result = await db
      .update(communityPrayers)
      .set({
        prayingCount: sql`${communityPrayers.prayingCount} + 1`,
      })
      .where(eq(communityPrayers.id, prayerId))
      .returning();
    return result[0];
  } catch (error) {
    console.error('Database query failed in incrementCommunityPrayerCount:', error);
    throw new Error('Failed to update prayer count. Please try again later.', { cause: error });
  }
}

export async function getUserScriptureNotes(userUid: string) {
  try {
    return await db
      .select()
      .from(scriptureNotes)
      .where(eq(scriptureNotes.userUid, userUid))
      .orderBy(desc(scriptureNotes.createdAt));
  } catch (error) {
    console.error('Database query failed in getUserScriptureNotes:', error);
    throw new Error('Failed to fetch Scripture study notes. Please try again later.', { cause: error });
  }
}

export async function createScriptureNote(data: {
  userUid: string;
  email: string;
  authorName?: string;
  verseRef: string;
  translation: string;
  verseText: string;
  marginNote: string;
  sourceContext?: string;
  saveToJournal?: boolean;
}) {
  try {
    await getOrCreateUser(data.userUid, data.email, data.authorName);
    const noteResult = await db
      .insert(scriptureNotes)
      .values({
        userUid: data.userUid,
        verseRef: data.verseRef,
        translation: data.translation,
        verseText: data.verseText,
        marginNote: data.marginNote,
        sourceContext: data.sourceContext || null,
      })
      .returning();

    if (data.saveToJournal) {
      await db.insert(journalEntries).values({
        userUid: data.userUid,
        mood: 'Peaceful',
        content: `${data.marginNote}\n\n— Meditating on ${data.verseRef} (${data.translation})`,
        verseRef: data.verseRef,
        verseText: data.verseText,
        date: new Date().toISOString().split('T')[0],
      });
    }

    return noteResult[0];
  } catch (error) {
    console.error('Database query failed in createScriptureNote:', error);
    throw new Error('Failed to save Scripture margin note. Please try again later.', { cause: error });
  }
}

export async function getUserJournalEntries(userUid: string) {
  try {
    return await db
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.userUid, userUid))
      .orderBy(desc(journalEntries.createdAt));
  } catch (error) {
    console.error('Database query failed in getUserJournalEntries:', error);
    throw new Error('Failed to load journal entries. Please try again later.', { cause: error });
  }
}
