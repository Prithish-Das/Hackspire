"""
Unit and integration tests for the RECALLED FastAPI backend slice.
Tests endpoints, database seeding, rule-based adaptive logic, idempotency, and error handling.
"""

import os
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine, select

from .adaptive import calculate_next_difficulty, update_running_average
from .database import get_session
from .main import app
from .models import DomainStat, GameSessionRecord, Patient


def test_adaptive_running_average_rule():
    # newAverage = round(oldAverage * 0.7 + score * 0.3)
    # e.g. old=82, score=90 -> 82*0.7 + 90*0.3 = 57.4 + 27.0 = 84.4 -> 84
    assert update_running_average(82, 90) == 84
    # e.g. old=80, score=50 -> 80*0.7 + 50*0.3 = 56.0 + 15.0 = 71.0 -> 71
    assert update_running_average(80, 50) == 71


def test_adaptive_difficulty_progression():
    # >= 70 increases
    next_diff, action, _ = calculate_next_difficulty("beginner", 85)
    assert next_diff == "moderate"
    assert action == "increased"

    next_diff, action, _ = calculate_next_difficulty("moderate", 70)
    assert next_diff == "advanced"
    assert action == "increased"

    # advanced clamped at max
    next_diff, action, _ = calculate_next_difficulty("advanced", 95)
    assert next_diff == "advanced"
    assert action == "maintained"

    # < 40 decreases
    next_diff, action, _ = calculate_next_difficulty("advanced", 35)
    assert next_diff == "moderate"
    assert action == "decreased"

    next_diff, action, _ = calculate_next_difficulty("moderate", 30)
    assert next_diff == "beginner"
    assert action == "decreased"

    # beginner clamped at min
    next_diff, action, _ = calculate_next_difficulty("beginner", 20)
    assert next_diff == "beginner"
    assert action == "maintained"

    # 40-69 maintains
    next_diff, action, _ = calculate_next_difficulty("moderate", 60)
    assert next_diff == "moderate"
    assert action == "maintained"


def test_api_health():
    client = TestClient(app)
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "RECALLED" in data["app"]


def test_api_seeded_patient_and_recommendations():
    client = TestClient(app)
    # Patient p1 seeded automatically
    response = client.get("/api/v1/games/recommendations?patientId=p1")
    assert response.status_code == 200
    data = response.json()
    assert data["patientId"] == "p1"
    assert len(data["domainScores"]) == 5
    # Weakest domain should have lowest score
    weakest = data["weakestDomain"]
    assert weakest["domain"] in [
        "Memory & Attention",
        "Pattern Recognition & Attention",
        "Memory & Recall",
        "Recall",
        "Pattern Recognition"
    ]
    assert data["recommendedGame"] is not None


def test_api_submit_result_and_idempotency():
    client = TestClient(app)
    session_id = f"test-session-{os.urandom(4).hex()}"

    payload = {
        "id": session_id,
        "patientId": "p1",
        "gameId": "memory_match",
        "domain": "Memory & Attention",
        "score": 90,
        "timeTaken": 42,
        "difficulty": "beginner",
        "result": "completed",
    }

    # First post creates record
    res1 = client.post("/api/v1/games/results", json=payload)
    assert res1.status_code == 201
    data1 = res1.json()
    assert data1["session"]["id"] == session_id
    assert data1["nextDifficulty"] == "moderate"
    assert data1["adaptiveAction"] == "increased"

    # Second post with identical ID is idempotent and does not create duplicate
    res2 = client.post("/api/v1/games/results", json=payload)
    assert res2.status_code == 201 or res2.status_code == 200
    data2 = res2.json()
    assert data2["session"]["id"] == session_id

    # Verify session appears in get sessions
    sessions_res = client.get("/api/v1/games/sessions?patientId=p1")
    assert sessions_res.status_code == 200
    sessions = sessions_res.json()
    matching = [s for s in sessions if s["id"] == session_id]
    assert len(matching) == 1


def test_api_error_validation():
    client = TestClient(app)

    # 404 on non-existent patient
    res_unknown_patient = client.post(
        "/api/v1/games/results",
        json={
            "patientId": "unknown_patient_999",
            "gameId": "memory_match",
            "domain": "Memory & Attention",
            "score": 80,
            "timeTaken": 30,
            "difficulty": "beginner"
        }
    )
    assert res_unknown_patient.status_code == 404

    # 422 on invalid score
    res_bad_score = client.post(
        "/api/v1/games/results",
        json={
            "patientId": "p1",
            "gameId": "memory_match",
            "domain": "Memory & Attention",
            "score": 150,
            "timeTaken": 30,
            "difficulty": "beginner"
        }
    )
    assert res_bad_score.status_code == 422

    # 400 on invalid domain
    res_bad_domain = client.post(
        "/api/v1/games/results",
        json={
            "patientId": "p1",
            "gameId": "memory_match",
            "domain": "NonExistentDomain",
            "score": 80,
            "timeTaken": 30,
            "difficulty": "beginner"
        }
    )
    assert res_bad_domain.status_code == 400


def test_api_tts_validation():
    client = TestClient(app)

    # 1. 400 on empty text
    res_empty = client.post("/api/tts", json={"text": "   ", "language": "en"})
    assert res_empty.status_code == 400
    assert "cannot be empty" in res_empty.json()["detail"].lower()

    # 2. 400 on text exceeding 400 characters
    long_text = "This is a very long string designed to test the 400 character restriction. " * 10
    assert len(long_text) > 400
    res_long = client.post("/api/tts", json={"text": long_text, "language": "en"})
    assert res_long.status_code == 400
    assert "exceeds 400 character" in res_long.json()["detail"]

    # 3. 400 on unsupported language
    res_unsupported_lang = client.post("/api/tts", json={"text": "Hello world", "language": "fr"})
    assert res_unsupported_lang.status_code == 400
    assert "Unsupported language" in res_unsupported_lang.json()["detail"]


def test_api_tts_service_unconfigured():
    client = TestClient(app)
    # Ensure ELEVENLABS_API_KEY is not set
    old_key = os.environ.get("ELEVENLABS_API_KEY")
    try:
        os.environ["ELEVENLABS_API_KEY"] = ""
        # Random unique text to ensure cache miss
        rand_text = f"Test missing key {os.urandom(8).hex()}"
        res = client.post("/api/tts", json={"text": rand_text, "language": "en"})
        assert res.status_code == 503
        assert "not configured" in res.json()["detail"]
    finally:
        if old_key is not None:
            os.environ["ELEVENLABS_API_KEY"] = old_key


def test_api_tts_disk_cache_hit(tmp_path):
    import hashlib
    from pathlib import Path
    client = TestClient(app)

    test_text = "Good morning Anand ji, time for your morning memory exercise."
    voice_id = "21m00Tcm4TlvDq8ikWAM"
    norm_lang = "en"

    cache_dir = tmp_path / "tts_cache"
    cache_dir.mkdir(parents=True, exist_ok=True)
    old_cache_dir = os.environ.get("TTS_CACHE_DIR")
    os.environ["TTS_CACHE_DIR"] = str(cache_dir)

    try:
        # Pre-seed cache with dummy mp3 bytes
        cache_key = hashlib.sha256(f"{voice_id}:{norm_lang}:{test_text}".encode("utf-8")).hexdigest()
        cache_file = cache_dir / f"{cache_key}.mp3"
        dummy_audio = b"ID3\x03\x00\x00\x00\x00\x00\x00FAKE_MP3_DATA"
        cache_file.write_bytes(dummy_audio)

        # Calling /api/tts should return cached file even without API key!
        res = client.post("/api/tts", json={"text": test_text, "language": "en"})
        assert res.status_code == 200
        assert res.headers.get("X-Cache") == "HIT"
        assert res.headers.get("content-type") == "audio/mpeg"
        assert res.content == dummy_audio
    finally:
        if old_cache_dir is not None:
            os.environ["TTS_CACHE_DIR"] = old_cache_dir
        else:
            os.environ.pop("TTS_CACHE_DIR", None)


if __name__ == "__main__":
    import tempfile
    from pathlib import Path
    print("Running tests...")
    test_adaptive_running_average_rule()
    test_adaptive_difficulty_progression()
    test_api_health()
    test_api_seeded_patient_and_recommendations()
    test_api_submit_result_and_idempotency()
    test_api_error_validation()
    test_api_tts_validation()
    test_api_tts_service_unconfigured()
    with tempfile.TemporaryDirectory() as td:
        test_api_tts_disk_cache_hit(Path(td))
    print("All backend tests passed successfully!")
