import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { db } from '../db';
import { Group, PrayerRequest, Discussion, DiscussionReply } from '../types';
import { moderate } from './communityModeration';

const SEED_GROUPS: Group[] = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'data', 'groups.json'), 'utf-8')
).groups.map((g: any) => ({ ...g, memberCount: 0 }));

function ensureGroupsSeeded() {
  const database = db.read();
  if (database.groups.length === 0) {
    database.groups = SEED_GROUPS;
    db.write(database);
  }
}

export function listGroups() {
  ensureGroupsSeeded();
  const database = db.read();
  return database.groups.map(g => ({
    ...g,
    memberCount: database.groupMembers.filter(m => m.groupId === g.id).length,
  }));
}

export function joinGroup(groupId: string, deviceId: string) {
  ensureGroupsSeeded();
  const database = db.read();
  const group = database.groups.find(g => g.id === groupId);
  if (!group) throw new Error('Group not found');

  const already = database.groupMembers.some(m => m.groupId === groupId && m.deviceId === deviceId);
  if (!already) {
    database.groupMembers.push({ groupId, deviceId, joinedAt: new Date().toISOString() });
    db.write(database);
  }
  return { joined: true, memberCount: database.groupMembers.filter(m => m.groupId === groupId).length };
}

export function listPrayerRequests() {
  const database = db.read();
  return database.prayerRequests
    .filter(r => r.moderationStatus === 'approved')
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function submitPrayerRequest(deviceId: string, text: string, category?: string): { request: PrayerRequest; needsSupportNote: boolean } {
  const { status, needsSupportNote } = moderate(text);
  const request: PrayerRequest = {
    id: randomUUID(),
    deviceId,
    authorName: 'A LifeBook user',
    text,
    category,
    prayerCount: 0,
    moderationStatus: status,
    createdAt: new Date().toISOString(),
  };
  const database = db.read();
  database.prayerRequests.push(request);
  db.write(database);
  return { request, needsSupportNote };
}

export function prayFor(requestId: string) {
  const database = db.read();
  const request = database.prayerRequests.find(r => r.id === requestId);
  if (!request) throw new Error('Prayer request not found');
  request.prayerCount += 1;
  db.write(database);
  return request;
}

export function likeDiscussion(discussionId: string) {
  const database = db.read();
  const discussion = database.discussions.find(d => d.id === discussionId);
  if (!discussion) throw new Error('Discussion not found');
  discussion.likeCount += 1;
  db.write(database);
  return discussion;
}

export function replyToDiscussion(discussionId: string, deviceId: string, text: string): { reply: DiscussionReply; needsSupportNote: boolean } {
  const database = db.read();
  const discussion = database.discussions.find(d => d.id === discussionId);
  if (!discussion) throw new Error('Discussion not found');

  const { needsSupportNote } = moderate(text);
  const reply: DiscussionReply = {
    id: randomUUID(),
    discussionId,
    deviceId,
    authorName: 'A LifeBook user',
    text,
    createdAt: new Date().toISOString(),
  };
  database.discussionReplies.push(reply);
  discussion.replyCount += 1;
  db.write(database);
  return { reply, needsSupportNote };
}

export function listReplies(discussionId: string) {
  const database = db.read();
  return database.discussionReplies.filter(r => r.discussionId === discussionId);
}

export function listDiscussions() {
  const database = db.read();
  return database.discussions
    .filter(d => d.moderationStatus === 'approved')
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function createDiscussion(deviceId: string, title: string, body: string, tags: string[] = []): { discussion: Discussion; needsSupportNote: boolean } {
  const { status, needsSupportNote } = moderate(`${title} ${body}`);
  const discussion: Discussion = {
    id: randomUUID(),
    deviceId,
    authorName: 'A LifeBook user',
    title,
    body,
    tags,
    replyCount: 0,
    likeCount: 0,
    moderationStatus: status,
    createdAt: new Date().toISOString(),
  };
  const database = db.read();
  database.discussions.push(discussion);
  db.write(database);
  return { discussion, needsSupportNote };
}
