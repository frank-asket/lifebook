import os
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field
app = FastAPI(title="LifeBook Private AI Service", version="0.1.0")
class MeditationRequest(BaseModel):
    prayer: str = Field(min_length=1, max_length=5000)
    consent: bool
    request_id: str
@app.get('/health')
def health():
    return {"status": "ok"}
@app.post('/internal/meditations')
def generate(req: MeditationRequest, x_internal_token: str | None = Header(default=None)):
    secret = os.getenv('AI_INTERNAL_TOKEN')
    if not secret or secret == 'replace-with-long-random-secret' or x_internal_token != secret:
        raise HTTPException(status_code=401, detail='Unauthorized service')
    if not req.consent:
        raise HTTPException(status_code=403, detail='Explicit AI processing consent required')
    # Intentionally no LLM call: retrieval, scripture verification and safety review are NOT implemented.
    raise HTTPException(status_code=501, detail='AI generation not yet configured')
