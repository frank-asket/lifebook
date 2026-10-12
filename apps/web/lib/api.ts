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
    if (!base) throw new ApiError('LifeBook API is not configured. Set NEXT_PUBLIC_API_URL in Vercel.');
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
        const message = typeof body?.message === 'string'
            ? body.message
            : Array.isArray(body?.message)
                ? body.message.join(', ')
                : response.status === 404
                    ? 'The requested meditation could not be found.'
                    : response.status === 503 || response.status === 502
                        ? 'The meditation service is temporarily unavailable. Please try again shortly.'
                        : `LifeBook API returned HTTP ${response.status}.`;
        throw new ApiError(message, response.status);
    }

    if (parsed === undefined) {
        throw new ApiError(
            'The meditation service returned a non-JSON response. Check NEXT_PUBLIC_API_URL points to your Render API, not the web app, and confirm the API is running.',
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
        description:
            'Curious about faith and looking for a place to begin.',
    },
    {
        value: 'NEW_BELIEVER',
        label: 'New Believer',
        description:
            'Beginning to discover life with Christ.',
    },
    {
        value: 'GROWING_BELIEVER',
        label: 'Growing Believer',
        description:
            'Building steady habits of Scripture and prayer.',
    },
    {
        value: 'DISCIPLESHIP',
        label: 'Structured Discipleship',
        description:
            'Ready to follow a guided learning pathway.',
    },
    {
        value: 'MINISTRY_PREPARATION',
        label: 'Ministry Preparation',
        description:
            'Exploring biblical foundations for serving others.',
    },
    {
        value: 'SERVING_IN_MINISTRY',
        label: 'Serving in Ministry',
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