// ============================================================
// LIFEBOOK API TYPES
// ============================================================

export type FaithProfile = {
    journey?: string | null;
    language?: string | null;
    learningGoals?: string[];
    preferredFormats?: string[];
    personalizationConsent?: boolean;
    aiProcessingConsent?: boolean;
};

export type ProfileResponse = {
    userId: string;
    role: string;
    profile: FaithProfile | null;
};

export type Devotional = {
    id: string;
    title: string;
    body?: string | null;
    scriptureRef?: string | null;
    publishedAt?: string | null;
};

export type LearningPath = {
    id: string;
    slug: string;
    title: string;
    description?: string | null;
};

// ============================================================
// API CONFIGURATION
// ============================================================

const configuredBase = (process.env.NEXT_PUBLIC_API_URL || '').trim().replace(/\/+$/, '');
// Accept both https://host and https://host/api/v1 without duplicating the prefix.
const base = configuredBase.replace(/\/api\/v1$/, '');

export class ApiError extends Error {
    constructor(message: string, public readonly status?: number) {
        super(message);
        this.name = 'ApiError';
    }
}

export async function api<T>(
    path: string,
    token?: string | null,
    options: RequestInit = {},
): Promise<T> {
    if (!base) throw new ApiError('LifeBook is temporarily unavailable. Please try again later.');
    if (!path.startsWith('/')) throw new Error('API path must start with "/"');
    const headers = new Headers(options.headers);
    if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    if (token) headers.set('Authorization', `Bearer ${token}`);

    let response: Response;
    try {
        response = await fetch(`${base}/api/v1${path}`, { ...options, cache: 'no-store', headers });
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') throw error;
        throw new ApiError('Cannot connect to LifeBook right now. Please check your connection and try again.');
    }

    if (response.status === 204) return undefined as T;
    const raw = await response.text();
    const contentType = response.headers.get('content-type') || '';
    let parsed: unknown;
    if (contentType.includes('json') && raw) {
        try { parsed = JSON.parse(raw); } catch { /* handled below */ }
    }

    if (!response.ok) {
        const body = parsed && typeof parsed === 'object' ? parsed as { message?: unknown } : null;
        const message = response.status === 429 ? 'Too many requests. Please wait a moment and try again.' : typeof body?.message === 'string'
            ? body.message
            : Array.isArray(body?.message)
                ? body.message.join(', ')
                : response.status === 404
                    ? 'The requested content could not be found.'
                    : response.status === 503 || response.status === 502
                        ? 'LifeBook is temporarily unavailable. Please try again shortly.'
                        : `LifeBook API returned HTTP ${response.status}.`;
        throw new ApiError(message, response.status);
    }

    // NestJS sends a handler's `null` as 200 with an empty body (e.g. no reading history yet).
    if (raw === '') return null as T;
    if (parsed === undefined) {
        throw new ApiError(
            'We could not load this content. Please try again shortly.',
            response.status,
        );
    }
    return parsed as T;
}

// ============================================================
// FAITH JOURNEY OPTIONS
// ============================================================

export const JOURNEYS = [
    {
        value: 'EXPLORING',
        label: 'Exploring Christianity',
        labelFr: 'Découvrir la foi chrétienne',
        description:
            'Curious about faith and looking for a place to begin.',
    },
    {
        value: 'NEW_BELIEVER',
        label: 'New Believer',
        labelFr: 'Nouveau croyant',
        description:
            'Beginning to discover life with Christ.',
    },
    {
        value: 'GROWING_BELIEVER',
        label: 'Growing Believer',
        labelFr: 'Grandir dans la foi',
        description:
            'Building steady habits of Scripture and prayer.',
    },
    {
        value: 'DISCIPLESHIP',
        label: 'Structured Discipleship',
        labelFr: 'Parcours de disciple structuré',
        description:
            'Ready to follow a guided learning pathway.',
    },
    {
        value: 'MINISTRY_PREPARATION',
        label: 'Ministry Preparation',
        labelFr: 'Se préparer au service',
        description:
            'Exploring biblical foundations for serving others.',
    },
    {
        value: 'SERVING_IN_MINISTRY',
        label: 'Serving in Ministry',
        labelFr: 'Servir dans un ministère',
        description:
            'Seeking to grow while actively serving.',
    },
];

// ============================================================
// LEARNING GOALS
// ============================================================

export const GOALS = [
    'Build a daily prayer habit',
    'Understand the Bible',
    'Grow in faith',
    'Learn about Jesus',
    'Explore discipleship',
    'Prepare to serve',
    'Find encouragement',
    'Develop consistency',
];

// ============================================================
// PREFERRED CONTENT FORMATS
// ============================================================

export const FORMATS = [
    'Reading',
    'Audio',
    'Video',
    'Guided reflection',
];

// Translate display labels only; stored choices and custom goals remain unchanged.
export function faithJourneyLabel(value: string | null | undefined, language: 'en' | 'fr'): string | undefined {
    const journey = JOURNEYS.find(item => item.value === value);
    return language === 'fr' ? journey?.labelFr : journey?.label;
}
const frenchGoals: Record<string, string> = {
    'Build a daily prayer habit': 'Cultiver une habitude de prière quotidienne',
    'Understand the Bible': 'Comprendre la Bible',
    'Grow in faith': 'Grandir dans la foi',
    'Learn about Jesus': 'Découvrir Jésus',
    'Explore discipleship': 'Explorer la vie de disciple',
    'Prepare to serve': 'Se préparer à servir',
    'Find encouragement': 'Trouver de l’encouragement',
    'Develop consistency': 'Développer la régularité',
};
export function learningGoalLabel(value: string, language: 'en' | 'fr'): string {
    return language === 'fr' && Object.hasOwn(frenchGoals, value) ? frenchGoals[value] : value;
}
const frenchFormats: Record<string, string> = {
    Reading: 'Lecture',
    Audio: 'Audio',
    Video: 'Vidéo',
    'Guided reflection': 'Réflexion guidée',
};
export function formatLabel(value: string, language: 'en' | 'fr'): string {
    return language === 'fr' && Object.hasOwn(frenchFormats, value) ? frenchFormats[value] : value;
}
