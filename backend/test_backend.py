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


if __name__ == "__main__":
    print("Running tests...")
    test_adaptive_running_average_rule()
    test_adaptive_difficulty_progression()
    test_api_health()
    test_api_seeded_patient_and_recommendations()
    test_api_submit_result_and_idempotency()
    test_api_error_validation()
    print("All backend tests passed successfully!")
