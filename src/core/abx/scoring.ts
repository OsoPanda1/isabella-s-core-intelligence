/**
 * ABX — Scoring determinista.
 *
 * Ponderación fija y auditable: cualquier cambio de pesos
 * es un cambio de política y debe versionarse.
 */

import type { AbxDecision, AbxEvidence, AbxScores } from "./types";

export const ABX_WEIGHTS: Readonly<Record<keyof AbxScores, number>> = Object.freeze({
  epistemic: 0.25,
  evidence: 0.2,
  safety: 0.2,
  policy: 0.15,
  consistency: 0.1,
  execution: 0.1,
});

export const ABX_THRESHOLDS = Object.freeze({
  commit: 0.9,
  commitWithNotice: 0.8,
  repair: 0.65,
  degrade: 0.4,
});

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export function weightedScore(scores: AbxScores): number {
  const total =
    ABX_WEIGHTS.epistemic * clamp01(scores.epistemic) +
    ABX_WEIGHTS.evidence * clamp01(scores.evidence) +
    ABX_WEIGHTS.safety * clamp01(scores.safety) +
    ABX_WEIGHTS.policy * clamp01(scores.policy) +
    ABX_WEIGHTS.consistency * clamp01(scores.consistency) +
    ABX_WEIGHTS.execution * clamp01(scores.execution);
  return clamp01(total);
}

/** Calidad agregada de la evidencia: media de quality * fresh. */
export function evidenceScore(evidence: AbxEvidence[]): number {
  if (evidence.length === 0) return 0;
  const sum = evidence.reduce(
    (acc, item) => acc + clamp01(item.quality) * clamp01(item.fresh),
    0,
  );
  return clamp01(sum / evidence.length);
}

/** Consenso entre heads: 1 - dispersión normalizada. */
export function consensusScore(values: number[]): number {
  if (values.length <= 1) return 1;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / values.length;
  return clamp01(1 - Math.sqrt(variance) * 2);
}

export function decideFromScore(
  score: number,
  hasIssues: boolean,
  critical = false,
): AbxDecision {
  if (critical) return "escalate";
  if (hasIssues && score >= ABX_THRESHOLDS.repair) return "repair";
  if (score >= ABX_THRESHOLDS.commit) return "commit";
  if (score >= ABX_THRESHOLDS.commitWithNotice) return "commit_with_notice";
  if (score >= ABX_THRESHOLDS.repair) return "repair";
  if (score >= ABX_THRESHOLDS.degrade) return "degrade";
  return "reject";
}
