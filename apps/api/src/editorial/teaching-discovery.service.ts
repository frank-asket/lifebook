import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { EditorialService } from './editorial.service';
const CHANNEL = /^UC[A-Za-z0-9_-]{22}$/;
const VIDEO = /^[A-Za-z0-9_-]{11}$/;
const PAGE = /^[A-Za-z0-9_+=/-]{1,512}$/;
type Item = { id?: string; contentDetails?: { relatedPlaylists?: { uploads?: string }; videoId?: string; duration?: string; caption?: string; regionRestriction?: unknown; contentRating?: { ytRating?: string } }; snippet?: { title?: string; channelId?: string; channelTitle?: string; publishedAt?: string; defaultLanguage?: string; defaultAudioLanguage?: string }; status?: { privacyStatus?: string; embeddable?: boolean; uploadStatus?: string } };
type ResponseData = { items: Item[]; nextPageToken?: string };
@Injectable()
export class TeachingDiscoveryService {
  constructor(private readonly editorial: EditorialService) {}
  private configuration() {
    const channels = [...new Set((process.env.YOUTUBE_APPROVED_CHANNEL_IDS || '').split(',').map(value => value.trim()).filter(Boolean))];
    if (channels.length > 20 || channels.some(id => !CHANNEL.test(id))) throw new ServiceUnavailableException('Approved YouTube channels are not configured correctly');
    return { channels, key: (process.env.YOUTUBE_API_KEY || '').trim() };
  }
  async sources(auth?: string) {
    await this.editorial.requireEditor(auth);
    const { channels, key } = this.configuration();
    return { enabled: !!key && !!channels.length, sources: channels.map(id => ({ id, sourceUrl: `https://www.youtube.com/channel/${id}` })) };
  }
  private async request(resource: string, parameters: Record<string, string>, key: string): Promise<ResponseData> {
    const url = new URL(`https://www.googleapis.com/youtube/v3/${resource}`);
    for (const [name, value] of Object.entries({ ...parameters, key })) url.searchParams.set(name, value);
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(10000), redirect: 'error' });
      if (!response.ok) throw new Error('upstream');
      const value = await response.json();
      if (!value || !Array.isArray(value.items) || value.items.some((item: unknown) => !item || typeof item !== 'object' || Array.isArray(item))) throw new Error('payload');
      return value;
    } catch {
      // Never forward upstream bodies/URLs: requests carry the server-only API key.
      throw new ServiceUnavailableException('YouTube discovery is unavailable. Try again later.');
    }
  }
  async videos(auth: string | undefined, channelId: string, pageToken = '') {
    await this.editorial.requireEditor(auth);
    const { channels, key } = this.configuration();
    if (typeof channelId !== 'string' || !CHANNEL.test(channelId) || !channels.includes(channelId)) throw new BadRequestException('Choose a configured approved channel');
    if (typeof pageToken !== 'string' || (pageToken && !PAGE.test(pageToken))) throw new BadRequestException('Invalid discovery page');
    if (!key) throw new ServiceUnavailableException('YouTube discovery is not configured');
    const channel = (await this.request('channels', { part: 'contentDetails', id: channelId }, key)).items.find(item => item.id === channelId);
    const playlist = channel?.contentDetails?.relatedPlaylists?.uploads;
    if (typeof playlist !== 'string' || !/^[A-Za-z0-9_-]{1,100}$/.test(playlist)) throw new ServiceUnavailableException('The approved channel uploads are unavailable');
    const page = await this.request('playlistItems', { part: 'contentDetails', playlistId: playlist, maxResults: '12', ...(pageToken ? { pageToken } : {}) }, key);
    const ids = [...new Set(page.items.map(item => item.contentDetails?.videoId).filter((id): id is string => typeof id === 'string' && VIDEO.test(id)))].slice(0, 12);
    const videos = ids.length ? await this.request('videos', { part: 'snippet,status,contentDetails', id: ids.join(',') }, key) : { items: [] };
    const seen = new Set<string>();
    const items = videos.items.flatMap(video => {
      const id = video.id; const snippet = video.snippet;
      if (!id || !ids.includes(id) || seen.has(id) || snippet?.channelId !== channelId || video.status?.privacyStatus !== 'public' || video.status?.embeddable !== true || video.status?.uploadStatus !== 'processed' || video.contentDetails?.contentRating?.ytRating === 'ytAgeRestricted' || typeof snippet.title !== 'string' || !snippet.title.trim() || snippet.title.length > 200 || typeof snippet.channelTitle !== 'string' || !snippet.channelTitle.trim() || snippet.channelTitle.length > 200) return [];
      seen.add(id);
      return [{ id, title: snippet.title, publisher: snippet.channelTitle, channelId, sourceUrl: `https://www.youtube.com/watch?v=${id}`, channelUrl: `https://www.youtube.com/channel/${channelId}`, publishedAt: typeof snippet.publishedAt === 'string' ? snippet.publishedAt : null, duration: typeof video.contentDetails?.duration === 'string' ? video.contentDetails.duration : null, language: typeof snippet.defaultAudioLanguage === 'string' ? snippet.defaultAudioLanguage : typeof snippet.defaultLanguage === 'string' ? snippet.defaultLanguage : null, captionsAvailable: video.contentDetails?.caption === 'true', regionRestricted: !!video.contentDetails?.regionRestriction }];
    });
    // Results are ephemeral editorial leads, never saved, scored, downloaded or published.
    return { items, nextPageToken: typeof page.nextPageToken === 'string' && PAGE.test(page.nextPageToken) ? page.nextPageToken : null, checkedAt: new Date().toISOString(), reviewRequired: true };
  }
}
