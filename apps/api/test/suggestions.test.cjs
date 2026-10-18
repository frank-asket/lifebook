// Run after pnpm --filter @lifebook/api build. No database or network.
const { test } = require('node:test');
const assert = require('node:assert/strict');
require('reflect-metadata');
const { suggest, GOAL_CODES, MAX_SUGGESTIONS } = require('../dist/suggestions/suggestion-rules');
const { SuggestionsService } = require('../dist/suggestions/suggestions.service');
const { READING_PLANS } = require('../dist/bible-reading/bible-reading.service');

const base = { consent: true, journey: null, goals: [], enrolledPlanIds: [], prayerCount: 3, completedDaysLast7: 5 };
const ids = input => suggest({ ...base, ...input }).map(s => s.id);

test('nothing without consent, whatever was chosen', () => {
  assert.deepEqual(suggest({ ...base, consent: false, goals: Object.keys(GOAL_CODES), journey: 'EXPLORING', prayerCount: 0, completedDaysLast7: 0 }), []);
});

test('goals and early journeys map to the existing reading plans, with the reason shown', () => {
  assert.deepEqual(ids({ goals: ['Learn about Jesus'] }), ['plan:discover-jesus']);
  assert.deepEqual(suggest({ ...base, journey: 'EXPLORING' })[0].reason, { type: 'journey', journey: 'EXPLORING' });
  assert.deepEqual(ids({ journey: 'NEW_BELIEVER' }), ['plan:discover-jesus']);
  assert.deepEqual(ids({ journey: 'GROWING_BELIEVER' }), []);
  assert.deepEqual(ids({ goals: ['Grow in faith'] }), ['plan:foundations-of-faith']);
  assert.deepEqual(suggest({ ...base, goals: ['Grow in faith'] })[0].reason, { type: 'goal', goal: 'Grow in faith' });
  assert.deepEqual(ids({ goals: ['Develop consistency'] }), ['plan:walking-with-god']);
  // A goal beats the journey as the reason when both point to the same plan.
  assert.deepEqual(suggest({ ...base, journey: 'EXPLORING', goals: ['Learn about Jesus'] })[0].reason, { type: 'goal', goal: 'Learn about Jesus' });
});

test('plans already started or finished are never suggested', () => {
  assert.deepEqual(ids({ goals: ['Learn about Jesus', 'Grow in faith'], enrolledPlanIds: ['discover-jesus'] }), ['plan:foundations-of-faith']);
});

test('prayer suggestions only when they would help', () => {
  assert.deepEqual(ids({ goals: ['Build a daily prayer habit'], prayerCount: 0 }), ['prayer-journal']);
  assert.deepEqual(ids({ goals: ['Build a daily prayer habit'], prayerCount: 2, completedDaysLast7: 1 }), ['short-prayer-time']);
  assert.deepEqual(ids({ goals: ['Build a daily prayer habit'], prayerCount: 2, completedDaysLast7: 2 }), []);
});

test('custom goals and goals with no content yet suggest nothing', () => {
  assert.deepEqual(ids({ goals: ['My own goal', 'Find encouragement', 'Prepare to serve', 'Explore discipleship'] }), []);
});

test('at most four, in priority order, no duplicates', () => {
  const all = suggest({ ...base, goals: Object.keys(GOAL_CODES), journey: 'EXPLORING', prayerCount: 0, completedDaysLast7: 0 });
  assert.equal(all.length, MAX_SUGGESTIONS);
  assert.deepEqual(all.map(s => s.id), ['plan:discover-jesus', 'plan:foundations-of-faith', 'plan:walking-with-god', 'prayer-journal']);
  assert.equal(new Set(all.map(s => s.id)).size, all.length);
});

test('every onboarding goal label is mapped, and every suggested plan exists', () => {
  const onboarding = ['Build a daily prayer habit', 'Understand the Bible', 'Grow in faith', 'Learn about Jesus', 'Explore discipleship', 'Prepare to serve', 'Find encouragement', 'Develop consistency'];
  assert.deepEqual(Object.keys(GOAL_CODES).sort(), onboarding.sort());
  const service = Object.create(SuggestionsService.prototype);
  for (const s of suggest({ ...base, goals: onboarding, journey: 'EXPLORING', prayerCount: 0, completedDaysLast7: 0 })) {
    const shown = service.present(s, 'fr');
    assert.ok(shown.href.startsWith('/'), s.id);
    if (s.kind === 'plan') { assert.ok(READING_PLANS.some(p => p.id === s.planId)); assert.ok(shown.title && shown.description); }
  }
});
