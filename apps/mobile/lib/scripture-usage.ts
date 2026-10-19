import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { api } from './api';
const sent = new Set<string>();
const sessionId = Crypto.randomUUID();
let device: Promise<string> | null = null;
function deviceId() {
  if (!device) device = (async () => {
    try {
      const existing = await SecureStore.getItemAsync('lifebook.scripture.device');
      if (existing && /^[A-Za-z0-9-]{8,64}$/.test(existing)) return existing;
      const value = Crypto.randomUUID(); await SecureStore.setItemAsync('lifebook.scripture.device', value); return value;
    } catch { return Crypto.randomUUID(); }
  })();
  return device;
}
/** Provider licensing report: only a usage token and random IDs, never the member or search/prayer text. */
export function reportScripture(key: string, token?: string | null) {
  if (!token || !/^[A-Za-z0-9._~+/=-]{8,1024}$/.test(token) || sent.has(key)) return;
  sent.add(key);
  void deviceId().then(id => api('/bible-content/usage', undefined, { method: 'POST', body: JSON.stringify({ tokens: [token], deviceId: id, sessionId }) })).catch(() => { sent.delete(key); });
}
