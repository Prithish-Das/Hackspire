from datetime import datetime, timezone
from typing import Optional
from sqlmodel import Field, SQLModel


class Patient(SQLModel, table=True):
    id: str = Field(default="p1", primary_key=True, index=True)
    name: str
    age: int
    birth_year: int
    region: str
    language: str = "en"
    baseline_score: int = 78


class DomainStat(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    patient_id: str = Field(index=True)
    domain: str
    running_avg: int
    baseline: int
    updated_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )


class GameSessionRecord(SQLModel, table=True):
    id: str = Field(primary_key=True, index=True)
    patient_id: str = Field(index=True)
    game_id: str
    domain: str
    score: int
    time_taken: int
    difficulty: str
    result: str = "completed"
    date: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
