export type DiscoverySources = { enabled: boolean; sources: { id: string; sourceUrl: string }[] };
export type DiscoveredTeaching = { id: string; title: string; publisher: string; channelId: string; sourceUrl: string; channelUrl: string; publishedAt: string | null; duration: string | null; language: string | null; captionsAvailable: boolean; regionRestricted: boolean };
export type DiscoveryPage = { items: DiscoveredTeaching[]; nextPageToken: string | null; checkedAt: string; reviewRequired: true };
