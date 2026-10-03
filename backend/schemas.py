from typing import List, Optional
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = "ok"
    version: str = "1.0.0"
    app: str = "RECALLED Cognitive Backend Slice"


class GameResultSubmission(BaseModel):
    id: Optional[str] = Field(default=None, description="Client-generated unique session ID for idempotency")
    patientId: str = Field(..., description="ID of patient e.g. p1")
    gameId: str = Field(..., description="Game identifier e.g. memory_match")
    domain: str = Field(..., description="Cognitive domain e.g. Memory & Attention")
    score: int = Field(..., ge=0, le=100, description="Score percentage 0 to 100")
    timeTaken: int = Field(..., ge=0, description="Seconds taken to finish")
    difficulty: str = Field(..., description="beginner, moderate, or advanced")
    result: str = Field(default="completed", description="completed or abandoned")
    date: Optional[str] = Field(default=None, description="ISO timestamp")


class GameSessionResponse(BaseModel):
    id: str
    patientId: str
    gameId: str
    domain: str
    score: int
    timeTaken: int
    difficulty: str
    result: str
    date: str


class UpdatedDomainAverage(BaseModel):
    domain: str
    runningAvg: int
    previousAvg: int


class DomainScoreInfo(BaseModel):
    domain: str
    statusLabel: str
    recommendedGameId: str
    runningAvg: int
    baseline: int


class GameResultResponse(BaseModel):
    session: GameSessionResponse
    updatedDomainAverage: UpdatedDomainAverage
    nextDifficulty: str
    adaptiveAction: str
    adaptiveExplanation: str
    weakestDomain: DomainScoreInfo
    recommendedGame: str


class RecommendationsResponse(BaseModel):
    patientId: str
    domainScores: List[DomainScoreInfo]
    weakestDomain: DomainScoreInfo
    recommendedGame: str
    currentDifficulty: str


class TTSRequest(BaseModel):
    text: str = Field(..., description="Text content to synthesize (up to 400 characters)")
    language: str = Field(default="en", description="Target language code: en, bn, or hi")
    gender: Optional[str] = Field(default="female", description="Voice gender preference: female or male")
