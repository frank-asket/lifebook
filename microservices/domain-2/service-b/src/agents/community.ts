import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { db } from '../db';
import { Group, PrayerRequest, Discussion, DiscussionReply } from '../types';
import { moderate } from './communityModeration';
import { PrayerRepository, DiscussionRepository } from '../repositories';

let seedGroupsCache: Group[] | null = null;
function getSeedGroups(): Group[] {
  if (!seedGroupsCache) {
    seedGroupsCache = JSON.parse(
      fs.readFileSync(path.join(__dirname, '..', 'data', 'groups.json'), 'utf-8')
    ).groups.map((g: any) => ({ ...g, memberCount: 0 }));
  }
  return seedGroupsCache!;
}

function ensureGroupsSeeded() {
  const database = db.read();
  if (database.groups.length === 0) {
    database.groups = getSeedGroups();
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

export async function listPrayerRequests() {
  return PrayerRepository.listApproved();
}

export async function submitPrayerRequest(deviceId: string, text: string, category?: string): Promise<{ request: PrayerRequest; needsSupportNote: boolean }> {
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

  await PrayerRepository.create({
    id: request.id,
    userId: deviceId,
    text,
    category,
    moderationStatus: status,
    aiFlaggedReason: needsSupportNote ? 'Distress or escalation keywords flagged' : undefined,
  });

  return { request, needsSupportNote };
}

export async function prayFor(requestId: string) {
  const newCount = await PrayerRepository.pray(requestId);
  const local = db.read();
  const req = local.prayerRequests.find(r => r.id === requestId) || {
    id: requestId,
    deviceId: '',
    authorName: 'A LifeBook user',
    text: '',
    prayerCount: newCount,
    moderationStatus: 'approved' as const,
    createdAt: new Date().toISOString(),
  };
  req.prayerCount = newCount;
  return req;
}

export async function listDiscussions() {
  return DiscussionRepository.listApproved();
}

export async function createDiscussion(deviceId: string, title: string, body: string, tags: string[] = []): Promise<{ discussion: Discussion; needsSupportNote: boolean }> {
  const { status, needsSupportNote } = moderate(`${title}\n${body}`);
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

  await DiscussionRepository.create({
    id: discussion.id,
    userId: deviceId,
    title,
    body,
    tags,
    moderationStatus: status,
    aiFlaggedReason: needsSupportNote ? 'Flagged by community standards' : undefined,
  });

  return { discussion, needsSupportNote };
}

export async function likeDiscussion(discussionId: string) {
  return DiscussionRepository.like(discussionId);
}

export async function listReplies(discussionId: string) {
  return DiscussionRepository.listReplies(discussionId);
}

export async function replyToDiscussion(discussionId: string, deviceId: string, text: string): Promise<{ reply: DiscussionReply; needsSupportNote: boolean }> {
  const { needsSupportNote } = moderate(text);
  const id = randomUUID();
  const reply = await DiscussionRepository.reply(discussionId, {
    id,
    userId: deviceId,
    text,
  });
  return { reply, needsSupportNote };
}
