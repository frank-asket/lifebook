import * as SecureStore from 'expo-secure-store';

let tokenProvider: (() => Promise<string | null>) | null = null;

export const tokenCache = {
  getToken: (key: string) => SecureStore.getItemAsync(key),
  saveToken: (key: string, value: string) => SecureStore.setItemAsync(key, value),
};

export function setTokenProvider(provider: (() => Promise<string | null>) | null) {
  tokenProvider = provider;
}

export function getIdToken(): Promise<string | null> {
  return tokenProvider ? tokenProvider() : Promise.resolve(null);
}
