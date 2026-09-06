import { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Body, Card, CrisisFooter, Eyebrow, GhostButton, Heading, Pill, PrimaryButton, Screen, Title } from '@/components/ui';
import { track } from '@/lib/analytics';
import { groups, useStore, type CommunityPost } from '@/lib/store';
import { colors, radius, spacing } from '@/lib/theme';

type Tab = 'groups' | 'prayer' | 'discussions';

function timeAgo(iso: string) {
  const hours = Math.round((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function PostCard({ post, onPray }: { post: CommunityPost; onPray: () => void }) {
  const group = groups.find((item) => item.id === post.groupId);
  return (
    <Card>
      <Eyebrow>{`${post.author} · ${group?.name ?? 'LifeBook'} · ${timeAgo(post.createdAt)}`}</Eyebrow>
      <Body>{post.text}</Body>
      {post.supportNote ? (
        <View style={styles.support}>
          <Body muted style={styles.supportText}>
            {post.supportNote}
          </Body>
        </View>
      ) : null}
      {post.kind === 'prayer' ? (
        <GhostButton label={`Praying · ${post.prayerCount}`} onPress={onPray} />
      ) : null}
    </Card>
  );
}

export default function Community() {
  const { state, addPost, prayFor, joinGroup } = useStore();
  const [tab, setTab] = useState<Tab>('prayer');
  const [draft, setDraft] = useState('');
  const [rejection, setRejection] = useState<string | null>(null);

  useEffect(() => {
    void track('screen_view', 'community', { tab });
  }, [tab]);

  const kind = tab === 'discussions' ? 'discussion' : 'prayer';
  const posts = state.posts.filter((post) => post.kind === kind);

  function submit() {
    const result = addPost({ kind, groupId: state.profile.groupId ?? groups[0].id, text: draft });
    if (!result.ok) {
      setRejection(result.reason);
      void track('post_rejected', 'community', { kind });
      return;
    }
    setRejection(null);
    setDraft('');
    void track('post_published', 'community', { kind });
  }

  return (
    <Screen>
      <Title>Community</Title>
      <View style={styles.tabs}>
        <Pill label="Groups" active={tab === 'groups'} onPress={() => setTab('groups')} />
        <Pill label="Prayer" active={tab === 'prayer'} onPress={() => setTab('prayer')} />
        <Pill label="Discussions" active={tab === 'discussions'} onPress={() => setTab('discussions')} />
      </View>

      {tab === 'groups' ? (
        <>
          <Body muted>Small by design. You can read without posting.</Body>
          {groups.map((group) => {
            const joined = state.profile.groupId === group.id;
            return (
              <Card key={group.id}>
                <Heading>{group.name}</Heading>
                <Body muted>{group.blurb}</Body>
                <GhostButton
                  label={joined ? 'Joined' : 'Join group'}
                  onPress={() => joinGroup(joined ? null : group.id)}
                />
              </Card>
            );
          })}
        </>
      ) : (
        <>
          <Body muted>
            Everything posted here passes moderation first. Promotion is rejected; hard days are
            published with support attached, never deleted.
          </Body>

          <Card>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={kind === 'prayer' ? 'What can people pray for?' : 'Start a discussion'}
              placeholderTextColor={colors.muted}
              multiline
              style={styles.input}
            />
            {rejection ? <Body style={styles.rejection}>{rejection}</Body> : null}
            <PrimaryButton label="Post" onPress={submit} />
          </Card>

          {posts.map((post) => (
            <PostCard key={post.id} post={post} onPray={() => prayFor(post.id)} />
          ))}
        </>
      )}

      <CrisisFooter />
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: spacing.sm },
  input: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 90,
    color: colors.text,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  rejection: { color: colors.danger, fontSize: 13 },
  support: {
    borderLeftColor: colors.danger,
    borderLeftWidth: 2,
    paddingLeft: spacing.sm,
  },
  supportText: { fontSize: 13 },
});
