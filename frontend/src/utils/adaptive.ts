import { CognitiveDomain, DifficultyLevel, GameId, DomainStats } from "../types";
import { getDomainStats } from "./storage";

export interface AdaptiveResult {
  nextDifficulty: DifficultyLevel;
  action: "increased" | "decreased" | "maintained";
  explanation: string;
}

/**
 * Spec rule:
 * performance ≥70% → increase difficulty
 * <40% → decrease + same-level practice item
 * otherwise maintain
 */
export function calculateNextDifficulty(
  currentDifficulty: DifficultyLevel,
  scorePct: number
): AdaptiveResult {
  if (scorePct >= 70) {
    if (currentDifficulty === "beginner") {
      return {
        nextDifficulty: "moderate",
        action: "increased",
        explanation: "Great recall! Advancing to moderate practice."
      };
    }
    if (currentDifficulty === "moderate") {
      return {
        nextDifficulty: "pro",
        action: "increased",
        explanation: "Excellent engagement! Moving to pro exercises."
      };
    }
    return {
      nextDifficulty: "pro",
      action: "maintained",
      explanation: "Outstanding performance! Maintaining top level."
    };
  }

  if (scorePct < 40) {
    if (currentDifficulty === "advanced" || currentDifficulty === "pro") {
      return {
        nextDifficulty: "moderate",
        action: "decreased",
        explanation: "Adjusting to a gentler pace with supportive practice."
      };
    }
    if (currentDifficulty === "moderate") {
      return {
        nextDifficulty: "beginner",
        action: "decreased",
        explanation: "Adjusting to comfortable beginner exercises."
      };
    }
    return {
      nextDifficulty: "beginner",
      action: "maintained",
      explanation: "Continuing gentle practice at this foundational level."
    };
  }

  const targetDiff = currentDifficulty === "advanced" ? "pro" : currentDifficulty;
  return {
    nextDifficulty: targetDiff,
    action: "maintained",
    explanation: "Steady performance! Continuing at current pace."
  };
}

export interface DomainRecommendation {
  domain: CognitiveDomain;
  statusLabel: "Needs Practice" | "Stable" | "Strong";
  recommendedGameId: GameId;
  runningAvg: number;
}

const DOMAIN_TO_GAME_MAP: Record<CognitiveDomain, GameId> = {
  "Memory & Attention": "memory_match",
  "Pattern Recognition & Attention": "pattern_rhythm",
  "Memory & Recall": "family_recall",
  "Recall": "memory_lane",
  "Pattern Recognition": "complete_the_pattern"
};

/**
 * Calculates domain status and identifies the weakest domain for recommendations.
 * Uses strictly non-diagnostic phrasing.
 */
export function getDomainRecommendations(patientId: string): {
  recommendations: DomainRecommendation[];
  weakestDomain: DomainRecommendation;
} {
  const stats = getDomainStats(patientId);

  const list: DomainRecommendation[] = stats.map((item) => {
    let statusLabel: "Needs Practice" | "Stable" | "Strong" = "Stable";
    if (item.runningAvg < 70) {
      statusLabel = "Needs Practice";
    } else if (item.runningAvg >= 82) {
      statusLabel = "Strong";
    }

    return {
      domain: item.domain,
      statusLabel,
      recommendedGameId: DOMAIN_TO_GAME_MAP[item.domain] || "memory_match",
      runningAvg: item.runningAvg
    };
  });

  // Weakest domain is lowest runningAvg
  list.sort((a, b) => a.runningAvg - b.runningAvg);
  const weakestDomain = list[0] || {
    domain: "Memory & Attention",
    statusLabel: "Needs Practice",
    recommendedGameId: "memory_match",
    runningAvg: 70
  };

  return {
    recommendations: list,
    weakestDomain
  };
}
