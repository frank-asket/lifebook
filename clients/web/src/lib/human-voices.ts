"use client";

import {
  HUMAN_VOICE_PERSONAS,
  getSavedVoicePersona,
  speakWithHumanVoice as baseSpeakWithHumanVoice,
  stopHumanVoice,
  useHumanVoice,
  type HumanVoicePersona,
  type VoiceRegionFamily,
} from "./human-voice";

export type VoiceProfile = HumanVoicePersona;
export type VoiceRegionProfile = HumanVoicePersona;
export {
  HUMAN_VOICE_PERSONAS,
  getSavedVoicePersona,
  stopHumanVoice,
  useHumanVoice,
  type HumanVoicePersona,
  type VoiceRegionFamily,
};

export function getPreferredVoiceProfile(language: "en" | "fr" = "en"): VoiceProfile {
  return getSavedVoicePersona(language === "fr");
}

export async function speakWithHumanVoice(options: {
  text: string;
  profile?: VoiceProfile;
  persona?: HumanVoicePersona;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: () => void;
}) {
  try {
    if (options.onStart) options.onStart();
    await baseSpeakWithHumanVoice({
      text: options.text,
      persona: options.profile || options.persona,
      onEnd: options.onEnd,
    });
  } catch {
    if (options.onError) options.onError();
  }
}

export function speakWithHumanPersona(
  text: string,
  profile?: VoiceRegionProfile,
  onEnd?: () => void
) {
  void speakWithHumanVoice({
    text,
    profile,
    onEnd,
    onError: onEnd,
  });
}
