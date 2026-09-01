/**
 * ABX — Registro canónico de heads.
 *
 * Cada head está anclado a un módulo cognitivo C.R.O.W.N. real
 * (SOPHIA, ORION, ARGUS, ISA) y reutiliza el motor de intención y
 * política del núcleo. Alpha propone; Beta del mismo dominio evalúa.
 */

import {
  assessIntent,
  createDefaultContext,
  evaluatePolicy,
  type IntentAssessment,
  type PolicyAssessment,
  type RiskLevel,
} from "@/lib/crown";
import { evidenceScore, weightedScore } from "./scoring";
import { scanProposal } from "./policy";
import type {
  AbxAssessment,
  AbxEvidence,
  AbxHead,
  AbxProposal,
  AbxRequestContext,
  AbxRisk,
} from "./types";

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function crownRiskToAbx(risk: RiskLevel): AbxRisk {
  switch (risk) {
    case "R4_critical":
      return "critical";
    case "R3_high":
      return "high";
    case "R2_moderate":
      return "normal";
    default:
      return "low";
  }
}

interface CrownAnalysis {
  intent: IntentAssessment;
  policy: PolicyAssessment;
}

function analyze(ctx: AbxRequestContext): CrownAnalysis {
  const requestContext = createDefaultContext(ctx.input, {
    locale: ctx.locale,
    source: "user",
  });
  const intent = assessIntent(ctx.input);
  const policy = evaluatePolicy(requestContext, intent);
  return { intent, policy };
}

function buildEvidence(
  head: string,
  analysis: CrownAnalysis,
  ctx: AbxRequestContext,
): AbxEvidence[] {
  const evidence: AbxEvidence[] = [
    {
      id: uid("ev"),
      kind: "policy",
      reference: `crown:policy:${analysis.policy.status}:${analysis.policy.risk}`,
      quality: analysis.policy.rulesChecked.length > 0 ? 0.95 : 0.5,
      fresh: 1,
    },
    {
      id: uid("ev"),
      kind: "tool",
      reference: `crown:intent:${analysis.intent.category}:${analysis.intent.action}`,
      quality: analysis.intent.confidence,
      fresh: 1,
    },
  ];

  if (analysis.intent.signals.length > 0) {
    evidence.push({
      id: uid("ev"),
      kind: "source",
      reference: `signals:${analysis.intent.signals.slice(0, 4).join("|")}`,
      quality: Math.min(1, 0.4 + analysis.intent.signals.length * 0.12),
      fresh: 0.9,
    });
  }

  evidence.push({
    id: uid("ev"),
    kind: "test",
    reference: `head:${head}:deadline:${ctx.deadlineMs}ms`,
    quality: ctx.deadlineMs >= 500 ? 0.9 : 0.6,
    fresh: 1,
  });

  return evidence;
}

function betaFor(
  headId: string,
  baseline: { safety: number; execution: number; consistency: number },
) {
  return async (
    ctx: AbxRequestContext,
    proposal: AbxProposal,
  ): Promise<AbxAssessment> => {
    const analysis = analyze(ctx);
    const violations = scanProposal(proposal);
    const contradictions: string[] = [];
    const requiredEvidence: string[] = [];

    if (analysis.policy.status === "denied") violations.push("CROWN_DENIED");
    if (analysis.policy.humanApprovalRequired) {
      requiredEvidence.push("human:approval");
    }
    if (crownRiskToAbx(analysis.policy.risk) !== proposal.risk) {
      contradictions.push(
        `RISK_DIVERGENCE:${analysis.policy.risk}!=${proposal.risk}`,
      );
    }
    if (analysis.policy.missingInformation.length > 0) {
      requiredEvidence.push(...analysis.policy.missingInformation);
    }

    const evidence = evidenceScore(proposal.evidence);
    const policyScore =
      analysis.policy.status === "allowed"
        ? 1
        : analysis.policy.status === "denied"
          ? 0
          : 0.6;

    const scores = {
      epistemic: Math.min(1, analysis.intent.confidence * 0.6 + evidence * 0.4),
      evidence,
      safety: violations.length > 0 ? 0.2 : baseline.safety,
      policy: policyScore,
      consistency:
        contradictions.length > 0 ? 0.35 : baseline.consistency,
      execution: baseline.execution,
    };

    const total = weightedScore(scores);

    return {
      proposalId: proposal.proposalId,
      head: headId,
      decision:
        violations.length > 0 ? "reject" : total >= 0.8 ? "commit" : "repair",
      reason:
        violations.length > 0
          ? `Beta/${headId} detectó violaciones de política.`
          : `Beta/${headId} evaluó la propuesta con puntaje ${total.toFixed(3)}.`,
      violations,
      contradictions,
      requiredEvidence,
      scores,
      weightedScore: total,
    };
  };
}

function alphaFor(
  headId: string,
  compose: (ctx: AbxRequestContext, analysis: CrownAnalysis) => string,
) {
  return async (ctx: AbxRequestContext): Promise<AbxProposal> => {
    const analysis = analyze(ctx);
    const actions = ctx.requestedCapabilities.filter((c) =>
      c.startsWith(`${headId.toLowerCase()}:`),
    );

    return {
      proposalId: uid("prop"),
      head: headId,
      content: compose(ctx, analysis),
      actions,
      evidence: buildEvidence(headId, analysis, ctx),
      risk: crownRiskToAbx(analysis.policy.risk),
      createdAt: new Date().toISOString(),
    };
  };
}

export const ABX_HEADS: readonly AbxHead[] = Object.freeze([
  {
    id: "SOPHIA",
    label: "Epistemología y razonamiento",
    capabilities: ["sophia:analyze", "sophia:synthesize", "knowledge:read"],
    alpha: alphaFor(
      "SOPHIA",
      (ctx, a) =>
        `Análisis epistémico de la intención "${a.intent.category}" (acción ${a.intent.action}). ` +
        `Confianza declarada ${(a.intent.confidence * 100).toFixed(0)}%. ` +
        `Señales: ${a.intent.signals.slice(0, 5).join(", ") || "ninguna"}. ` +
        `Entrada evaluada: ${ctx.input.slice(0, 320)}`,
    ),
    beta: betaFor("SOPHIA", { safety: 0.9, execution: 0.82, consistency: 0.9 }),
  },
  {
    id: "ORION",
    label: "Ejecución y síntesis operativa",
    capabilities: ["orion:execute", "orion:generate", "tool:invoke"],
    alpha: alphaFor(
      "ORION",
      (ctx, a) =>
        `Plan de ejecución para ${a.intent.action} sobre ${a.intent.target ?? "objetivo no declarado"}. ` +
        `Reversible: ${a.intent.reversible ? "sí" : "no"}. Efecto externo: ${a.intent.externalEffect ? "sí" : "no"}. ` +
        `Capacidades solicitadas: ${ctx.requestedCapabilities.join(", ")}.`,
    ),
    beta: betaFor("ORION", { safety: 0.82, execution: 0.94, consistency: 0.84 }),
  },
  {
    id: "ARGUS",
    label: "Gobernanza, defensa y veto",
    capabilities: ["argus:audit", "argus:veto", "human:approval"],
    alpha: alphaFor(
      "ARGUS",
      (_ctx, a) =>
        `Dictamen de gobernanza: estado ${a.policy.status}, riesgo ${a.policy.risk}. ` +
        `Reglas verificadas: ${a.policy.rulesChecked.length}. ` +
        `Motivos: ${a.policy.reasons.slice(0, 4).join(" · ") || "sin observaciones"}.`,
    ),
    beta: betaFor("ARGUS", { safety: 0.97, execution: 0.7, consistency: 0.95 }),
  },
  {
    id: "ISA",
    label: "Presencia, tono y modulación",
    capabilities: ["isa:respond", "isa:translate", "communication:write"],
    alpha: alphaFor(
      "ISA",
      (ctx, a) =>
        `Modulación expresiva en ${ctx.locale} para una intención ${a.intent.category}. ` +
        `Tono soberano, claro y territorial; sin certeza falsa cuando exista incertidumbre.`,
    ),
    beta: betaFor("ISA", { safety: 0.88, execution: 0.86, consistency: 0.88 }),
  },
]);

export function selectHeads(capabilities: string[]): AbxHead[] {
  const matched = ABX_HEADS.filter((head) =>
    head.capabilities.some((c) => capabilities.includes(c)),
  );
  if (matched.length > 0) return [...matched];
  const fallback = ABX_HEADS[0];
  return fallback ? [fallback] : [];
}
