import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

interface TtsRequestPayload {
  text: string;
  personaId: string;
  region: "african-ng" | "african-ci" | "american-us";
  lang: "en-NG" | "fr-CI" | "en-US";
  geminiVoiceName: "Charon" | "Kore" | "Fenrir" | "Puck" | "Zephyr";
  stylePrompt: string;
}

// In-memory LRU cache for synthesized neural audio clips to make repeated playback instant
const audioCache = new Map<string, { audioBase64: string; mimeType: string }>();
const MAX_CACHE_ENTRIES = 40;

function addHumanBreathMarkers(rawText: string): string {
  const cleaned = rawText.replace(/\s+/g, " ").trim();
  // Insert gentle <breath> cues after the first sentence or long scripture clauses for natural human phrasing
  const sentences = cleaned.split(/(?<=[.!?])\s+/);
  if (sentences.length <= 1) return cleaned;
  return sentences
    .map((s, idx) => (idx === 0 ? `${s} <breath>` : s))
    .join(" ");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TtsRequestPayload;
    const {
      text,
      personaId = "ng-adewale",
      region = "african-ng",
      lang = "en-NG",
      geminiVoiceName = "Charon",
      stylePrompt,
    } = body;

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Text is required for speech synthesis." }, { status: 400 });
    }

    const trimmedText = text.trim().slice(0, 1200);
    const cacheKey = `${personaId}:${lang}:${trimmedText}`;
    const cached = audioCache.get(cacheKey);
    if (cached) {
      return NextResponse.json({
        audioBase64: cached.audioBase64,
        mimeType: cached.mimeType,
        engine: "gemini-neural-tts-cached",
        personaId,
        region,
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          fallback: true,
          reason: "GEMINI_API_KEY not configured on server; using client Humanized Neural Prosody Engine.",
        },
        { status: 200 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const defaultStyleByRegion: Record<string, string> = {
      "african-ng":
        "Warm, deeply human, unhurried Nigerian pastor from Lagos speaking authentic Nigerian English (en-NG) with rich West African vocal warmth, natural breath pauses, and compassionate scripture reverence.",
      "african-ci":
        "Chaleureux pasteur ivoirien d'Abidjan (Côte d'Ivoire, fr-CI) parlant un français ivoirien naturel, posé, profondément humain, avec des respirations douces et une bienveillance pastorale.",
      "american-us":
        "Warm, deeply human, soulful American pastor speaking natural conversational US English (en-US) with gentle breath pauses, intimate studio-mic warmth, and unhurried grace.",
    };

    const effectiveStyle = stylePrompt || defaultStyleByRegion[region] || defaultStyleByRegion["african-ng"];
    const scriptedText = addHumanBreathMarkers(trimmedText);

    // First try gemini-3.8-flash-tts (supports Voice Design style prompts & <breath> markers)
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash-tts",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: scriptedText,
                speechMetadata: {
                  style: effectiveStyle,
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: geminiVoiceName },
            },
          },
        },
      });

      const part = response.candidates?.[0]?.content?.parts?.[0];
      const base64Audio = part?.inlineData?.data;
      const mimeType = part?.inlineData?.mimeType || "audio/pcm;rate=24000";

      if (base64Audio) {
        if (audioCache.size >= MAX_CACHE_ENTRIES) {
          const oldestKey = audioCache.keys().next().value;
          if (oldestKey) audioCache.delete(oldestKey);
        }
        audioCache.set(cacheKey, { audioBase64: base64Audio, mimeType });
        return NextResponse.json({
          audioBase64: base64Audio,
          mimeType,
          engine: "gemini-3.8-flash-tts",
          personaId,
          region,
        });
      }
    } catch {
      // Fallback to gemini-3.8-flash-lite-tts
    }

    const fallbackResponse = await ai.models.generateContent({
      model: "gemini-3.8-flash-lite-tts",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: trimmedText,
            },
          ],
        },
      ],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: geminiVoiceName },
          },
        },
      },
    });

    const fallbackPart = fallbackResponse.candidates?.[0]?.content?.parts?.[0];
    const fallbackAudio = fallbackPart?.inlineData?.data;
    const fallbackMime = fallbackPart?.inlineData?.mimeType || "audio/pcm;rate=24000";

    if (fallbackAudio) {
      if (audioCache.size >= MAX_CACHE_ENTRIES) {
        const oldestKey = audioCache.keys().next().value;
        if (oldestKey) audioCache.delete(oldestKey);
      }
      audioCache.set(cacheKey, { audioBase64: fallbackAudio, mimeType: fallbackMime });
      return NextResponse.json({
        audioBase64: fallbackAudio,
        mimeType: fallbackMime,
        engine: "gemini-3.8-flash-lite-tts",
        personaId,
        region,
      });
    }

    return NextResponse.json({ fallback: true, reason: "No audio returned from model" });
  } catch (err) {
    return NextResponse.json(
      {
        fallback: true,
        reason: err instanceof Error ? err.message : "TTS synthesis error",
      },
      { status: 200 }
    );
  }
}
