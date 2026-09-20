import http from 'node:http';
import { resolveIdentity } from '../auth/verifyToken';
import { readJson, sendJson } from './http';

const PORT = Number(process.env.VOICE_PORT) || 8789;

function fallbackAnswer(question: string) {
  if (question.toLowerCase().includes('trinity')) {
    return { title: 'The Father, Son, and Holy Spirit', answer: 'Christians believe there is one God who eternally exists as three persons: the Father, the Son, and the Holy Spirit. This is a mystery we receive with humility, not a puzzle we have to solve before we can worship.', references: ['Matthew 28:19', '2 Corinthians 13:14'], mode: 'dev-fallback' as const };
  }
  return { title: 'A place to begin', answer: 'Thank you for bringing that question honestly. Let us begin with Scripture, stay curious, and make room for prayer rather than rushing toward a shallow answer.', references: ['James 1:5'], mode: 'dev-fallback' as const };
}

async function answerQuestion(question: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return fallbackAnswer(question);
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 500, system: 'You are LifeBook Voice, a theologically careful Christian guide. Answer briefly, cite relevant Bible references, acknowledge denominational differences when needed, never claim to replace a pastor or counselor, and return JSON with title, answer, references.', messages: [{ role: 'user', content: question }] }),
    });
    if (!response.ok) throw new Error(`AI provider returned ${response.status}`);
      const data: any = await response.json();
    const text = (data.content || []).map((block: { text?: string }) => block.text || '').join('').replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || text);
    return { ...parsed, mode: 'live' as const };
  } catch (error) {
    console.error('[voice] provider failed; using fallback', error);
    return fallbackAnswer(question);
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return sendJson(res, 204, {});
  const url = new URL(req.url || '/', `http://localhost:${PORT}`);
  if (req.method === 'GET' && url.pathname === '/health') {
    return sendJson(res, 200, { service: 'voice', status: 'ok', aiMode: process.env.ANTHROPIC_API_KEY ? 'live' : 'dev-fallback' });
  }
  if (req.method === 'POST' && url.pathname === '/api/voice/answer') {
    try {
      const body = await readJson(req);
      const question = typeof body.question === 'string' ? body.question.trim() : '';
      if (!question || question.length > 2_000) return sendJson(res, 400, { error: 'question is required and must be under 2,000 characters' });
      await resolveIdentity(req, typeof body.deviceId === 'string' ? body.deviceId : undefined);
      return sendJson(res, 200, { response: await answerQuestion(question) });
    } catch (error) {
      return sendJson(res, 401, { error: String(error instanceof Error ? error.message : error) });
    }
  }
  return sendJson(res, 404, { error: 'route not found' });
});

server.listen(PORT, () => console.log(`Voice microservice listening on ${PORT}`));
