import { API_BASE_URL } from '../api/client';

export type TelemetryEventName =
  | 'onboarding_started'
  | 'onboarding_completed'
  | 'guided_flow_started'
  | 'guided_step_viewed'
  | 'guided_step_completed'
  | 'guided_flow_completed'
  | 'habit_5min_achieved'
  | 'scripture_favorited'
  | 'content_flagged'
  | 'mood_checkin_submitted'
  | 'prayer_submitted';

export interface TelemetryPayload {
  eventName: TelemetryEventName;
  deviceId?: string;
  userId?: string;
  sessionId?: string;
  properties?: Record<string, any>;
  timestamp?: string;
}

let eventQueue: TelemetryPayload[] = [];
let flushTimeout: any = null;

async function flushEvents() {
  if (eventQueue.length === 0) return;
  const batch = [...eventQueue];
  eventQueue = [];

  try {
    await fetch(`${API_BASE_URL}/api/analytics/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: batch }),
    });
  } catch (err) {
    // Keep in queue if network failure (capped at 50)
    eventQueue = [...batch.slice(-30), ...eventQueue].slice(0, 50);
  }
}

export function trackEvent(
  eventName: TelemetryEventName,
  properties: Record<string, any> = {},
  deviceId?: string
) {
  const payload: TelemetryPayload = {
    eventName,
    deviceId: deviceId || 'mobile_user',
    properties,
    timestamp: new Date().toISOString(),
  };

  eventQueue.push(payload);

  if (flushTimeout) clearTimeout(flushTimeout);
  // Batch flush after 1.5 seconds, or immediately if completing flows
  if (eventName.includes('completed') || eventName.includes('started')) {
    flushEvents();
  } else {
    flushTimeout = setTimeout(flushEvents, 1500);
  }
}
