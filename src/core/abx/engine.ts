/**
 * ABX — Motor de decisión dual.
 *
 * Ciclo: Authorize → Alpha (propone) → Beta (evalúa) → Consenso → Decisión.
 * Ninguna decisión se emite sin autorización, evaluación y trazabilidad.
 */

import { ABX_POLICY_VERSION, authorize, policyCheck } from "./policy";
import { selectHeads } from "./registry";
import { consensusScore, decideFromScore } from "./scoring";
import type {
  AbxAssessment,
  AbxProposal,
  AbxRequestContext,
  AbxResult,
  AbxRisk,
} from "./types";

export interface AbxInput {
  input: string;
  intent?: string;
  tenantId: string;
  principal: string;
  risk?: AbxRisk;
  requestedCapabilities?: string[];
  deadlineMs?: number;
  locale?: string;
  requestId?: string;
  traceId?: string;
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createAbxContext(input: AbxInput): AbxRequestContext {
  return {
    requestId: input.requestId ?? uid("req"),
    traceId: input.traceId ?? uid("tr"),
    tenantId: input.tenantId,
    principal: input.principal,
    input: input.input,
    intent: input.intent ?? "unspecified",
    risk: input.risk ?? "normal",
    requestedCapabilities: input.requestedCapabilities ?? ["sophia:analyze"],
    deadlineMs: input.deadlineMs ?? 2000,
    policyVersion: ABX_POLICY_VERSION,
    locale: input.locale ?? "es-MX",
    createdAt: new Date().toISOString(),
  };
}

function rejected(
  ctx: AbxRequestContext,
  code: string,
  detail: string,
  elapsedMs: number,
): AbxResult {
  return {
    decision: "reject",
    response: detail,
    confidence: 0,
    epistemicScore: 0,
    safetyScore: 0,
    policyScore: 0,
    consensusScore: 0,
    iterations: 0,
    proposals: [],
    assessments: [],
    warnings: [code],
    degraded: false,
    requiresHuman: code === "HUMAN_APPROVAL_REQUIRED",
    traceId: ctx.traceId,
    requestId: ctx.requestId,
    elapsedMs,
    policyVersion: ctx.policyVersion,
  };
}

export async function runAbx(ctx: AbxRequestContext): Promise<AbxResult> {
  const started = Date.now();

  const auth = authorize(ctx);
  if (!auth.allow) {
    return rejected(ctx, auth.code, auth.detail, Date.now() - started);
  }

  const heads = selectHeads(ctx.requestedCapabilities);
  const proposals: AbxProposal[] = [];
  const assessments: AbxAssessment[] = [];

  for (const head of heads) {
    if (Date.now() - started > ctx.deadlineMs) break;
    const proposal = await head.alpha(ctx);
    const assessment = await head.beta(ctx, proposal);

    const issue = policyCheck(ctx, proposal, assessment);
    if (issue) assessment.violations.push(issue);

    proposals.push(proposal);
    assessments.push(assessment);
  }

  if (assessments.length === 0) {
    return rejected(
      ctx,
      "DEADLINE_EXCEEDED",
      "El presupuesto temporal se agotó antes de obtener una evaluación.",
      Date.now() - started,
    );
  }

  const scores = assessments.map((a) => a.weightedScore);
  const average = scores.reduce((a, b) => a + b, 0) / scores.length;
  const consensus = consensusScore(scores);
  const hasIssues = assessments.some(
    (a) => a.violations.length > 0 || a.contradictions.length > 0,
  );
  const critical = ctx.risk === "critical";
  const finalDecision = decideFromScore(average, hasIssues, critical);

  const bestIndex = scores.indexOf(Math.max(...scores));
  const best = proposals[bestIndex] ?? proposals[0];

  const warnings = Array.from(
    new Set(
      assessments.flatMap((a) => [...a.violations, ...a.contradictions]),
    ),
  );

  const response =
    finalDecision === "commit" || finalDecision === "commit_with_notice"
      ? (best?.content ?? "")
      : finalDecision === "escalate"
        ? "Escalado a decisión humana: riesgo crítico bajo soberanía humana."
        : finalDecision === "repair"
          ? "Se requiere reparación de la propuesta antes de comprometerla."
          : finalDecision === "degrade"
            ? "Respuesta degradada: evidencia insuficiente para comprometer."
            : "Solicitud rechazada por política constitucional.";

  return {
    decision: finalDecision,
    response,
    confidence: average,
    epistemicScore:
      assessments.reduce((n, a) => n + a.scores.epistemic, 0) / assessments.length,
    safetyScore: Math.min(...assessments.map((a) => a.scores.safety)),
    policyScore: Math.min(...assessments.map((a) => a.scores.policy)),
    consensusScore: consensus,
    iterations: assessments.length,
    proposals,
    assessments,
    warnings,
    degraded: finalDecision === "degrade",
    requiresHuman:
      finalDecision === "escalate" ||
      assessments.some((a) => a.requiredEvidence.includes("human:approval")),
    traceId: ctx.traceId,
    requestId: ctx.requestId,
    elapsedMs: Date.now() - started,
    policyVersion: ctx.policyVersion,
  };
}

export async function decide(input: AbxInput): Promise<AbxResult> {
  return runAbx(createAbxContext(input));
}
