import { CognitiveDomain, DifficultyLevel, GameId, GameSession } from "../types";

export interface BackendGameResultResponse {
  session: {
    id: string;
    patientId: string;
    gameId: string;
    domain: string;
    score: number;
    timeTaken: number;
    difficulty: string;
    result: string;
    date: string;
    accuracy?: number;
    attempts?: number;
    mistakes?: number;
  };
  updatedDomainAverage: {
    domain: string;
    runningAvg: number;
    previousAvg: number;
  };
  nextDifficulty: DifficultyLevel;
  adaptiveAction: "increased" | "decreased" | "maintained";
  adaptiveExplanation: string;
  weakestDomain: {
    domain: CognitiveDomain;
    statusLabel: "Needs Practice" | "Stable" | "Strong";
    recommendedGameId: GameId;
    runningAvg: number;
    baseline: number;
  };
  recommendedGame: GameId;
}

export interface BackendRecommendationsResponse {
  patientId: string;
  domainScores: {
    domain: CognitiveDomain;
    statusLabel: "Needs Practice" | "Stable" | "Strong";
    recommendedGameId: GameId;
    runningAvg: number;
    baseline: number;
  }[];
  weakestDomain: {
    domain: CognitiveDomain;
    statusLabel: "Needs Practice" | "Stable" | "Strong";
    recommendedGameId: GameId;
    runningAvg: number;
    baseline: number;
  };
  recommendedGame: GameId;
  currentDifficulty: DifficultyLevel;
}

// In development, Vite proxies /api to http://127.0.0.1:8000
const API_BASE_URL = "/api/v1";

/**
 * Checks if the FastAPI backend is running and healthy.
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${API_BASE_URL}/health`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!res.ok) return false;
    const data = await res.json();
    return data.status === "ok";
  } catch {
    return false;
  }
}

/**
 * Submits a completed game session to the backend slice.
 * Returns null if the backend is unreachable or returns an error.
 */
export async function submitGameResultToBackend(
  session: GameSession
): Promise<BackendGameResultResponse | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const payload = {
      id: session.id,
      patientId: session.patientId,
      gameId: session.gameId,
      domain: session.domain,
      score: session.score,
      timeTaken: session.timeTaken,
      difficulty: session.difficulty,
      result: session.result,
      date: session.date,
      accuracy: session.accuracy,
      attempts: session.attempts,
      mistakes: session.mistakes
    };

    const res = await fetch(`${API_BASE_URL}/games/results`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`[Backend API] /games/results responded with status ${res.status}`);
      return null;
    }

    const data: BackendGameResultResponse = await res.json();
    return data;
  } catch (err) {
    console.info("[Backend API] Backend unavailable, using local storage fallback:", err);
    return null;
  }
}

/**
 * Fetches domain recommendations from the backend slice.
 */
export async function fetchBackendRecommendations(
  patientId: string
): Promise<BackendRecommendationsResponse | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(`${API_BASE_URL}/games/recommendations?patientId=${encodeURIComponent(patientId)}`, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const data: BackendRecommendationsResponse = await res.json();
    return data;
  } catch {
    return null;
  }
}
