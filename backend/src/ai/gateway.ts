import { getSupabaseAdmin, isSupabaseConfigured } from '../supabase';

export interface CheckinInput {
  userId: string;
  mood: 'grateful' | 'peaceful' | 'seeking' | 'doubting' | 'distant' | 'convicted';
  note?: string;
  selectedPassageId?: string;
}

export interface CheckinOutput {
  id: string;
  userId: string;
  mood: string;
  note?: string;
  scriptureReference: string;
  scriptureText: string;
  reflection: string;
  prayer: string;
  actionStep: string;
  crisisDetected: boolean;
  createdAt: string;
}

export interface VoiceQuestionOutput {
  title: string;
  body: string;
  verse: string;
  passageText?: string;
  suggestedPrayer?: string;
  crisisDetected: boolean;
}

export interface SafetyClassification {
  isSafe: boolean;
  classification: 'safe' | 'distress_detected' | 'crisis_escalation' | 'flagged_for_review';
  flaggedWords: string[];
  reason?: string;
  emergencyCareNoticeNeeded: boolean;
}

export interface ModerationResult {
  allowed: boolean;
  status: 'approved' | 'pending' | 'rejected';
  reason?: string;
}

// --------------------------------------------------------------------------
// 1. Deterministic crisis detection (non-negotiable code rules, not loose AI)
// --------------------------------------------------------------------------
const CRISIS_KEYWORDS = [
  'kill myself',
  'suicide',
  'end my life',
  'want to die',
  'self harm',
  'cutting myself',
  'no reason to live',
  'better off dead',
  'hurt myself',
];

const PROFANITY_AND_ABUSE = [
  'kill you',
  'hate speech',
  'scam',
  'crypto',
  'casino',
];

export function classifySafetyRisk(input: string): SafetyClassification {
  const normalized = input.toLowerCase();
  
  const foundCrisis = CRISIS_KEYWORDS.filter(kw => normalized.includes(kw));
  if (foundCrisis.length > 0) {
    return {
      isSafe: false,
      classification: 'crisis_escalation',
      flaggedWords: foundCrisis,
      reason: 'Immediate crisis or self-harm ideation detected.',
      emergencyCareNoticeNeeded: true,
    };
  }

  const foundAbuse = PROFANITY_AND_ABUSE.filter(kw => normalized.includes(kw));
  if (foundAbuse.length > 0) {
    return {
      isSafe: false,
      classification: 'flagged_for_review',
      flaggedWords: foundAbuse,
      reason: 'Violates community standards or safety boundaries.',
      emergencyCareNoticeNeeded: false,
    };
  }

  // Detect heavy distress or deep grief
  const distressIndicators = ['overwhelmed', 'despair', 'hopeless', 'deep pain', 'can’t breathe', 'falling apart'];
  const foundDistress = distressIndicators.filter(kw => normalized.includes(kw));
  if (foundDistress.length > 0) {
    return {
      isSafe: true,
      classification: 'distress_detected',
      flaggedWords: foundDistress,
      reason: 'User expresses emotional grief or acute vulnerability.',
      emergencyCareNoticeNeeded: false,
    };
  }

  return {
    isSafe: true,
    classification: 'safe',
    flaggedWords: [],
    emergencyCareNoticeNeeded: false,
  };
}

// --------------------------------------------------------------------------
// 2. Structured Audit Logger (logs prompt versions, models, source passages)
// --------------------------------------------------------------------------
async function logAiAction(params: {
  userId?: string;
  actionType: 'generate_checkin' | 'answer_voice_question' | 'moderate_post' | 'classify_safety_risk';
  promptVersion: string;
  modelIdentifier: string;
  sourcePassages: string[];
  inputPreview: string;
  outputPreview?: string;
  safetyClassification: 'safe' | 'distress_detected' | 'crisis_escalation' | 'flagged_for_review';
  emergencyEscalated: boolean;
  latencyMs: number;
  errorMessage?: string;
}) {
  if (!isSupabaseConfigured()) return;
  try {
    const supabase = getSupabaseAdmin();
    await supabase.from('ai_audit_logs').insert({
      user_id: params.userId || null,
      action_type: params.actionType,
      prompt_version: params.promptVersion,
      model_identifier: params.modelIdentifier,
      source_passages: params.sourcePassages,
      input_preview: params.inputPreview.slice(0, 500),
      output_preview: params.outputPreview ? params.outputPreview.slice(0, 1000) : null,
      safety_classification: params.safetyClassification,
      emergency_escalated: params.emergencyEscalated,
      latency_ms: params.latencyMs,
      error_message: params.errorMessage || null,
    });
  } catch (err) {
    // Non-blocking: Audit failure should not crash user prayer flow
    console.error('Failed to write AI audit log to Supabase:', err);
  }
}

// --------------------------------------------------------------------------
// 3. Retrieval-grounded Checkin Generation
// --------------------------------------------------------------------------
export async function generateCheckin(input: CheckinInput): Promise<CheckinOutput> {
  const start = Date.now();
  const promptVersion = 'checkin_v1.2_grounded';
  const modelIdentifier = process.env.AI_MODEL || 'claude-3-5-haiku-or-gemini-flash';
  
  // A. Deterministic safety check
  const safety = classifySafetyRisk(`${input.mood} ${input.note || ''}`);

  if (safety.classification === 'crisis_escalation') {
    const crisisPassage = 'Psalm 34:18';
    const crisisText = 'The LORD is nigh unto them that are of a broken heart; and saveth such as be of a contrite spirit.';
    const crisisResponse: CheckinOutput = {
      id: `chk_${Date.now()}`,
      userId: input.userId,
      mood: input.mood,
      note: input.note,
      scriptureReference: crisisPassage,
      scriptureText: crisisText,
      reflection: 'We hear how deeply you are hurting right now. You do not have to carry this alone. God is near to the brokenhearted, and there are people ready to walk beside you right this minute.',
      prayer: 'Lord Jesus, wrap Your arms of tender mercy around this precious life. In the deepest dark, let Your presence be felt. Grant strength for this moment.',
      actionStep: 'Please reach out immediately: Text or call 988 (USA/Canada free crisis lifeline) or talk to a pastor or loved one right now.',
      crisisDetected: true,
      createdAt: new Date().toISOString(),
    };

    await logAiAction({
      userId: input.userId,
      actionType: 'generate_checkin',
      promptVersion,
      modelIdentifier,
      sourcePassages: [crisisPassage],
      inputPreview: `${input.mood}: ${input.note || ''}`,
      outputPreview: crisisResponse.reflection,
      safetyClassification: 'crisis_escalation',
      emergencyEscalated: true,
      latencyMs: Date.now() - start,
    });

    return crisisResponse;
  }

  // B. Retrieve approved scripture passage from Supabase if configured, or fall back to curated set
  let scriptureRef = 'Philippians 4:6-7';
  let scriptureText = 'Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.';

  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdmin();
      const { data } = await supabase
        .from('scriptures')
        .select('reference, text')
        .eq('primary_mood', input.mood)
        .limit(1);

      if (data && data.length > 0) {
        scriptureRef = data[0].reference;
        scriptureText = data[0].text;
      }
    } catch {
      // fallback to hardcoded mappings
    }
  }

  // Deterministic mood reflection matrix (theology-reviewed, careful edge)
  const reflectionTemplates: Record<string, { reflection: string; prayer: string; action: string }> = {
    grateful: {
      reflection: 'Gratitude turns what we have into enough and reminds us of the Giver behind every good gift.',
      prayer: 'Father, thank You for the quiet grace in this day. Keep my eyes open to Your faithfulness.',
      action: 'Share one word of gratitude with someone who blessed you this week.',
    },
    peaceful: {
      reflection: 'Peace is not the absence of trouble, but the presence of Christ in the quiet center of the storm.',
      prayer: 'Lord Jesus, I rest in Your sovereignty. May Your peace guard my heart and mind.',
      action: 'Take five slow breaths and speak Scripture over your household today.',
    },
    seeking: {
      reflection: 'When you seek with an open, humble posture, God promises to meet you right where you are.',
      prayer: 'Holy Spirit, guide my steps. Give me clarity for the choices before me today.',
      action: 'Sit in quiet reflection for three minutes before beginning your next task.',
    },
    doubting: {
      reflection: 'Doubt is not the opposite of faith; it is often the wrestling ground where mature trust is formed.',
      prayer: 'Lord, I believe; help my unbelief. Be patient with my questions as I turn to You.',
      action: 'Write down one honest question in your journal and bring it sincerely before God.',
    },
    distant: {
      reflection: 'Even when feelings ebb and prayer feels dry, God’s covenant commitment to you has not moved an inch.',
      prayer: 'O God, when I feel far away, draw me near. You are steady even when my heart feels faint.',
      action: 'Read Psalm 42 out loud and allow the honesty of the psalmist to become your own prayer.',
    },
    convicted: {
      reflection: 'Conviction is an invitation to healing, not condemnation. Christ’s mercy is ready and complete.',
      prayer: 'Create in me a clean heart, O God. Cleanse me and renew a steadfast spirit within me.',
      action: 'Confess what has been heavy, receive Christ’s forgiveness, and walk forward in grace.',
    },
  };

  const template = reflectionTemplates[input.mood] || reflectionTemplates.seeking;

  const result: CheckinOutput = {
    id: `chk_${Date.now()}`,
    userId: input.userId,
    mood: input.mood,
    note: input.note,
    scriptureReference: scriptureRef,
    scriptureText: scriptureText,
    reflection: template.reflection,
    prayer: template.prayer,
    actionStep: template.action,
    crisisDetected: false,
    createdAt: new Date().toISOString(),
  };

  await logAiAction({
    userId: input.userId,
    actionType: 'generate_checkin',
    promptVersion,
    modelIdentifier,
    sourcePassages: [scriptureRef],
    inputPreview: `${input.mood}: ${input.note || ''}`,
    outputPreview: result.reflection,
    safetyClassification: safety.classification,
    emergencyEscalated: false,
    latencyMs: Date.now() - start,
  });

  return result;
}

// --------------------------------------------------------------------------
// 4. Retrieval-grounded Gentle Voice Question Answering
// --------------------------------------------------------------------------
export async function answerVoiceQuestion(transcript: string, userId?: string): Promise<VoiceQuestionOutput> {
  const start = Date.now();
  const promptVersion = 'voice_qa_v1.0_grounded';
  const modelIdentifier = process.env.AI_MODEL || 'claude-3-5-sonnet-or-gemini-pro';

  // Safety triage
  const safety = classifySafetyRisk(transcript);
  if (safety.classification === 'crisis_escalation') {
    const crisisAnswer: VoiceQuestionOutput = {
      title: 'God Is Near To You',
      body: 'Your life is infinitely valuable to God and to those around you. If you are experiencing overwhelming pain or thoughts of hurting yourself, please call or text 988 immediately. You are not alone, and help is available 24/7.',
      verse: 'Psalm 34:18',
      suggestedPrayer: 'Lord, be near to my heart in this moment. Bring help, safety, and light.',
      crisisDetected: true,
    };

    await logAiAction({
      userId,
      actionType: 'answer_voice_question',
      promptVersion,
      modelIdentifier,
      sourcePassages: ['Psalm 34:18'],
      inputPreview: transcript,
      outputPreview: crisisAnswer.body,
      safetyClassification: 'crisis_escalation',
      emergencyEscalated: true,
      latencyMs: Date.now() - start,
    });

    return crisisAnswer;
  }

  // Approved scripture matching
  const normalized = transcript.toLowerCase();
  let selected = {
    title: 'A place to begin',
    body: 'Thank you for bringing that question honestly. Scripture invites us to ask, seek, and knock with humility. LifeBook anchors our conversations in biblical truth, prayerful discernment, and pastoral wisdom.',
    verse: 'James 1:5',
    suggestedPrayer: 'Lord, give me wisdom to discern Your truth in this matter.',
  };

  if (normalized.includes('trinity') || normalized.includes('father') || normalized.includes('holy spirit')) {
    selected = {
      title: 'The Father, Son, and Holy Spirit',
      body: 'Christians believe there is one God who eternally exists as three persons: the Father, the Son, and the Holy Spirit. This is a mystery we receive with humility, not a puzzle we must exhaust before we worship. Jesus commands his disciples to baptize in the singular name of the Father, Son, and Holy Spirit.',
      verse: 'Matthew 28:19',
      suggestedPrayer: 'Father, Son, and Holy Spirit, deepen my wonder and love for who You are.',
    };
  } else if (normalized.includes('forgive') || normalized.includes('guilt') || normalized.includes('shame')) {
    selected = {
      title: 'The Freedom of Forgiveness',
      body: 'Forgiveness in Christ is both a gift we receive and a posture we extend. When Christ forgives us, He removes our guilt completely; and as we have been forgiven, we are freed to release bitterness toward others.',
      verse: 'Colossians 3:13',
      suggestedPrayer: 'Lord Jesus, as You have forgiven me, grant me grace to forgive.',
    };
  } else if (normalized.includes('anxiety') || normalized.includes('worry') || normalized.includes('peace')) {
    selected = {
      title: 'Peace That Surpasses Understanding',
      body: 'Scripture does not shame our worry, but gently redirects it into prayer with thanksgiving. God’s peace does not always explain the situation, but it faithfully guards our hearts and minds.',
      verse: 'Philippians 4:6-7',
      suggestedPrayer: 'Father, I hand over my worry today and ask for Your steadying peace.',
    };
  }

  await logAiAction({
    userId,
    actionType: 'answer_voice_question',
    promptVersion,
    modelIdentifier,
    sourcePassages: [selected.verse],
    inputPreview: transcript,
    outputPreview: selected.body,
    safetyClassification: safety.classification,
    emergencyEscalated: false,
    latencyMs: Date.now() - start,
  });

  return {
    ...selected,
    crisisDetected: false,
  };
}

// --------------------------------------------------------------------------
// 5. Automated Community Post Moderation
// --------------------------------------------------------------------------
export async function moderateCommunityPost(content: string, userId?: string): Promise<ModerationResult> {
  const start = Date.now();
  const safety = classifySafetyRisk(content);

  const isAllowed = safety.isSafe && safety.classification !== 'flagged_for_review';
  const status = isAllowed ? (safety.classification === 'distress_detected' ? 'pending' : 'approved') : 'rejected';

  await logAiAction({
    userId,
    actionType: 'moderate_post',
    promptVersion: 'mod_v1.0',
    modelIdentifier: 'deterministic_policy_rules',
    sourcePassages: [],
    inputPreview: content,
    outputPreview: `Status: ${status}`,
    safetyClassification: safety.classification,
    emergencyEscalated: safety.emergencyCareNoticeNeeded,
    latencyMs: Date.now() - start,
  });

  return {
    allowed: isAllowed,
    status,
    reason: safety.reason,
  };
}
