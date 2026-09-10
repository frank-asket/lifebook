import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';
import { useSignIn, useSignUp } from '@clerk/clerk-expo';

export function LoginScreen() {
  const { isLoaded: signInLoaded, signIn, setActive } = useSignIn();
  const { isLoaded: signUpLoaded, signUp } = useSignUp();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    if (!email.trim() || !password) {
      setError('Please enter an email and password.');
      return;
    }
    setLoading(true);
    try {
      if (!signInLoaded || !signUpLoaded) return;
      if (mode === 'signin') {
        const attempt = await signIn.create({ identifier: email.trim(), password });
        if (attempt.status !== 'complete') throw new Error('Sign-in needs an additional verification step.');
        await setActive({ session: attempt.createdSessionId });
      } else {
        const attempt = await signUp.create({ emailAddress: email.trim(), password });
        if (attempt.status !== 'complete') throw new Error('Please complete the verification sent to your email, then sign in.');
        await setActive({ session: attempt.createdSessionId });
      }
    } catch (e: any) {
      setError(readableAuthError(e?.code) || e?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.screen}>
      <Image source={require('../../assets/lifebook-logo.png')} style={styles.logo} />
      <Text style={styles.brand}>LifeBook</Text>
      <Text style={styles.tagline}>a quiet moment with the Word</Text>

      <View style={styles.form}>
        <TextInput
          placeholder="Email"
          placeholderTextColor="#8A7DAD"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor="#8A7DAD"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable onPress={handleSubmit} disabled={loading} style={styles.primaryBtn}>
          {loading ? (
            <ActivityIndicator color={colors.bgDeep} />
          ) : (
            <Text style={styles.primaryBtnText}>{mode === 'signin' ? 'Sign in' : 'Create account'}</Text>
          )}
        </Pressable>

        <Pressable onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
          <Text style={styles.switchModeText}>
            {mode === 'signin' ? "Don't have an account? Create one" : 'Already have an account? Sign in'}
          </Text>
        </Pressable>
      </View>

      <Text style={styles.note}>
        Your account is secured by Clerk.
      </Text>
    </View>
  );
}

function readableAuthError(code?: string): string | null {
  switch (code) {
    case 'auth/invalid-email': return 'That email address doesn\u2019t look right.';
    case 'auth/user-not-found': return 'No account found with that email.';
    case 'auth/wrong-password': return 'That password doesn\u2019t match.';
    case 'auth/email-already-in-use': return 'An account already exists with that email.';
    case 'auth/weak-password': return 'Please use at least 6 characters.';
    case 'auth/network-request-failed': return 'Network error \u2014 check your connection and try again.';
    default: return null;
  }
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgDeep, alignItems: 'center', justifyContent: 'center', padding: 24 },
  logo: { width: 64, height: 64, resizeMode: 'contain', marginBottom: 16 },
  brand: { color: colors.white, fontSize: 24, fontWeight: '700' },
  tagline: { color: '#C9BEE0', fontSize: 13, fontStyle: 'italic', marginTop: 4, marginBottom: 32 },
  form: { width: '100%' },
  input: { backgroundColor: 'rgba(255,255,255,0.08)', color: colors.white, borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 12 },
  error: { color: '#F6B0C5', fontSize: 12.5, marginBottom: 10 },
  primaryBtn: { backgroundColor: colors.teal, borderRadius: 14, paddingVertical: 13, alignItems: 'center', marginBottom: 14 },
  primaryBtnText: { color: colors.bgDeep, fontWeight: '700', fontSize: 15 },
  switchModeText: { color: '#B6ABCF', fontSize: 12.5, textAlign: 'center' },
  note: { color: '#6A6180', fontSize: 10.5, textAlign: 'center', marginTop: 30, lineHeight: 14 },
});
