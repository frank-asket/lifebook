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

const base = (
    process.env.NEXT_PUBLIC_API_URL || ''
)
    .trim()
    .replace(/\/+$/, '');

// ============================================================
// API CLIENT
// ============================================================

export async function api<T>(
    path: string,
    token?: string | null,
    options: RequestInit = {},
): Promise<T> {
    if (!base) {
        throw new Error(
            'NEXT_PUBLIC_API_URL is not configured',
        );
    }

    if (!path.startsWith('/')) {
        throw new Error(
            'API path must start with "/"',
        );
    }

    const headers = new Headers(options.headers);

    if (options.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(
        `${base}/api/v1${path}`,
        {
            ...options,
            cache: 'no-store',
            headers,
        },
    );

    // ==========================================================
    // ERROR HANDLING
    // ==========================================================

    if (!response.ok) {
        let message = `API request failed (${response.status})`;

        try {
            const body = await response.text();

            if (body) {
                const parsed = JSON.parse(body);

                if (typeof parsed.message === 'string') {
                    message = parsed.message;
                } else if (Array.isArray(parsed.message)) {
                    message = parsed.message.join(', ');
                }
            }
        } catch {
            // Keep the generic error message.
        }

        throw new Error(message);
    }

    // ==========================================================
    // EMPTY RESPONSES
    // ==========================================================

    if (response.status === 204) {
        return undefined as T;
    }

    const contentType = response.headers.get('content-type');

    if (!contentType?.includes('application/json')) {
        throw new Error(
            'Unexpected API response format',
        );
    }

    return (await response.json()) as T;
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