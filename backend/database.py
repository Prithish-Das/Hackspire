import os
from pathlib import Path
from typing import Generator
from sqlmodel import Session, SQLModel, create_engine, select

try:
    from .models import DomainStat, Patient
except (ImportError, ValueError):
    from models import DomainStat, Patient

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "recalled.db"
DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{DB_PATH}")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
)


def init_db() -> None:
    """Create all tables and seed patient p1 with baseline stats if not present."""
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        # Check if patient p1 exists
        p1 = session.get(Patient, "p1")
        if not p1:
            p1 = Patient(
                id="p1",
                name="Anand Sharma",
                age=74,
                birth_year=1952,
                region="Northern & Eastern India",
                language="en",
                baseline_score=78,
            )
            session.add(p1)

        # Seed initial domain baselines matching frontend/src/data/initialData.ts
        initial_domains = [
            {"domain": "Memory & Attention", "running_avg": 82, "baseline": 78},
            {"domain": "Pattern Recognition & Attention", "running_avg": 76, "baseline": 74},
            {"domain": "Memory & Recall", "running_avg": 80, "baseline": 75},
            {"domain": "Recall", "running_avg": 86, "baseline": 80},
            {"domain": "Pattern Recognition", "running_avg": 79, "baseline": 76},
        ]

        for item in initial_domains:
            existing = session.exec(
                select(DomainStat).where(
                    DomainStat.patient_id == "p1",
                    DomainStat.domain == item["domain"],
                )
            ).first()
            if not existing:
                stat = DomainStat(
                    patient_id="p1",
                    domain=item["domain"],
                    running_avg=item["running_avg"],
                    baseline=item["baseline"],
                )
                session.add(stat)

        session.commit()


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
