import { ServiceUnavailableException } from '@nestjs/common';

type Fetch = typeof fetch;
const BASE = 'https://api.openai.com/v1';

/** Minimal OpenAI calls for guided meditation. Never logs prompts or outputs. */
export class OpenAiClient {
  constructor(private readonly fetcher: Fetch = fetch, private readonly timeoutMs = 30000) {}

  private key() {
    const key = process.env.OPENAI_API_KEY?.trim();
    if (!key) throw new ServiceUnavailableException('Guided meditation is not available yet');
    return key;
  }
  private async post<T>(path: string, body: unknown): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetcher(`${BASE}${path}`, { method: 'POST', signal: controller.signal, headers: { Authorization: `Bearer ${this.key()}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!response.ok) throw new Error(`AI provider HTTP ${response.status}`);
      return await response.json() as T;
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      throw new ServiceUnavailableException('Guided meditation is unavailable right now. Please try again later.');
    } finally { clearTimeout(timer); }
  }

  /** True when the provider's moderation model sees self-harm, violence or abuse. */
  async flagsRisk(text: string): Promise<boolean> {
    const result = await this.post<{ results: { flagged: boolean; categories: Record<string, boolean> }[] }>('/moderations', { model: 'omni-moderation-latest', input: text });
    const categories = result.results?.[0]?.categories ?? {};
    return ['self-harm', 'self-harm/intent', 'self-harm/instructions', 'violence', 'violence/graphic', 'sexual/minors', 'harassment/threatening']
      .some(name => categories[name] === true);
  }

  /** One structured completion. The schema is enforced by the provider (strict mode). */
  async structured<T>(input: { model: string; system: string; user: string; schemaName: string; schema: object; maxTokens: number }): Promise<T> {
    const result = await this.post<{ choices: { message: { content: string | null; refusal?: string | null }; finish_reason: string }[] }>('/chat/completions', {
      model: input.model, store: false, temperature: 0.7, max_tokens: input.maxTokens,
      messages: [{ role: 'system', content: input.system }, { role: 'user', content: input.user }],
      response_format: { type: 'json_schema', json_schema: { name: input.schemaName, strict: true, schema: input.schema } },
    });
    const choice = result.choices?.[0];
    if (!choice || choice.message.refusal || choice.finish_reason !== 'stop' || !choice.message.content) throw new ServiceUnavailableException('Guided meditation could not be written for this prayer. Please try again later.');
    try { return JSON.parse(choice.message.content) as T; } catch { throw new ServiceUnavailableException('Guided meditation is unavailable right now. Please try again later.'); }
  }
}
