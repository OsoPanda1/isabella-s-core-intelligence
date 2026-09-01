/**
 * ABX — Capa de política.
 *
 * Autorización previa (Zero Trust) y verificación cruzada
 * entre la propuesta de Alpha y la evaluación de Beta.
 */

import { DESTRUCTIVE_PATTERNS, SECRET_PATTERNS } from "@/lib/crown";
import type {
  AbxAssessment,
  AbxAuthorization,
  AbxProposal,
  AbxRequestContext,
} from "./types";

export const ABX_POLICY_VERSION = "abx-1.0.0";

/** Capacidad obligatoria para riesgo crítico. */
export const HUMAN_APPROVAL_CAPABILITY = "human:approval";

export function authorize(ctx: AbxRequestContext): AbxAuthorization {
  if (!ctx.tenantId.trim() || !ctx.principal.trim()) {
    return {
      allow: false,
      code: "IDENTITY_REQUIRED",
      detail: "Se requiere identidad de tenant y principal validados.",
    };
  }

  if (!Number.isFinite(ctx.deadlineMs) || ctx.deadlineMs < 50) {
    return {
      allow: false,
      code: "DEADLINE_INVALID",
      detail: "El presupuesto temporal debe ser de al menos 50 ms.",
    };
  }

  if (ctx.requestedCapabilities.length === 0) {
    return {
      allow: false,
      code: "CAPABILITY_REQUIRED",
      detail: "Ninguna capacidad solicitada: whitelist Zero Trust vacía.",
    };
  }

  if (
    ctx.risk === "critical" &&
    !ctx.requestedCapabilities.includes(HUMAN_APPROVAL_CAPABILITY)
  ) {
    return {
      allow: false,
      code: "HUMAN_APPROVAL_REQUIRED",
      detail:
        "Riesgo crítico sin capacidad human:approval. El humano decide, aprueba y ejecuta.",
    };
  }

  return { allow: true, code: "ALLOW", detail: "Autorizado con monitoreo." };
}

/** Señales textuales prohibidas dentro de una propuesta. */
export function scanProposal(proposal: AbxProposal): string[] {
  const violations: string[] = [];
  const content = proposal.content.toLowerCase();

  if (DESTRUCTIVE_PATTERNS.some((p) => p.test(content))) {
    violations.push("DESTRUCTIVE_CONTENT");
  }
  if (SECRET_PATTERNS.some((p) => p.test(content))) {
    violations.push("SECRET_DISCLOSURE");
  }
  if (proposal.content.trim().length === 0) {
    violations.push("EMPTY_PROPOSAL");
  }
  return violations;
}

/** Coherencia entre contexto, propuesta y evaluación. */
export function policyCheck(
  ctx: AbxRequestContext,
  proposal: AbxProposal,
  assessment: AbxAssessment,
): string | null {
  if (proposal.risk !== ctx.risk) return "RISK_MISMATCH";
  if (assessment.violations.length > 0) return "POLICY_VIOLATION";
  if (assessment.proposalId !== proposal.proposalId) return "TRACE_MISMATCH";

  const unauthorized = proposal.actions.filter(
    (action) => !ctx.requestedCapabilities.includes(action),
  );
  if (unauthorized.length > 0) return `CAPABILITY_NOT_WHITELISTED:${unauthorized[0]}`;

  return null;
}
