export type TelemetryEventName =
  | 'onboarding_started'
  | 'onboarding_completed'
  | 'spiritual_pulse_viewed'
  | 'spiritual_pulse_submitted'
  | 'guided_flow_started'
  | 'guided_step_viewed'
  | 'guided_step_completed'
  | 'guided_flow_completed'
  | 'habit_5min_achieved'
  | 'waitlist_joined'
  | 'scripture_favorited'
  | 'content_flagged'
  | 'mood_preview_selected'
  | 'pre_signup_journey_previewed'
  | 'pre_signup_journey_started'
  | 'journey_grace_day_activated'
  | 'journey_grace_catchup_completed'
  | 'journey_grace_rest_requested'
  | 'journey_grace_simulated'
  | 'journey_grace_protection_viewed'
  | 'waitlist_feedback_submitted'
  | 'waitlist_stage_promoted'
  | 'pastoral_teaching_submitted'
  | 'pastoral_teaching_reviewed'
  | 'pastoral_rubric_evaluated';

export interface TelemetryPayload {
  eventName: TelemetryEventName;
  deviceId?: string;
  userId?: string;
  sessionId?: string;
  properties?: Record<string, unknown>;
  timestamp?: string;
}

export async function trackEvent(
  eventName: TelemetryEventName,
  properties: Record<string, unknown> = {},
  deviceId?: string
) {
  try {
    const payload: TelemetryPayload = {
      eventName,
      deviceId: deviceId || (typeof window !== 'undefined' ? localStorage.getItem('lifebook_device_id') || 'web_visitor' : 'server'),
      properties,
      timestamp: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      // Fire and forget beacon or fetch
      const endpoint = '/api/lifebook/analytics/events';
      if (navigator.sendBeacon) {
        navigator.sendBeacon(endpoint, JSON.stringify(payload));
      } else {
        fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true,
        }).catch(() => {});
      }
    }
  } catch {
    // Ignore telemetry send failures
  }
}
