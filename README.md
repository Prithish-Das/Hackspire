# RECALLED — “Remember More. Live Better.”

A compassionate, culturally grounded cognitive-care and daily-living companion for older adults, their caregivers, and treating physicians.

> **Important Safety & Scope Notice:**  
> RECALLED is a supportive daily-living and cognitive-care companion. It is **not** a therapist, physician, or diagnostic medical device. It does not perform disease detection, clinical diagnosis, or medical interventions. All scoring reflects activity engagement and personal longitudinal consistency.

---

## Repository Structure

```text
Hackspire/
├── frontend/                            # React + Vite + TypeScript web application
│   ├── src/                             # Application source code
│   │   ├── assets/                      # Icons and static image assets
│   │   ├── components/                  # Role-based UI components (Patient, Caregiver, Doctor, Games)
│   │   ├── contexts/                    # Language and Speech context providers
│   │   ├── data/                        # Multilingual question banks and card decks
│   │   ├── i18n/                        # Trilingual translation dictionaries (English, Bengali, Hindi)
│   │   ├── services/                    # API client layer for backend communication
│   │   ├── utils/                       # Adaptive rules, speech synthesis, local storage fallback
│   │   ├── App.tsx                      # Root component and role router
│   │   └── types.ts                     # TypeScript data models and interfaces
│   ├── public/                          # Static browser assets
│   ├── index.html                       # Single-page HTML entry point
│   ├── package.json                     # Frontend dependencies and scripts
│   ├── tsconfig.json                    # TypeScript compiler configuration
│   ├── vite.config.ts                   # Vite bundler, Tailwind v4 plugin, and /api proxy configuration
│   └── .env.example                     # Frontend environment variable template
├── backend/                             # Python FastAPI + SQLModel backend service
│   ├── adaptive.py                      # Non-diagnostic adaptive difficulty and domain mapping
│   ├── database.py                      # SQLite database connection and initial patient seed fixtures
│   ├── main.py                          # FastAPI application and REST endpoints
│   ├── models.py                        # SQLModel database entity definitions
│   ├── schemas.py                       # Pydantic request/response schemas
│   ├── test_backend.py                  # Integration and unit test suite
│   ├── recalled.db                      # Local SQLite database
│   ├── requirements.txt                 # Backend Python dependencies
│   ├── README.md                        # Backend slice documentation
│   └── .env.example                     # Backend environment variable template
├── metadata.json                        # Application platform metadata
├── .gitignore                           # Repository git ignore rules
└── README.md                            # Main project documentation
```

---

## Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0+ (v20+ recommended)
- **Python**: v3.10+ (v3.11+ recommended)

---

### 1. Backend Setup & Run

#### A. Install Backend Dependencies
From the repository root:
```bash
# Optional: create a virtual environment
python -m venv backend/venv

# Activate the virtual environment
# On Windows (PowerShell):
backend\venv\Scripts\Activate.ps1
# On macOS/Linux:
source backend/venv/bin/activate

# Install requirements
pip install -r backend/requirements.txt
```

#### B. Run the Backend Server
From the repository root:
```bash
uvicorn backend.main:app --port 8001 --reload
```
Or from inside `backend/`:
```bash
cd backend
uvicorn main:app --port 8001 --reload
```
The FastAPI server will be live at `http://127.0.0.1:8001`.  
Swagger interactive API documentation is available at `http://127.0.0.1:8001/docs`.

#### C. Run Backend Tests
From the repository root:
```bash
python -m backend.test_backend
```

---

### 2. Frontend Setup & Run

#### A. Install Frontend Dependencies
From the repository root:
```bash
npm --prefix frontend install
```
Or from inside `frontend/`:
```bash
cd frontend
npm install
```

#### B. Start the Frontend Development Server
From the repository root:
```bash
npm --prefix frontend run dev
```
Or from inside `frontend/`:
```bash
cd frontend
npm run dev
```
The application will launch at `http://localhost:3000`.

#### C. Run Frontend Typecheck & Production Build
From the repository root:
```bash
# Type check:
npm --prefix frontend run lint

# Production build:
npm --prefix frontend run build
```

---

## Environment Variables

### Frontend (`frontend/.env.example`)
| Variable | Default | Purpose |
|---|---|---|
| `VITE_BACKEND_URL` | `http://127.0.0.1:8001` | Target URL for proxying `/api` requests to the FastAPI backend |
| `APP_URL` | `http://localhost:3000` | Host URL for the application |
| `GEMINI_API_KEY` | *(optional)* | Optional key for future direct multimodal AI capabilities |

### Backend (`backend/.env.example`)
| Variable | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./recalled.db` | SQLAlchemy/SQLModel connection string |
| `ALLOWED_ORIGINS` | `http://localhost:3000,...` | Comma-separated list of allowed CORS origins |
| `PORT` | `8001` | Default listening port |

---

## Core Features & Portals

1. **Patient Portal**:
   - Welcome dashboard with elder-friendly layout and text-to-speech.
   - Cognitive Health Index (CHI) visual gauge with non-diagnostic disclaimer.
   - Due medication, hydration, and meal reminders with large touch targets.
   - Five culturally grounded cognitive games (Memory Match, Pattern Rhythm, Family Recall, Memory Lane, Complete the Pattern).
   - Personal longitudinal progress tracking against individual baseline (no comparison with others).
   - SOS assistance notification and 4-4-4 calm breathing exercises.

2. **Caregiver Portal**:
   - Daily care chronological timeline tracking medication and meal adherence.
   - Weekly hydration chart comparing scheduled reminders against self-reported drinking confirmations.
   - Memory Album with photo upload and game enablement for family photo recall.
   - Doctor prescription review with one-click synchronization into daily reminder schedule.
   - Care notices and alert resolution log.

3. **Doctor Portal**:
   - Patient directory search and longitudinal cognitive trend views.
   - Synchronized 7-day memory score vs. care adherence chart.
   - Digital multi-item prescription generator.
   - Printable clinical performance summary report with non-diagnostic disclosure.

4. **Inclusivity & Accessibility**:
   - High-contrast mode, reduced motion toggle, and adjustable font sizes (Normal, Large, Extra Large).
   - Full trilingual support: **English**, **Bengali (বাংলা)**, and **Hindi (हिन्दी)**.
   - Web Speech API integration with Indian English, Bengali, and Hindi regional voice selection.
