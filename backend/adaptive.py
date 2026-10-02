from typing import Dict, Tuple

# Domain to Game Mapping matching src/utils/adaptive.ts
DOMAIN_TO_GAME_MAP: Dict[str, str] = {
    "Memory & Attention": "memory_match",
    "Pattern Recognition & Attention": "pattern_rhythm",
    "Memory & Recall": "family_recall",
    "Recall": "memory_lane",
    "Pattern Recognition": "complete_the_pattern",
}

VALID_DIFFICULTIES = ["beginner", "moderate", "advanced"]
VALID_GAMES = list(DOMAIN_TO_GAME_MAP.values())
VALID_DOMAINS = list(DOMAIN_TO_GAME_MAP.keys())


def update_running_average(old_average: int, score: int) -> int:
    """
    Verified rule from RECALLED specification:
    newAverage = round(oldAverage * 0.7 + score * 0.3)
    """
    new_avg = round(old_average * 0.7 + score * 0.3)
    return max(0, min(100, int(new_avg)))


def calculate_next_difficulty(current_difficulty: str, score_pct: int) -> Tuple[str, str, str]:
    """
    Adaptive difficulty calculation matching src/utils/adaptive.ts:
    - Score >= 70: increase difficulty by one level (clamped at advanced)
    - Score < 40: decrease difficulty by one level (clamped at beginner)
    - Otherwise: maintain current level
    Returns: (next_difficulty, action, explanation)
    """
    diff = current_difficulty.lower()
    if diff not in VALID_DIFFICULTIES:
        diff = "beginner"

    if score_pct >= 70:
        if diff == "beginner":
            return ("moderate", "increased", "Great recall! Advancing to moderate practice.")
        if diff == "moderate":
            return ("advanced", "increased", "Excellent engagement! Moving to advanced exercises.")
        return ("advanced", "maintained", "Outstanding performance! Maintaining top level.")

    if score_pct < 40:
        if diff == "advanced":
            return ("moderate", "decreased", "Adjusting to a gentler pace with supportive practice.")
        if diff == "moderate":
            return ("beginner", "decreased", "Adjusting to comfortable beginner exercises.")
        return ("beginner", "maintained", "Continuing gentle practice at this foundational level.")

    return (diff, "maintained", "Steady performance! Continuing at current pace.")


def get_domain_status_label(running_avg: int) -> str:
    """Non-diagnostic status label matching src/utils/adaptive.ts."""
    if running_avg < 70:
        return "Needs Practice"
    elif running_avg >= 82:
        return "Strong"
    return "Stable"
