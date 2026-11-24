import "dotenv/config";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import type { Request, Response } from "express";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Domain & Adaptive Configuration ---
const DOMAIN_TO_GAME_MAP: Record<string, string> = {
  "Memory & Attention": "memory_match",
  "Pattern Recognition & Attention": "pattern_rhythm",
  "Memory & Recall": "family_recall",
  Recall: "memory_lane",
  "Pattern Recognition": "complete_the_pattern",
};

const VALID_DIFFICULTIES = ["beginner", "moderate", "advanced", "pro"] as const;
const VALID_GAMES = Object.values(DOMAIN_TO_GAME_MAP);
const VALID_DOMAINS = Object.keys(DOMAIN_TO_GAME_MAP);
const SUPPORTED_LANGUAGES = new Set(["en", "bn", "hi"]);

interface PatientRecord {
  id: string;
  name: string;
  age: number;
  birthYear: number;
  region: string;
  language: string;
  baselineScore: number;
}

interface DomainStatRecord {
  patientId: string;
  domain: string;
  runningAvg: number;
  baseline: number;
  updatedAt: string;
}

interface GameSessionRecord {
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
}

// --- In-Memory Seed Store ---
const patients = new Map<string, PatientRecord>([
  [
    "p1",
    {
      id: "p1",
      name: "Anand Sharma",
      age: 74,
      birthYear: 1952,
      region: "Northern & Eastern India",
      language: "en",
      baselineScore: 78,
    },
  ],
  [
    "p2",
    {
      id: "p2",
      name: "Savitri Devi",
      age: 71,
      birthYear: 1955,
      region: "Bengal & Delhi",
      language: "bn",
      baselineScore: 72,
    },
  ],
  [
    "p3",
    {
      id: "p3",
      name: "Dr. Ramesh Roy",
      age: 79,
      birthYear: 1947,
      region: "Kolkata",
      language: "bn",
      baselineScore: 84,
    },
  ],
]);

const domainStats = new Map<string, DomainStatRecord[]>();
const gameSessions: GameSessionRecord[] = [];
const ttsAudioCache = new Map<string, Buffer>();

function seedDomainStats(patientId: string): DomainStatRecord[] {
  const now = new Date().toISOString();
  const initial: DomainStatRecord[] = [
    { patientId, domain: "Memory & Attention", runningAvg: 82, baseline: 78, updatedAt: now },
    { patientId, domain: "Pattern Recognition & Attention", runningAvg: 76, baseline: 74, updatedAt: now },
    { patientId, domain: "Memory & Recall", runningAvg: 80, baseline: 75, updatedAt: now },
    { patientId, domain: "Recall", runningAvg: 86, baseline: 80, updatedAt: now },
    { patientId, domain: "Pattern Recognition", runningAvg: 79, baseline: 76, updatedAt: now },
  ];
  domainStats.set(patientId, initial);
  return initial;
}

seedDomainStats("p1");
seedDomainStats("p2");
seedDomainStats("p3");

// --- Adaptive Rules ---
function updateRunningAverage(oldAverage: number, score: number): number {
  const newAvg = Math.round(oldAverage * 0.7 + score * 0.3);
  return Math.max(0, Math.min(100, newAvg));
}

function calculateNextDifficulty(
  currentDifficulty: string,
  scorePct: number
): { nextDifficulty: string; action: "increased" | "decreased" | "maintained"; explanation: string } {
  const diff = VALID_DIFFICULTIES.includes(currentDifficulty.toLowerCase() as (typeof VALID_DIFFICULTIES)[number])
    ? currentDifficulty.toLowerCase()
    : "beginner";

  if (scorePct >= 70) {
    if (diff === "beginner") {
      return {
        nextDifficulty: "moderate",
        action: "increased",
        explanation: "Great recall! Advancing to moderate practice.",
      };
    }
    if (diff === "moderate") {
      return {
        nextDifficulty: "pro",
        action: "increased",
        explanation: "Excellent engagement! Moving to pro exercises.",
      };
    }
    return {
      nextDifficulty: "pro",
      action: "maintained",
      explanation: "Outstanding performance! Maintaining top level.",
    };
  }

  if (scorePct < 40) {
    if (diff === "advanced" || diff === "pro") {
      return {
        nextDifficulty: "moderate",
        action: "decreased",
        explanation: "Adjusting to a gentler pace with supportive practice.",
      };
    }
    if (diff === "moderate") {
      return {
        nextDifficulty: "beginner",
        action: "decreased",
        explanation: "Adjusting to comfortable beginner exercises.",
      };
    }
    return {
      nextDifficulty: "beginner",
      action: "maintained",
      explanation: "Continuing gentle practice at this foundational level.",
    };
  }

  const targetDiff = diff === "advanced" ? "pro" : diff;
  return {
    nextDifficulty: targetDiff,
    action: "maintained",
    explanation: "Steady performance! Continuing at current pace.",
  };
}

function getDomainStatusLabel(runningAvg: number): "Needs Practice" | "Stable" | "Strong" {
  if (runningAvg < 70) return "Needs Practice";
  if (runningAvg >= 82) return "Strong";
  return "Stable";
}

// --- OLS Ridge Regression Analytics ---
function solveOlsRidge(X: number[][], y: number[], l2 = 0.01): number[] {
  const n = X.length;
  if (n === 0) return [];
  const p = X[0].length;

  const XTX: number[][] = Array.from({ length: p }, (_, i) =>
    Array.from({ length: p }, (_, j) => {
      let sum = 0;
      for (let k = 0; k < n; k++) {
        sum += X[k][i] * X[k][j];
      }
      return sum + (i === j && i > 0 ? l2 : 0);
    })
  );

  const XTy: number[] = Array.from({ length: p }, (_, i) => {
    let sum = 0;
    for (let k = 0; k < n; k++) {
      sum += X[k][i] * y[k];
    }
    return sum;
  });

  const M = XTX.map((row, i) => [...row, XTy[i]]);

  for (let i = 0; i < p; i++) {
    let maxRow = i;
    for (let r = i + 1; r < p; r++) {
      if (Math.abs(M[r][i]) > Math.abs(M[maxRow][i])) {
        maxRow = r;
      }
    }
    [M[i], M[maxRow]] = [M[maxRow], M[i]];

    const pivot = M[i][i];
    if (Math.abs(pivot) < 1e-12) continue;

    for (let j = i; j <= p; j++) {
      M[i][j] /= pivot;
    }

    for (let r = 0; r < p; r++) {
      if (r !== i) {
        const factor = M[r][i];
        for (let j = i; j <= p; j++) {
          M[r][j] -= factor * M[i][j];
        }
      }
    }
  }

  return M.map((row) => row[p]);
}

function encodeDifficulty(diff: string): number {
  const d = (diff || "").toLowerCase();
  if (d === "pro" || d === "advanced") return 3.0;
  if (d === "moderate") return 2.0;
  return 1.0;
}

function extractFeatures(
  session: GameSessionRecord,
  runningAvg: number
): [number, number, number, number, number] {
  const score = Number(session.score ?? 75);
  const acc = Number(session.accuracy ?? score);
  const timeTaken = Number(session.timeTaken ?? 60);
  const timeScore = Math.max(20.0, Math.min(100.0, 100.0 - timeTaken * 0.5));
  const diffVal = encodeDifficulty(session.difficulty);
  return [score, runningAvg, acc, timeScore, diffVal];
}

function trainCognitiveRegression(sessions: GameSessionRecord[], currentRunningAvg = 78) {
  const featureNames = [
    "Previous Score (X1)",
    "7-Day Rolling Avg (X2)",
    "Accuracy (X3)",
    "Time Efficiency (X4)",
    "Difficulty Level (X5)",
  ];

  const sortedSessions = [...sessions].sort((a, b) => a.date.localeCompare(b.date));
  const nSessions = sortedSessions.length;

  if (nSessions < 3) {
    const fallbackIntercept = 18.0;
    const fallbackCoeffs = {
      "Previous Score (X1)": 0.35,
      "7-Day Rolling Avg (X2)": 0.35,
      "Accuracy (X3)": 0.12,
      "Time Efficiency (X4)": 0.08,
      "Difficulty Level (X5)": 0.8,
    };
    const latest = sortedSessions[nSessions - 1];
    let predicted = currentRunningAvg;
    if (latest) {
      const [x1, x2, x3, x4, x5] = extractFeatures(latest, currentRunningAvg);
      predicted = fallbackIntercept + 0.35 * x1 + 0.35 * x2 + 0.12 * x3 + 0.08 * x4 + 0.8 * x5;
    }

    return {
      status: "prior_baseline",
      sampleSize: nSessions,
      trainedPairs: 0,
      featureNames,
      coefficients: fallbackCoeffs,
      intercept: fallbackIntercept,
      rSquared: 0.72,
      rmse: 4.5,
      predictedNextScore: Math.max(40, Math.min(100, Math.round(predicted))),
      historicalPairs: [],
      formula: "Y = 18.0 + 0.35*X1 + 0.35*X2 + 0.12*X3 + 0.08*X4 + 0.8*X5",
    };
  }

  const X: number[][] = [];
  const y: number[] = [];
  const historicalPairs: Record<string, number>[] = [];
  let rolling = Number(sortedSessions[0].score ?? 75);

  for (let i = 0; i < sortedSessions.length - 1; i++) {
    const curr = sortedSessions[i];
    const nxt = sortedSessions[i + 1];
    const [x1, x2, x3, x4, x5] = extractFeatures(curr, rolling);
    const targetY = Number(nxt.score ?? 75);

    X.push([1.0, x1, x2, x3, x4, x5]);
    y.push(targetY);

    historicalPairs.push({
      sessionIndex: i + 1,
      previousScore: Math.round(x1 * 10) / 10,
      rollingAvg: Math.round(x2 * 10) / 10,
      accuracy: Math.round(x3 * 10) / 10,
      timeScore: Math.round(x4 * 10) / 10,
      difficulty: Math.round(x5 * 10) / 10,
      actualNextScore: Math.round(targetY * 10) / 10,
    });

    rolling = Math.round(rolling * 0.7 + Number(curr.score ?? 75) * 0.3);
  }

  let b = solveOlsRidge(X, y, 0.01);
  if (!b || b.length < 6) {
    b = [15.0, 0.35, 0.35, 0.12, 0.08, 0.8];
  }

  const yMean = y.reduce((acc, val) => acc + val, 0) / y.length;
  const ssTot = y.reduce((acc, val) => acc + (val - yMean) ** 2, 0);
  const ssRes = X.reduce((acc, row, i) => {
    const pred = row.reduce((s, val, j) => s + val * b[j], 0);
    return acc + (y[i] - pred) ** 2;
  }, 0);

  const rSquared = ssTot > 1e-9 ? Math.max(0, Math.min(1, 1 - ssRes / ssTot)) : 0;
  const rmse = Math.sqrt(ssRes / y.length);

  const latest = sortedSessions[nSessions - 1];
  const [lx1, lx2, lx3, lx4, lx5] = extractFeatures(latest, currentRunningAvg);
  const predicted = b[0] + b[1] * lx1 + b[2] * lx2 + b[3] * lx3 + b[4] * lx4 + b[5] * lx5;

  const round4 = (v: number) => Math.round(v * 10000) / 10000;
  const round2 = (v: number) => Math.round(v * 100) / 100;
  const round1 = (v: number) => Math.round(v * 10) / 10;

  return {
    status: "trained_ols",
    sampleSize: nSessions,
    trainedPairs: y.length,
    featureNames,
    coefficients: {
      "Previous Score (X1)": round4(b[1]),
      "7-Day Rolling Avg (X2)": round4(b[2]),
      "Accuracy (X3)": round4(b[3]),
      "Time Efficiency (X4)": round4(b[4]),
      "Difficulty Level (X5)": round4(b[5]),
    },
    intercept: Math.round(b[0] * 1000) / 1000,
    rSquared: Math.round(rSquared * 1000) / 1000,
    rmse: round2(rmse),
    predictedNextScore: Math.max(40, Math.min(100, Math.round(predicted))),
    historicalPairs,
    formula: `Y = ${round1(b[0])} + ${round2(b[1])}*X1 + ${round2(b[2])}*X2 + ${round2(b[3])}*X3 + ${round2(b[4])}*X4 + ${round2(b[5])}*X5`,
  };
}

function getHybridDifficultyRecommendation(predictedScore: number, currentDifficulty: string) {
  const diff = (currentDifficulty || "beginner").toLowerCase();
  const normalized = ["beginner", "moderate", "pro", "advanced"].includes(diff) ? diff : "beginner";

  if (predictedScore >= 75) {
    if (normalized === "beginner") {
      return {
        suggestedDifficulty: "moderate",
        action: "advancing",
        explanation: "Regression model predicts strong engagement (score ≥ 75%). Ready for Moderate challenge.",
      };
    }
    if (normalized === "moderate") {
      return {
        suggestedDifficulty: "pro",
        action: "advancing",
        explanation: "Predicted score indicates high cognitive retention. Advancing to Pro practice.",
      };
    }
    return {
      suggestedDifficulty: "pro",
      action: "maintaining",
      explanation: "Consistent top-tier cognitive trajectory. Maintaining Pro practice.",
    };
  }

  if (predictedScore < 45) {
    if (normalized === "pro" || normalized === "advanced") {
      return {
        suggestedDifficulty: "moderate",
        action: "adjusting",
        explanation: "Forecast suggests a gentler pace is supportive. Moving to Moderate exercises.",
      };
    }
    if (normalized === "moderate") {
      return {
        suggestedDifficulty: "beginner",
        action: "adjusting",
        explanation: "Offering comfortable foundational engagement at Beginner level.",
      };
    }
    return {
      suggestedDifficulty: "beginner",
      action: "maintaining",
      explanation: "Continuing gentle foundational practice with steady support.",
    };
  }

  const target = normalized === "advanced" ? "pro" : normalized;
  return {
    suggestedDifficulty: target,
    action: "maintaining",
    explanation: `Forecast indicates steady performance (${predictedScore}%). Continuing comfortably at ${target.charAt(0).toUpperCase() + target.slice(1)}.`,
  };
}

// --- Express App Setup ---
async function startServer() {
  const app = express();
  app.use(express.json());

  // Health Check
  app.get("/api/v1/health", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      version: "1.0.0",
      app: "RECALLED Cognitive Backend Slice",
    });
  });

  // Sync non-sensitive patient shell for newly onboarded/registered patients
  app.post("/api/v1/patients/sync", (req: Request, res: Response) => {
    const body = req.body || {};
    const id = String(body.id || "").trim();
    const name = String(body.name || "").trim();
    if (!id || !name) {
      return res.status(400).json({ detail: "Patient id and name are required." });
    }

    const numericAge = Number(body.age);
    const safeAge = !Number.isNaN(numericAge) && numericAge > 0 && numericAge <= 125 ? numericAge : 70;
    const numericBirthYear = Number(body.birthYear);
    const safeBirthYear =
      !Number.isNaN(numericBirthYear) && numericBirthYear > 1900
        ? numericBirthYear
        : new Date().getFullYear() - safeAge;
    const lang = SUPPORTED_LANGUAGES.has(String(body.language || "en"))
      ? String(body.language)
      : "en";

    const record: PatientRecord = {
      id,
      name,
      age: safeAge,
      birthYear: safeBirthYear,
      region: String(body.region || "India"),
      language: lang,
      baselineScore: Number(body.baselineScore) || 75,
    };

    patients.set(id, record);
    if (!domainStats.has(id)) {
      seedDomainStats(id);
    }

    return res.status(200).json({ ok: true, patient: record });
  });

  // Save Game Result
  app.post("/api/v1/games/results", (req: Request, res: Response) => {
    const body = req.body || {};
    const {
      id,
      patientId,
      gameId,
      domain,
      score,
      timeTaken,
      difficulty,
      result = "completed",
      date,
      accuracy,
      attempts,
      mistakes,
    } = body;

    if (!patientId || !patients.has(patientId)) {
      return res.status(404).json({
        detail: `Patient with ID '${patientId}' does not exist.`,
      });
    }

    if (!VALID_DOMAINS.includes(domain)) {
      return res.status(400).json({
        detail: `Invalid cognitive domain '${domain}'. Must be one of: ${VALID_DOMAINS.join(", ")}`,
      });
    }

    if (!VALID_GAMES.includes(gameId)) {
      return res.status(400).json({
        detail: `Invalid gameId '${gameId}'. Must be one of: ${VALID_GAMES.join(", ")}`,
      });
    }

    const normDiff = String(difficulty || "").toLowerCase();
    if (!VALID_DIFFICULTIES.includes(normDiff as (typeof VALID_DIFFICULTIES)[number])) {
      return res.status(400).json({
        detail: `Invalid difficulty '${difficulty}'. Must be: ${VALID_DIFFICULTIES.join(", ")}`,
      });
    }

    const numericScore = Number(score);
    if (Number.isNaN(numericScore) || numericScore < 0 || numericScore > 100) {
      return res.status(400).json({ detail: "Score must be between 0 and 100." });
    }

    const sessionId = id || `gs-${Date.now()}`;
    const existing = gameSessions.find((s) => s.id === sessionId);
    const statsList = domainStats.get(patientId) || seedDomainStats(patientId);

    if (existing) {
      const stat = statsList.find((s) => s.domain === domain);
      const currentAvg = stat ? stat.runningAvg : numericScore;
      const adaptive = calculateNextDifficulty(existing.difficulty, existing.score);
      const sortedStats = [...statsList].sort((a, b) => a.runningAvg - b.runningAvg);
      const weakest = sortedStats[0] || stat;

      const weakestInfo = {
        domain: weakest ? weakest.domain : domain,
        statusLabel: getDomainStatusLabel(weakest ? weakest.runningAvg : currentAvg),
        recommendedGameId: DOMAIN_TO_GAME_MAP[weakest ? weakest.domain : domain] || "memory_match",
        runningAvg: weakest ? weakest.runningAvg : currentAvg,
        baseline: weakest ? weakest.baseline : 70,
      };

      return res.status(201).json({
        session: existing,
        updatedDomainAverage: {
          domain,
          runningAvg: currentAvg,
          previousAvg: currentAvg,
        },
        nextDifficulty: adaptive.nextDifficulty,
        adaptiveAction: adaptive.action,
        adaptiveExplanation: adaptive.explanation,
        weakestDomain: weakestInfo,
        recommendedGame: weakestInfo.recommendedGameId,
      });
    }

    const sessionRecord: GameSessionRecord = {
      id: sessionId,
      patientId,
      gameId,
      domain,
      score: numericScore,
      timeTaken: Number(timeTaken ?? 0),
      difficulty: normDiff,
      result,
      date: date || new Date().toISOString(),
      accuracy: accuracy !== undefined ? Number(accuracy) : undefined,
      attempts: attempts !== undefined ? Number(attempts) : undefined,
      mistakes: mistakes !== undefined ? Number(mistakes) : undefined,
    };
    gameSessions.push(sessionRecord);

    let stat = statsList.find((s) => s.domain === domain);
    let previousAvg = numericScore;
    if (stat) {
      previousAvg = stat.runningAvg;
      stat.runningAvg = updateRunningAverage(previousAvg, numericScore);
      stat.updatedAt = new Date().toISOString();
    } else {
      stat = {
        patientId,
        domain,
        runningAvg: numericScore,
        baseline: numericScore,
        updatedAt: new Date().toISOString(),
      };
      statsList.push(stat);
    }

    const adaptive = calculateNextDifficulty(normDiff, numericScore);
    const sortedStats = [...statsList].sort((a, b) => a.runningAvg - b.runningAvg);
    const weakest = sortedStats[0] || stat;

    const weakestInfo = {
      domain: weakest.domain,
      statusLabel: getDomainStatusLabel(weakest.runningAvg),
      recommendedGameId: DOMAIN_TO_GAME_MAP[weakest.domain] || "memory_match",
      runningAvg: weakest.runningAvg,
      baseline: weakest.baseline,
    };

    return res.status(201).json({
      session: sessionRecord,
      updatedDomainAverage: {
        domain,
        runningAvg: stat.runningAvg,
        previousAvg,
      },
      nextDifficulty: adaptive.nextDifficulty,
      adaptiveAction: adaptive.action,
      adaptiveExplanation: adaptive.explanation,
      weakestDomain: weakestInfo,
      recommendedGame: weakestInfo.recommendedGameId,
    });
  });

  // Get Game Sessions
  app.get("/api/v1/games/sessions", (req: Request, res: Response) => {
    const patientId = String(req.query.patientId || "");
    if (!patientId || !patients.has(patientId)) {
      return res.status(404).json({ detail: `Patient with ID '${patientId}' not found.` });
    }

    const records = gameSessions
      .filter((s) => s.patientId === patientId)
      .sort((a, b) => b.date.localeCompare(a.date));

    res.json(records);
  });

  // Get Recommendations
  app.get("/api/v1/games/recommendations", (req: Request, res: Response) => {
    const patientId = String(req.query.patientId || "");
    if (!patientId || !patients.has(patientId)) {
      return res.status(404).json({ detail: `Patient with ID '${patientId}' not found.` });
    }

    const stats = domainStats.get(patientId) || seedDomainStats(patientId);
    const domainScores = stats.map((s) => ({
      domain: s.domain,
      statusLabel: getDomainStatusLabel(s.runningAvg),
      recommendedGameId: DOMAIN_TO_GAME_MAP[s.domain] || "memory_match",
      runningAvg: s.runningAvg,
      baseline: s.baseline,
    }));

    const sortedDomains = [...domainScores].sort((a, b) => a.runningAvg - b.runningAvg);
    const weakest = sortedDomains[0];

    const latestSession = gameSessions
      .filter((s) => s.patientId === patientId && s.gameId === weakest.recommendedGameId)
      .sort((a, b) => b.date.localeCompare(a.date))[0];

    res.json({
      patientId,
      domainScores,
      weakestDomain: weakest,
      recommendedGame: weakest.recommendedGameId,
      currentDifficulty: latestSession ? latestSession.difficulty : "beginner",
    });
  });

  // Regression Analytics
  app.get("/api/v1/analytics/regression", (req: Request, res: Response) => {
    const patientId = String(req.query.patientId || "");
    const patient = patients.get(patientId);
    if (!patientId || !patient) {
      return res.status(404).json({ detail: `Patient with ID '${patientId}' not found.` });
    }

    const sessions = gameSessions
      .filter((s) => s.patientId === patientId)
      .sort((a, b) => a.date.localeCompare(b.date));

    const stats = domainStats.get(patientId) || seedDomainStats(patientId);
    const avgScore = stats.length
      ? Math.round(stats.reduce((sum, s) => sum + s.runningAvg, 0) / stats.length)
      : 78;

    const regResult = trainCognitiveRegression(sessions, avgScore);
    const latestDiff = sessions.length > 0 ? sessions[sessions.length - 1].difficulty : "beginner";
    const hybridRec = getHybridDifficultyRecommendation(regResult.predictedNextScore, latestDiff);

    res.json({
      patientId,
      regression: regResult,
      hybridRecommendation: hybridRec,
      currentBaseline: patient.baselineScore,
      currentAverage: avgScore,
    });
  });

  // Text-to-Speech Proxy (ElevenLabs with graceful 503 fallback to browser Web Speech)
  const handleTts = async (req: Request, res: Response) => {
    const { text, language = "en", gender = "female" } = req.body || {};
    const cleanText = String(text || "").trim();

    if (!cleanText) {
      return res.status(400).json({ detail: "Text cannot be empty." });
    }
    if (cleanText.length > 400) {
      return res.status(400).json({
        detail: `Text length (${cleanText.length} characters) exceeds 400 character limit.`,
      });
    }

    let normLang = String(language || "en").trim().toLowerCase();
    if (normLang.includes("-")) {
      normLang = normLang.split("-")[0];
    }
    if (!SUPPORTED_LANGUAGES.has(normLang)) {
      return res.status(400).json({
        detail: `Unsupported language '${language}'. Supported languages: en (English), bn (Bengali), hi (Hindi).`,
      });
    }

    const apiKey = (process.env.ELEVENLABS_API_KEY || "").trim();
    const femaleVoiceId = (process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM").trim();
    const maleVoiceId = (process.env.ELEVENLABS_MALE_VOICE_ID || "pNInz6obpgDQGcFmaJgB").trim();
    const normGender = String(gender || "female").trim().toLowerCase();
    const voiceId = normGender === "male" && maleVoiceId ? maleVoiceId : femaleVoiceId;

    const cacheKey = crypto
      .createHash("sha256")
      .update(`${voiceId}:${normLang}:${cleanText}`)
      .digest("hex");

    const cached = ttsAudioCache.get(cacheKey);
    if (cached && cached.length > 0) {
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("X-Cache", "HIT");
      res.setHeader("Cache-Control", "public, max-age=86400");
      return res.send(cached);
    }

    if (!apiKey) {
      return res.status(503).json({
        detail: "ElevenLabs TTS service is not configured. (ELEVENLABS_API_KEY missing)",
      });
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const upstream = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`,
        {
          method: "POST",
          headers: {
            "xi-api-key": apiKey,
            "Content-Type": "application/json",
            Accept: "audio/mpeg",
          },
          body: JSON.stringify({
            text: cleanText,
            model_id: "eleven_multilingual_v2",
            voice_settings: {
              stability: 0.65,
              similarity_boost: 0.8,
              style: 0.05,
              use_speaker_boost: true,
            },
          }),
          signal: controller.signal,
        }
      );
      clearTimeout(timeout);

      if (!upstream.ok) {
        return res.status(502).json({
          detail: `ElevenLabs TTS service returned status ${upstream.status}.`,
        });
      }

      const arrayBuf = await upstream.arrayBuffer();
      const audioBuffer = Buffer.from(arrayBuf);
      if (!audioBuffer.length) {
        return res.status(502).json({
          detail: "Received empty audio from ElevenLabs TTS service.",
        });
      }

      ttsAudioCache.set(cacheKey, audioBuffer);
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("X-Cache", "MISS");
      res.setHeader("Cache-Control", "public, max-age=86400");
      return res.send(audioBuffer);
    } catch {
      return res.status(502).json({
        detail: "Failed to communicate with ElevenLabs TTS service.",
      });
    }
  };

  app.post("/api/tts", handleTts);
  app.post("/api/v1/tts", handleTts);

  // Vite middleware in development, static assets in production
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, "dist");
    app.use(express.static(distDir));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, "index.html"));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, "0.0.0.0", () => {
    console.log(`RECALLED server running at http://0.0.0.0:${port}`);
  });
}

startServer();
