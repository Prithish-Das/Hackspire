from contextlib import asynccontextmanager
from datetime import datetime, timezone
import hashlib
import logging
import os
from pathlib import Path
from typing import List, Optional
import uuid

from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
import httpx
from sqlmodel import Session, select

try:
    from .adaptive import (
        DOMAIN_TO_GAME_MAP,
        VALID_DIFFICULTIES,
        VALID_DOMAINS,
        VALID_GAMES,
        calculate_next_difficulty,
        get_domain_status_label,
        update_running_average,
    )
    from .database import get_session, init_db
    from .models import DomainStat, GameSessionRecord, Patient
    from .schemas import (
        DomainScoreInfo,
        GameResultResponse,
        GameResultSubmission,
        GameSessionResponse,
        HealthResponse,
        RecommendationsResponse,
        TTSRequest,
        UpdatedDomainAverage,
    )
except (ImportError, ValueError):
    from adaptive import (
        DOMAIN_TO_GAME_MAP,
        VALID_DIFFICULTIES,
        VALID_DOMAINS,
        VALID_GAMES,
        calculate_next_difficulty,
        get_domain_status_label,
        update_running_average,
    )
    from database import get_session, init_db
    from models import DomainStat, GameSessionRecord, Patient
    from schemas import (
        DomainScoreInfo,
        GameResultResponse,
        GameResultSubmission,
        GameSessionResponse,
        HealthResponse,
        RecommendationsResponse,
        TTSRequest,
        UpdatedDomainAverage,
    )

logger = logging.getLogger("recalled.tts")

BASE_DIR = Path(__file__).resolve().parent
ENV_PATH = BASE_DIR / ".env"
if ENV_PATH.exists():
    try:
        from dotenv import load_dotenv
        load_dotenv(dotenv_path=ENV_PATH)
    except ImportError:
        with open(ENV_PATH, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    k, v = k.strip(), v.strip().strip("'\"")
                    if k not in os.environ:
                        os.environ[k] = v

TTS_CACHE_DIR_DEFAULT = BASE_DIR / "audio_cache"
SUPPORTED_LANGUAGES = {"en", "bn", "hi"}


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database and seed initial patient data
    init_db()
    yield


# Ensure tables and seed data exist on load
init_db()

app = FastAPI(
    title="RECALLED — Cognitive Care Companion API",
    description="Non-diagnostic rule-based backend slice for cognitive game sessions and adaptive recommendations.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Configuration for local development
allowed_origins_env = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173",
)
allowed_origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/api/v1/health", response_model=HealthResponse, tags=["Health"])
def health_check():
    """Simple health check endpoint returning system status."""
    return HealthResponse(
        status="ok",
        version="1.0.0",
        app="RECALLED Cognitive Backend Slice",
    )


@app.post(
    "/api/v1/games/results",
    response_model=GameResultResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Games"],
)
def save_game_result(
    submission: GameResultSubmission,
    db: Session = Depends(get_session),
):
    """
    Validate and save a completed cognitive game session.
    Idempotent: if client submits an existing session ID, return existing record.
    Updates domain running average and computes next rule-based difficulty.
    """
    # 1. Validate Patient Existence
    patient = db.get(Patient, submission.patientId)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID '{submission.patientId}' does not exist.",
        )

    # 2. Validate Domain and Game
    if submission.domain not in VALID_DOMAINS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid cognitive domain '{submission.domain}'. Must be one of: {VALID_DOMAINS}",
        )
    if submission.gameId not in VALID_GAMES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid gameId '{submission.gameId}'. Must be one of: {VALID_GAMES}",
        )

    # 3. Validate Difficulty
    difficulty = submission.difficulty.lower()
    if difficulty not in VALID_DIFFICULTIES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid difficulty '{submission.difficulty}'. Must be: {VALID_DIFFICULTIES}",
        )

    # 4. Check for Idempotency / Existing Session by ID
    session_id = submission.id or f"gs-{int(datetime.now(timezone.utc).timestamp() * 1000)}"
    existing_session = db.get(GameSessionRecord, session_id)
    if existing_session:
        # Fetch current domain stats to return consistent response
        stat = db.exec(
            select(DomainStat).where(
                DomainStat.patient_id == submission.patientId,
                DomainStat.domain == submission.domain,
            )
        ).first()
        current_avg = stat.running_avg if stat else submission.score
        next_diff, action, explanation = calculate_next_difficulty(
            existing_session.difficulty, existing_session.score
        )
        domain_stats_list = db.exec(
            select(DomainStat).where(DomainStat.patient_id == submission.patientId)
        ).all()
        sorted_stats = sorted(domain_stats_list, key=lambda s: s.running_avg)
        weakest = sorted_stats[0] if sorted_stats else stat

        weakest_info = DomainScoreInfo(
            domain=weakest.domain if weakest else submission.domain,
            statusLabel=get_domain_status_label(weakest.running_avg if weakest else current_avg),
            recommendedGameId=DOMAIN_TO_GAME_MAP.get(weakest.domain if weakest else submission.domain, "memory_match"),
            runningAvg=weakest.running_avg if weakest else current_avg,
            baseline=weakest.baseline if weakest else 70,
        )

        return GameResultResponse(
            session=GameSessionResponse(
                id=existing_session.id,
                patientId=existing_session.patient_id,
                gameId=existing_session.game_id,
                domain=existing_session.domain,
                score=existing_session.score,
                timeTaken=existing_session.time_taken,
                difficulty=existing_session.difficulty,
                result=existing_session.result,
                date=existing_session.date,
            ),
            updatedDomainAverage=UpdatedDomainAverage(
                domain=submission.domain,
                runningAvg=current_avg,
                previousAvg=current_avg,
            ),
            nextDifficulty=next_diff,
            adaptiveAction=action,
            adaptiveExplanation=explanation,
            weakestDomain=weakest_info,
            recommendedGame=weakest_info.recommendedGameId,
        )

    # 5. Persist the New Game Session
    session_record = GameSessionRecord(
        id=session_id,
        patient_id=submission.patientId,
        game_id=submission.gameId,
        domain=submission.domain,
        score=submission.score,
        time_taken=submission.timeTaken,
        difficulty=difficulty,
        result=submission.result,
        date=submission.date or datetime.now(timezone.utc).isoformat(),
    )
    db.add(session_record)

    # 6. Update Running Average for the Domain
    stat = db.exec(
        select(DomainStat).where(
            DomainStat.patient_id == submission.patientId,
            DomainStat.domain == submission.domain,
        )
    ).first()

    if stat:
        previous_avg = stat.running_avg
        stat.running_avg = update_running_average(previous_avg, submission.score)
        stat.updated_at = datetime.now(timezone.utc).isoformat()
        db.add(stat)
    else:
        previous_avg = submission.score
        stat = DomainStat(
            patient_id=submission.patientId,
            domain=submission.domain,
            running_avg=submission.score,
            baseline=submission.score,
        )
        db.add(stat)

    db.commit()
    db.refresh(session_record)
    db.refresh(stat)

    # 7. Calculate Next Difficulty for this game
    next_diff, action, explanation = calculate_next_difficulty(difficulty, submission.score)

    # 8. Find Weakest Domain for Recommendations
    all_domain_stats = db.exec(
        select(DomainStat).where(DomainStat.patient_id == submission.patientId)
    ).all()
    sorted_domains = sorted(all_domain_stats, key=lambda s: s.running_avg)
    weakest_stat = sorted_domains[0] if sorted_domains else stat

    weakest_info = DomainScoreInfo(
        domain=weakest_stat.domain,
        statusLabel=get_domain_status_label(weakest_stat.running_avg),
        recommendedGameId=DOMAIN_TO_GAME_MAP.get(weakest_stat.domain, "memory_match"),
        runningAvg=weakest_stat.running_avg,
        baseline=weakest_stat.baseline,
    )

    return GameResultResponse(
        session=GameSessionResponse(
            id=session_record.id,
            patientId=session_record.patient_id,
            gameId=session_record.game_id,
            domain=session_record.domain,
            score=session_record.score,
            timeTaken=session_record.time_taken,
            difficulty=session_record.difficulty,
            result=session_record.result,
            date=session_record.date,
        ),
        updatedDomainAverage=UpdatedDomainAverage(
            domain=submission.domain,
            runningAvg=stat.running_avg,
            previousAvg=previous_avg,
        ),
        nextDifficulty=next_diff,
        adaptiveAction=action,
        adaptiveExplanation=explanation,
        weakestDomain=weakest_info,
        recommendedGame=weakest_info.recommendedGameId,
    )


@app.get(
    "/api/v1/games/sessions",
    response_model=List[GameSessionResponse],
    tags=["Games"],
)
def get_patient_game_sessions(
    patientId: str = Query(..., description="ID of patient e.g. p1"),
    db: Session = Depends(get_session),
):
    """Retrieve saved game sessions for a specific patient, ordered newest first."""
    patient = db.get(Patient, patientId)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID '{patientId}' not found.",
        )

    records = db.exec(
        select(GameSessionRecord)
        .where(GameSessionRecord.patient_id == patientId)
        .order_by(GameSessionRecord.date.desc())
    ).all()

    return [
        GameSessionResponse(
            id=r.id,
            patientId=r.patient_id,
            gameId=r.game_id,
            domain=r.domain,
            score=r.score,
            timeTaken=r.time_taken,
            difficulty=r.difficulty,
            result=r.result,
            date=r.date,
        )
        for r in records
    ]


@app.get(
    "/api/v1/games/recommendations",
    response_model=RecommendationsResponse,
    tags=["Games"],
)
def get_patient_recommendations(
    patientId: str = Query(..., description="ID of patient e.g. p1"),
    db: Session = Depends(get_session),
):
    """
    Retrieve domain performance scores, calculate the weakest domain,
    and return the deterministic next recommended exercise.
    """
    patient = db.get(Patient, patientId)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID '{patientId}' not found.",
        )

    stats = db.exec(
        select(DomainStat).where(DomainStat.patient_id == patientId)
    ).all()

    if not stats:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No domain statistics found for patient '{patientId}'.",
        )

    domain_scores = [
        DomainScoreInfo(
            domain=s.domain,
            statusLabel=get_domain_status_label(s.running_avg),
            recommendedGameId=DOMAIN_TO_GAME_MAP.get(s.domain, "memory_match"),
            runningAvg=s.running_avg,
            baseline=s.baseline,
        )
        for s in stats
    ]

    # Weakest domain is the one with the lowest runningAvg
    sorted_domains = sorted(domain_scores, key=lambda d: d.runningAvg)
    weakest = sorted_domains[0]

    # Find the latest difficulty for the recommended game or default to beginner
    latest_session = db.exec(
        select(GameSessionRecord)
        .where(
            GameSessionRecord.patient_id == patientId,
            GameSessionRecord.game_id == weakest.recommendedGameId,
        )
        .order_by(GameSessionRecord.date.desc())
    ).first()

    current_diff = latest_session.difficulty if latest_session else "beginner"

    return RecommendationsResponse(
        patientId=patientId,
        domainScores=domain_scores,
        weakestDomain=weakest,
        recommendedGame=weakest.recommendedGameId,
        currentDifficulty=current_diff,
    )


@app.post("/api/tts", tags=["TTS"])
@app.post("/api/v1/tts", tags=["TTS"])
async def synthesize_speech(request: TTSRequest):
    """
    Server-side proxy to ElevenLabs Text-to-Speech API with on-disk caching.
    - Limits text to <= 400 characters (returns 400 if exceeded or empty)
    - Validates supported languages (en, bn, hi)
    - Caches synthesized audio on disk using SHA-256 hash (never leaks personal data or secrets)
    - Selects warm, calm voice settings tailored for an older adult companion
    - Protects credentials (API key is never returned or logged)
    """
    # 1. Validate Text input
    clean_text = (request.text or "").strip()
    if not clean_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text cannot be empty.",
        )
    if len(clean_text) > 400:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Text length ({len(clean_text)} characters) exceeds 400 character limit.",
        )

    # 2. Validate Language input
    norm_lang = (request.language or "en").strip().lower()
    if "-" in norm_lang:
        norm_lang = norm_lang.split("-")[0]
    if norm_lang not in SUPPORTED_LANGUAGES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported language '{request.language}'. Supported languages: en (English), bn (Bengali), hi (Hindi).",
        )

    # 3. Read Environment Configuration dynamically
    api_key = os.environ.get("ELEVENLABS_API_KEY", "").strip()
    female_voice_id = os.environ.get("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM").strip()
    male_voice_id = os.environ.get("ELEVENLABS_MALE_VOICE_ID", "pNInz6obpgDQGcFmaJgB").strip()

    gender = (request.gender or "female").strip().lower()
    voice_id = male_voice_id if gender == "male" and male_voice_id else female_voice_id

    # 4. Safe configurable disk cache
    cache_dir_str = os.environ.get("TTS_CACHE_DIR", str(TTS_CACHE_DIR_DEFAULT))
    cache_dir = Path(cache_dir_str)
    cache_dir.mkdir(parents=True, exist_ok=True)

    # Deterministic SHA-256 hash: contains only voice_id, normalized language, and text
    # Filename contains NO personal information, user IDs, or credentials
    cache_key = hashlib.sha256(f"{voice_id}:{norm_lang}:{clean_text}".encode("utf-8")).hexdigest()
    cache_file = cache_dir / f"{cache_key}.mp3"

    # Return cached audio if present
    if cache_file.is_file() and cache_file.stat().st_size > 0:
        return FileResponse(
            path=str(cache_file),
            media_type="audio/mpeg",
            headers={
                "X-Cache": "HIT",
                "Cache-Control": "public, max-age=86400",
            },
        )

    # 5. Check if ElevenLabs is configured; return 503 so frontend gracefully falls back to browser TTS
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ElevenLabs TTS service is not configured. (ELEVENLABS_API_KEY missing)",
        )

    # 6. Upstream ElevenLabs API call
    elevenlabs_url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"

    # Calm, friendly, respectful companion voice settings:
    # - model: eleven_multilingual_v2 (supports en, bn, hi with natural cadence)
    # - stability: 0.65 (reassuring, steady pacing without sudden volume/pitch swings)
    # - similarity_boost: 0.80 (warm, authentic tone)
    # - style: 0.05 (conversational and respectful, avoids exaggerated dramatics)
    payload = {
        "text": clean_text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.65,
            "similarity_boost": 0.80,
            "style": 0.05,
            "use_speaker_boost": True,
        },
    }
    headers = {
        "xi-api-key": api_key,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
    }
    params = {
        "output_format": "mp3_44100_128",
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                elevenlabs_url,
                headers=headers,
                params=params,
                json=payload,
            )
    except Exception as exc:
        logger.warning("TTS request failed to connect to ElevenLabs: %s", type(exc).__name__)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to communicate with ElevenLabs TTS service.",
        )

    if response.status_code != 200:
        logger.warning("ElevenLabs API returned error status: %d", response.status_code)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"ElevenLabs TTS service returned status {response.status_code}.",
        )

    audio_bytes = response.content
    if not audio_bytes:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Received empty audio from ElevenLabs TTS service.",
        )

    # 7. Write to cache atomically
    try:
        temp_file = cache_file.with_suffix(".tmp")
        with open(temp_file, "wb") as f:
            f.write(audio_bytes)
        temp_file.replace(cache_file)
    except Exception as write_err:
        logger.warning("Could not persist audio cache: %s", write_err)

    return Response(
        content=audio_bytes,
        media_type="audio/mpeg",
        headers={
            "X-Cache": "MISS",
            "Cache-Control": "public, max-age=86400",
        },
    )
