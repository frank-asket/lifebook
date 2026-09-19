# Domain 2 - Service B: AI & Analytics Orchestration Service

Orchestrates multi-agent pipelines (Verse retrieval, devotional generation, theological safety review, crisis detection, and moderation).

## Port
- `8005`

## API Endpoints
- `POST /api/ai/checkin` — Run orchestrated check-in pipeline.
- `POST /api/ai/voice` — Scripture-grounded theological Q&A.
- `POST /api/ai/moderate` — Content moderation check.
- `GET /health` — Service health check.

## External AI Integrations
- Gemini API (`@google/genai`)
- Anthropic Claude API
