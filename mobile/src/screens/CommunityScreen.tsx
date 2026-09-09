import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';
import {
  fetchGroups, joinGroup, fetchPrayerRequests, submitPrayerRequest, prayForRequest,
  fetchDiscussions, createDiscussion, likeDiscussion, fetchReplies, replyToDiscussion,
  Group, PrayerRequest, Discussion, DiscussionReply,
} from '../api/client';

export function CommunityScreen({ deviceId }: { deviceId: string }) {
  const [tab, setTab] = useState<'groups' | 'prayer' | 'discussions'>('groups');
  const [groups, setGroups] = useState<Group[]>([]);
  const [requests, setRequests] = useState<PrayerRequest[]>([]);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [openDiscussionId, setOpenDiscussionId] = useState<string | null>(null);
  const [replies, setReplies] = useState<DiscussionReply[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newReply, setNewReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [newRequest, setNewRequest] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [supportNote, setSupportNote] = useState(false);

  function load() {
    setLoading(true);
    Promise.all([fetchGroups(), fetchPrayerRequests(), fetchDiscussions()])
      .then(([g, r, d]) => { setGroups(g.groups); setRequests(r.requests); setDiscussions(d.discussions); })
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function handleJoin(groupId: string) {
    await joinGroup(groupId, deviceId);
    load();
  }

  async function handleSubmitRequest() {
    if (!newRequest.trim()) return;
    setSubmitting(true);
    try {
      const res = await submitPrayerRequest(deviceId, newRequest.trim());
      setSupportNote(res.needsSupportNote);
      setNewRequest('');
      load();
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePray(id: string) {
    await prayForRequest(id);
    load();
  }

  async function handleCreateDiscussion() {
    if (!newTitle.trim() || !newBody.trim()) return;
    setSubmitting(true);
    try {
      const res = await createDiscussion(deviceId, newTitle.trim(), newBody.trim());
      setSupportNote(res.needsSupportNote);
      setNewTitle('');
      setNewBody('');
      load();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLike(id: string) {
    await likeDiscussion(id);
    load();
  }

  async function handleOpenDiscussion(id: string) {
    if (openDiscussionId === id) {
      setOpenDiscussionId(null);
      return;
    }
    setOpenDiscussionId(id);
    const r = await fetchReplies(id);
    setReplies(r.replies);
  }

  async function handleReply(id: string) {
    if (!newReply.trim()) return;
    const res = await replyToDiscussion(id, deviceId, newReply.trim());
    setSupportNote(res.needsSupportNote);
    setNewReply('');
    const r = await fetchReplies(id);
    setReplies(r.replies);
    load();
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Community</Text>

      <View style={styles.tabBar}>
        <Pressable onPress={() => setTab('groups')} style={[styles.tabBtn, tab === 'groups' && styles.tabBtnActive]}>
          <Text style={[styles.tabText, tab === 'groups' && styles.tabTextActive]}>Groups</Text>
        </Pressable>
        <Pressable onPress={() => setTab('prayer')} style={[styles.tabBtn, tab === 'prayer' && styles.tabBtnActive]}>
          <Text style={[styles.tabText, tab === 'prayer' && styles.tabTextActive]}>Prayer</Text>
        </Pressable>
        <Pressable onPress={() => setTab('discussions')} style={[styles.tabBtn, tab === 'discussions' && styles.tabBtnActive]}>
          <Text style={[styles.tabText, tab === 'discussions' && styles.tabTextActive]}>Discuss</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.teal} style={{ marginTop: 30 }} />
      ) : tab === 'groups' ? (
        groups.map(g => (
          <View key={g.id} style={styles.card}>
            <Text style={styles.cardTitle}>{g.name}</Text>
            <Text style={styles.cardBody}>{g.description}</Text>
            <View style={styles.cardMetaRow}>
              <Text style={styles.cardMeta}>{g.memberCount} members · {g.meetingFrequency}</Text>
              <Pressable onPress={() => handleJoin(g.id)} style={styles.joinBtn}>
                <Text style={styles.joinBtnText}>Join</Text>
              </Pressable>
            </View>
          </View>
        ))
      ) : tab === 'prayer' ? (
        <>
          <View style={styles.submitBox}>
            <TextInput
              placeholder="Share a prayer request…"
              placeholderTextColor="#8A7DAD"
              value={newRequest}
              onChangeText={setNewRequest}
              multiline
              style={styles.input}
            />
            <Pressable onPress={handleSubmitRequest} disabled={submitting} style={styles.submitBtn}>
              <Text style={styles.submitBtnText}>{submitting ? 'Submitting…' : 'Submit'}</Text>
            </Pressable>
            {supportNote && (
              <Text style={styles.supportNote}>
                That sounded heavy — please also consider reaching out to a crisis line or someone you trust.
              </Text>
            )}
          </View>
          {requests.map(r => (
            <View key={r.id} style={styles.card}>
              <Text style={styles.cardBody}>{r.text}</Text>
              <View style={styles.cardMetaRow}>
                <Text style={styles.cardMeta}>{r.authorName}</Text>
                <Pressable onPress={() => handlePray(r.id)} style={styles.prayBtn}>
                  <Text style={styles.prayBtnText}>🙏 Praying ({r.prayerCount})</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </>
      ) : (
        <>
          <View style={styles.submitBox}>
            <TextInput
              placeholder="Discussion title…"
              placeholderTextColor="#8A7DAD"
              value={newTitle}
              onChangeText={setNewTitle}
              style={[styles.input, { minHeight: 20, marginBottom: 8 }]}
            />
            <TextInput
              placeholder="What's on your mind?"
              placeholderTextColor="#8A7DAD"
              value={newBody}
              onChangeText={setNewBody}
              multiline
              style={styles.input}
            />
            <Pressable onPress={handleCreateDiscussion} disabled={submitting} style={styles.submitBtn}>
              <Text style={styles.submitBtnText}>{submitting ? 'Posting…' : 'Post'}</Text>
            </Pressable>
            {supportNote && (
              <Text style={styles.supportNote}>
                That sounded heavy — please also consider reaching out to a crisis line or someone you trust.
              </Text>
            )}
          </View>
          {discussions.map(d => (
            <View key={d.id} style={styles.card}>
              <Text style={styles.cardTitle}>{d.title}</Text>
              <Text style={styles.cardBody}>{d.body}</Text>
              <View style={styles.cardMetaRow}>
                <Pressable onPress={() => handleLike(d.id)}>
                  <Text style={styles.cardMeta}>♡ {d.likeCount}</Text>
                </Pressable>
                <Pressable onPress={() => handleOpenDiscussion(d.id)}>
                  <Text style={styles.cardMeta}>💬 {d.replyCount} {openDiscussionId === d.id ? '— hide' : '— view'}</Text>
                </Pressable>
              </View>

              {openDiscussionId === d.id && (
                <View style={styles.repliesBox}>
                  {replies.map(r => (
                    <View key={r.id} style={styles.replyRow}>
                      <Text style={styles.replyAuthor}>{r.authorName}</Text>
                      <Text style={styles.replyText}>{r.text}</Text>
                    </View>
                  ))}
                  <TextInput
                    placeholder="Write a reply…"
                    placeholderTextColor="#8A7DAD"
                    value={newReply}
                    onChangeText={setNewReply}
                    style={styles.replyInput}
                  />
                  <Pressable onPress={() => handleReply(d.id)} style={styles.replySubmitBtn}>
                    <Text style={styles.submitBtnText}>Reply</Text>
                  </Pressable>
                </View>
              )}
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgDeep },
  content: { padding: 20, paddingTop: 50, paddingBottom: 60 },
  title: { color: colors.white, fontSize: 22, fontWeight: '700', marginBottom: 16 },
  tabBar: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  tabBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)' },
  tabBtnActive: { backgroundColor: 'rgba(31,182,176,0.2)' },
  tabText: { color: '#B6ABCF', fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: colors.teal },
  card: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 16, marginBottom: 12 },
  cardTitle: { color: colors.white, fontWeight: '700', fontSize: 15, marginBottom: 6 },
  cardBody: { color: '#D8CFEC', fontSize: 13.5, lineHeight: 19 },
  cardMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  cardMeta: { color: '#8A7DAD', fontSize: 11.5 },
  joinBtn: { backgroundColor: colors.teal, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16 },
  joinBtnText: { color: colors.bgDeep, fontWeight: '700', fontSize: 12 },
  prayBtn: { backgroundColor: 'rgba(31,182,176,0.16)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  prayBtnText: { color: colors.teal, fontWeight: '600', fontSize: 12 },
  submitBox: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 14, marginBottom: 18 },
  input: { color: colors.white, fontSize: 13.5, minHeight: 60, textAlignVertical: 'top' },
  submitBtn: { alignSelf: 'flex-end', backgroundColor: colors.teal, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, marginTop: 8 },
  submitBtnText: { color: colors.bgDeep, fontWeight: '700', fontSize: 12 },
  supportNote: { color: '#F6DDE6', fontSize: 11.5, marginTop: 10, lineHeight: 16 },
  repliesBox: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  replyRow: { marginBottom: 8 },
  replyAuthor: { color: '#B6ABCF', fontSize: 11, fontWeight: '700' },
  replyText: { color: '#D8CFEC', fontSize: 12.5, marginTop: 2 },
  replyInput: { color: colors.white, fontSize: 13, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: 10, marginTop: 6 },
  replySubmitBtn: { alignSelf: 'flex-end', backgroundColor: colors.teal, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14, marginTop: 8 },
});
