import { relations } from 'drizzle-orm';
import { boolean, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  fullName: text('full_name'),
  faithSeason: text('faith_season'),
  translation: text('translation').default('ESV'),
  dailyQuietTime: text('daily_quiet_time').default('Morning 7:00 AM'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const journalEntries = pgTable('journal_entries', {
  id: serial('id').primaryKey(),
  userUid: text('user_uid')
    .references(() => users.uid)
    .notNull(),
  mood: text('mood').notNull(),
  content: text('content').notNull(),
  verseRef: text('verse_ref'),
  verseText: text('verse_text'),
  date: text('date').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const scriptureNotes = pgTable('scripture_notes', {
  id: serial('id').primaryKey(),
  userUid: text('user_uid')
    .references(() => users.uid)
    .notNull(),
  verseRef: text('verse_ref').notNull(),
  translation: text('translation').notNull().default('ESV'),
  verseText: text('verse_text').notNull(),
  marginNote: text('margin_note').notNull(),
  sourceContext: text('source_context'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const teacherQuestions = pgTable('teacher_questions', {
  id: serial('id').primaryKey(),
  teacherSlug: text('teacher_slug').notNull(),
  userUid: text('user_uid')
    .references(() => users.uid)
    .notNull(),
  authorName: text('author_name').notNull(),
  requestType: text('request_type').notNull(),
  content: text('content').notNull(),
  pastoralReply: text('pastoral_reply'),
  amenCount: integer('amen_count').notNull().default(1),
  createdAt: timestamp('created_at').defaultNow(),
});

export const communityPrayers = pgTable('community_prayers', {
  id: serial('id').primaryKey(),
  userUid: text('user_uid')
    .references(() => users.uid)
    .notNull(),
  authorName: text('author_name').notNull(),
  lifeSeason: text('life_season').notNull(),
  content: text('content').notNull(),
  scriptureAnchor: text('scripture_anchor'),
  prayingCount: integer('praying_count').notNull().default(1),
  isTestimony: boolean('is_testimony').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  journalEntries: many(journalEntries),
  scriptureNotes: many(scriptureNotes),
  teacherQuestions: many(teacherQuestions),
  communityPrayers: many(communityPrayers),
}));

export const journalEntriesRelations = relations(journalEntries, ({ one }) => ({
  author: one(users, {
    fields: [journalEntries.userUid],
    references: [users.uid],
  }),
}));

export const scriptureNotesRelations = relations(scriptureNotes, ({ one }) => ({
  author: one(users, {
    fields: [scriptureNotes.userUid],
    references: [users.uid],
  }),
}));

export const teacherQuestionsRelations = relations(teacherQuestions, ({ one }) => ({
  author: one(users, {
    fields: [teacherQuestions.userUid],
    references: [users.uid],
  }),
}));

export const communityPrayersRelations = relations(communityPrayers, ({ one }) => ({
  author: one(users, {
    fields: [communityPrayers.userUid],
    references: [users.uid],
  }),
}));
