# RECALLED — Backend Slice (FastAPI + SQLModel + SQLite)

This backend slice provides a deterministic, rule-based API for cognitive game sessions and personalized exercise recommendations for **RECALLED**.

> **Important Safety & Scope Notice:**  
> This backend is a **non-diagnostic cognitive-care companion**. It does not perform disease detection, clinical diagnosis, clinical predictions, or medical assessments.  
> This slice is intended for **local development and demonstration**. Authentication is deliberately omitted in this first slice and it is not suitable for real patient Protected Health Information (PHI) or production deployment without adding authentication, TLS, and authorization guards.

---

## Architecture Overview

- **Framework:** FastAPI
- **ORM / Models:** SQLModel (Pydantic + SQLAlchemy)
- **Database:** SQLite (`backend/recalled.db`)
- **Seeded Data:** Patient `p1` (Anand Sharma) and 5 cognitive domain baselines matching `frontend/src/data/initialData.ts`.

---

## Setup & Running Locally

### 1. Prerequisites
- Python 3.10+
- `pip` or virtual environment

### 2. Installation
From the repository root or `backend/` directory:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Start the Server
```bash
# From the backend directory:
uvicorn main:app --reload --port 8001 --host 0.0.0.0

# Or from project root:
uvicorn backend.main:app --reload --port 8001 --host 0.0.0.0
```

The API will be available at `http://127.0.0.1:8001`.  
Interactive Swagger documentation is available at `http://127.0.0.1:8001/docs`.

---

## Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/health` | Health status and version check |
| `POST` | `/api/v1/games/results` | Save a completed game session, update running average (`round(old * 0.7 + score * 0.3)`), and compute next difficulty |
| `GET` | `/api/v1/games/sessions?patientId=p1` | Retrieve historical game sessions for a patient |
| `GET` | `/api/v1/games/recommendations?patientId=p1` | Retrieve domain averages, weakest domain, and next recommended game |

---

## CORS Configuration
Allowed origins can be configured using the `ALLOWED_ORIGINS` environment variable (comma-separated):
```bash
export ALLOWED_ORIGINS="http://localhost:3000,http://127.0.0.1:3000"
```
Default origins include `http://localhost:3000`, `http://127.0.0.1:3000`, and Vite development ports.
