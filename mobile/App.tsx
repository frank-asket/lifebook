import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoginScreen } from './src/screens/LoginScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { GuidedFlowScreen, GuidedSession } from './src/screens/GuidedFlowScreen';
import { PracticeScreen } from './src/screens/PracticeScreen';
import { CommunityScreen } from './src/screens/CommunityScreen';
import { ProgressScreen } from './src/screens/ProgressScreen';
import { LibraryScreen } from './src/screens/LibraryScreen';
import { BookDetailScreen } from './src/screens/BookDetailScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { CheckinResponse, LibraryBook, ActiveJourney, completeJourneyDay } from './src/api/client';
import { colors } from './src/theme/colors';
import { isFirebaseConfigured } from './src/firebase/firebaseConfig';
import { subscribeToAuthState } from './src/firebase/auth';

const DEVICE_ID_KEY = 'lifebook.deviceId';
const ONBOARDED_KEY = 'lifebook.onboarded';

type Tab = 'home' | 'explore' | 'practice' | 'community' | 'profile';
type HomeStage = 'mood' | 'flow';
type ProfileView = 'settings' | 'progress';
type FlowContext = { type: 'checkin' } | { type: 'journey'; journeyId: string };

function generateId(): string {
  return 'device-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function sessionFromCheckin(result: CheckinResponse): GuidedSession {
  return {
    verseText: result.content.verseText,
    verseReference: result.content.verseReference,
    reflectionPrompt: result.content.reflectionQuestion,
    prayerText: result.content.prayer,
    sourceLabel: "Today's check-in",
    contentId: result.content.id,
  };
}

function sessionFromJourney(active: ActiveJourney): GuidedSession {
  return {
    verseText: active.day.verseText,
    verseReference: active.day.verseReference,
    reflectionPrompt: active.day.reflection,
    prayerText: active.day.prayer,
    sourceLabel: `${active.journey.title} \u2014 Day ${active.day.dayNumber} of ${active.journey.totalDays}`,
  };
}

export default function App() {
  const [userId, setUserId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>('home');
  const [homeStage, setHomeStage] = useState<HomeStage>('mood');
  const [flowSession, setFlowSession] = useState<GuidedSession | null>(null);
  const [flowContext, setFlowContext] = useState<FlowContext | null>(null);
  const [flowInitialStep, setFlowInitialStep] = useState<'scripture' | 'meditate-select' | 'pray'>('scripture');
  const [lastCheckin, setLastCheckin] = useState<CheckinResponse | null>(null);
  const [openBook, setOpenBook] = useState<LibraryBook | null>(null);
  const [profileView, setProfileView] = useState<ProfileView>('settings');
  const [journeyRefreshKey, setJourneyRefreshKey] = useState(0);

  useEffect(() => {
    if (isFirebaseConfigured()) {
      const unsubscribe = subscribeToAuthState(user => {
        setUserId(user ? user.uid : null);
        setAuthChecked(true);
      });
      return unsubscribe;
    } else {
      (async () => {
        let id = await AsyncStorage.getItem(DEVICE_ID_KEY);
        if (!id) {
          id = generateId();
          await AsyncStorage.setItem(DEVICE_ID_KEY, id);
        }
        setUserId(id);
        setAuthChecked(true);
      })();
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    AsyncStorage.getItem(`${ONBOARDED_KEY}.${userId}`).then(done => setOnboarded(done === 'true'));
  }, [userId]);

  if (!authChecked) return <View style={styles.root} />;

  if (isFirebaseConfigured() && !userId) {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <LoginScreen />
      </View>
    );
  }

  if (!userId || onboarded === null) return <View style={styles.root} />;

  if (!onboarded) {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <OnboardingScreen
          deviceId={userId}
          onComplete={async () => {
            await AsyncStorage.setItem(`${ONBOARDED_KEY}.${userId}`, 'true');
            setOnboarded(true);
          }}
        />
      </View>
    );
  }

  function goHome() {
    setTab('home');
    setHomeStage('mood');
  }

  function openProgress() {
    setTab('profile');
    setProfileView('progress');
  }

  function beginCheckinFlow(result: CheckinResponse) {
    setLastCheckin(result);
    setFlowSession(sessionFromCheckin(result));
    setFlowContext({ type: 'checkin' });
    setFlowInitialStep('scripture');
    setTab('home');
    setHomeStage('flow');
  }

  function beginJourneyFlow(active: ActiveJourney, initialStep: 'scripture' | 'meditate-select' | 'pray' = 'scripture') {
    setFlowSession(sessionFromJourney(active));
    setFlowContext({ type: 'journey', journeyId: active.journey.id });
    setFlowInitialStep(initialStep);
    setTab('home');
    setHomeStage('flow');
  }

  async function handleFlowFinish() {
    if (flowContext?.type === 'journey') {
      try {
        await completeJourneyDay(userId!, flowContext.journeyId);
        setJourneyRefreshKey(k => k + 1);
      } catch (e) {
        console.error('Failed to mark journey day complete:', e);
      }
    }
    setFlowSession(null);
    setFlowContext(null);
    goHome();
  }

  function renderHomeTab() {
    if (homeStage === 'flow' && flowSession) {
      return (
        <GuidedFlowScreen
          deviceId={userId!}
          session={flowSession}
          initialStep={flowInitialStep}
          onFinish={handleFlowFinish}
        />
      );
    }
    return (
      <HomeScreen
        deviceId={userId!}
        onContentReady={beginCheckinFlow}
        onOpenCommunity={() => setTab('community')}
        onOpenSaved={openProgress}
        onOpenProfile={() => { setTab('profile'); setProfileView('settings'); }}
        onOpenJourneyDay={active => beginJourneyFlow(active, 'scripture')}
        journeyRefreshKey={journeyRefreshKey}
      />
    );
  }

  function renderExploreTab() {
    if (openBook) {
      return (
        <BookDetailScreen
          deviceId={userId!}
          book={openBook}
          onBack={() => setOpenBook(null)}
          onUpgradePress={() => { setOpenBook(null); setTab('profile'); setProfileView('settings'); }}
        />
      );
    }
    return <LibraryScreen deviceId={userId!} onUpgradePress={() => { setTab('profile'); setProfileView('settings'); }} onOpenBook={setOpenBook} />;
  }

  function renderProfileTab() {
    if (profileView === 'progress') {
      return (
        <View style={{ flex: 1 }}>
          <Pressable onPress={() => setProfileView('settings')} style={styles.profileBackRow}>
            <Text style={styles.profileBackText}>{'\u2190'} Profile</Text>
          </Pressable>
          <ProgressScreen deviceId={userId!} />
        </View>
      );
    }
    return (
      <View style={{ flex: 1 }}>
        <Pressable onPress={openProgress} style={styles.progressLinkRow}>
          <Text style={styles.progressLinkText}>📈 View Progress &amp; Journal →</Text>
        </Pressable>
        <SettingsScreen deviceId={userId!} />
      </View>
    );
  }

  function renderActiveTab() {
    switch (tab) {
      case 'home': return renderHomeTab();
      case 'explore': return renderExploreTab();
      case 'practice':
        return (
          <PracticeScreen
            hasActiveContent={!!lastCheckin}
            onReadScripture={() => { setTab('home'); setHomeStage('mood'); }}
            onMeditate={() => {
              if (lastCheckin) {
                setFlowSession(sessionFromCheckin(lastCheckin));
                setFlowContext({ type: 'checkin' });
                setFlowInitialStep('meditate-select');
                setTab('home');
                setHomeStage('flow');
              } else {
                setTab('home');
                setHomeStage('mood');
              }
            }}
            onPray={() => {
              if (lastCheckin) {
                setFlowSession(sessionFromCheckin(lastCheckin));
                setFlowContext({ type: 'checkin' });
                setFlowInitialStep('pray');
                setTab('home');
                setHomeStage('flow');
              } else {
                setTab('home');
                setHomeStage('mood');
              }
            }}
            onReflect={openProgress}
          />
        );
      case 'community': return <CommunityScreen deviceId={userId!} />;
      case 'profile': return renderProfileTab();
      default: return null;
    }
  }

  const showTabBar = !(tab === 'home' && homeStage === 'flow' && flowInitialStep === 'meditate-select');

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.screenArea}>{renderActiveTab()}</View>
      {showTabBar && (
        <View style={styles.tabBar}>
          <TabButton icon="🏠" label="Home" active={tab === 'home'} onPress={goHome} />
          <TabButton icon="📖" label="Explore" active={tab === 'explore'} onPress={() => { setOpenBook(null); setTab('explore'); }} />
          <TabButton icon="➕" label="Practice" active={tab === 'practice'} onPress={() => setTab('practice')} emphasized />
          <TabButton icon="👥" label="Community" active={tab === 'community'} onPress={() => setTab('community')} />
          <TabButton icon="👤" label="Profile" active={tab === 'profile'} onPress={() => { setTab('profile'); setProfileView('settings'); }} />
        </View>
      )}
    </View>
  );
}

function TabButton({ icon, label, active, onPress, emphasized }: { icon: string; label: string; active: boolean; onPress: () => void; emphasized?: boolean }) {
  return (
    <Pressable onPress={onPress} style={styles.tabButton}>
      <View style={[styles.tabIconWrap, emphasized && styles.tabIconWrapEmphasized, active && !emphasized && styles.tabIconWrapActive]}>
        <Text style={styles.tabIcon}>{icon}</Text>
      </View>
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgDeep },
  screenArea: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#241E3B',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingBottom: 22,
    paddingTop: 8,
  },
  tabButton: { flex: 1, alignItems: 'center' },
  tabIconWrap: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 3 },
  tabIconWrapActive: { backgroundColor: 'rgba(31,182,176,0.18)' },
  tabIconWrapEmphasized: { backgroundColor: colors.teal, width: 34, height: 34, borderRadius: 17 },
  tabIcon: { fontSize: 14 },
  tabLabel: { color: '#7C7196', fontSize: 10.5 },
  tabLabelActive: { color: colors.white, fontWeight: '700' },
  progressLinkRow: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  progressLinkText: { color: colors.teal, fontSize: 13, fontWeight: '600' },
  profileBackRow: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  profileBackText: { color: '#C9BEE0', fontSize: 13 },
});
