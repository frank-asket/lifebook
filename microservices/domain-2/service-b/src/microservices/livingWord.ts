import http from 'node:http';
import { randomUUID } from 'node:crypto';
import teachings from '../data/livingWord.json';
import { db } from '../db';
import { resolveIdentity } from '../auth/verifyToken';
import { moderate } from '../agents/communityModeration';
import { readJson, routeParts, sendJson } from './http';

const PORT = Number(process.env.LIVINGWORD_PORT) || 8788;
type Teaching = (typeof teachings)[number];

async function userId(req: http.IncomingMessage, fallback?: string): Promise<string> {
  const identity = await resolveIdentity(req, fallback);
  return identity.userId;
}

function listComments(slug: string) {
  return db.read().livingWordComments.filter((comment) => comment.teachingSlug === slug && comment.moderationStatus === 'approved');
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return sendJson(res, 204, {});
  const url = new URL(req.url || '/', `http://localhost:${PORT}`);
  const parts = routeParts(url.pathname);

  if (req.method === 'GET' && url.pathname === '/health') {
    return sendJson(res, 200, { service: 'livingword', status: 'ok', mediaMode: 'licensed media pending' });
  }
  if (req.method === 'GET' && url.pathname === '/api/teachings') {
    return sendJson(res, 200, { teachings });
  }
  if (req.method === 'GET' && parts.length === 3 && parts[0] === 'api' && parts[1] === 'teachings') {
    const teaching = teachings.find((item) => item.slug === parts[2]);
    if (!teaching) return sendJson(res, 404, { error: 'teaching not found' });
    return sendJson(res, 200, { teaching, comments: listComments(teaching.slug) });
  }
  if (req.method === 'GET' && parts.length === 4 && parts[0] === 'api' && parts[1] === 'teachings' && parts[3] === 'comments') {
    if (!teachings.some((item) => item.slug === parts[2])) return sendJson(res, 404, { error: 'teaching not found' });
    return sendJson(res, 200, { comments: listComments(parts[2]) });
  }
  if (req.method === 'POST' && parts.length === 4 && parts[0] === 'api' && parts[1] === 'teachings' && parts[3] === 'comments') {
    try {
      const body = await readJson(req);
      const text = typeof body.text === 'string' ? body.text.trim() : '';
      const slug = parts[2];
      if (!teachings.some((item) => item.slug === slug)) return sendJson(res, 404, { error: 'teaching not found' });
      if (!text || text.length > 2_000) return sendJson(res, 400, { error: 'text is required and must be under 2,000 characters' });
      const id = await userId(req, typeof body.deviceId === 'string' ? body.deviceId : undefined);
      const review = moderate(text);
      const comment = { id: randomUUID(), teachingSlug: slug, userId: id, authorName: typeof body.authorName === 'string' ? body.authorName.trim().slice(0, 80) || 'LifeBook member' : 'LifeBook member', text, moderationStatus: review.status, createdAt: new Date().toISOString() };
      const database = db.read();
      database.livingWordComments.push(comment);
      db.write(database);
      return sendJson(res, review.status === 'rejected' ? 422 : 201, { comment: review.status === 'approved' ? comment : { ...comment, text: undefined }, supportNote: review.needsSupportNote });
    } catch (error) {
      return sendJson(res, 401, { error: String(error instanceof Error ? error.message : error) });
    }
  }
  return sendJson(res, 404, { error: 'route not found' });
});

server.listen(PORT, () => console.log(`LivingWord microservice listening on ${PORT}`));
