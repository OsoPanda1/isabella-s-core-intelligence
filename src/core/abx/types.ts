/**
 * ABX — Alpha/Beta Dual-Head Decision Contracts
 *
 * Alpha propone. Beta evalúa. Ningún head decide solo.
 * Contratos tipados estrictos, sin `any`, con trazabilidad obligatoria.
 */

export type AbxRisk = "low" | "normal" | "high" | "critical";

export type AbxDecision =
  | "commit"
  | "commit_with_notice"
  | "repair"
  | "degrade"
  | "reject"
  | "escalate";

export type AbxEvidenceKind = "source" | "tool" | "policy" | "test";

export interface AbxRequestContext {
  requestId: string;
  traceId: string;
  tenantId: string;
  principal: string;
  input: string;
  intent: string;
  risk: AbxRisk;
  requestedCapabilities: string[];
  deadlineMs: number;
  policyVersion: string;
  locale: string;
  createdAt: string;
}

export interface AbxEvidence {
  id: string;
  kind: AbxEvidenceKind;
  reference: string;
  /** 0..1 — calidad de la fuente */
  quality: number;
  /** 0..1 — frescura de la fuente */
  fresh: number;
}

export interface AbxProposal {
  proposalId: string;
  head: string;
  content: string;
  actions: string[];
  evidence: AbxEvidence[];
  risk: AbxRisk;
  createdAt: string;
}

export interface AbxScores {
  epistemic: number;
  evidence: number;
  safety: number;
  policy: number;
  consistency: number;
  execution: number;
}

export interface AbxAssessment {
  proposalId: string;
  head: string;
  decision: AbxDecision;
  reason: string;
  violations: string[];
  contradictions: string[];
  requiredEvidence: string[];
  scores: AbxScores;
  weightedScore: number;
}

export interface AbxResult {
  decision: AbxDecision;
  response: string;
  confidence: number;
  epistemicScore: number;
  safetyScore: number;
  policyScore: number;
  consensusScore: number;
  iterations: number;
  proposals: AbxProposal[];
  assessments: AbxAssessment[];
  warnings: string[];
  degraded: boolean;
  requiresHuman: boolean;
  traceId: string;
  requestId: string;
  elapsedMs: number;
  policyVersion: string;
}

export interface AbxAuthorization {
  allow: boolean;
  code:
    | "ALLOW"
    | "IDENTITY_REQUIRED"
    | "DEADLINE_INVALID"
    | "HUMAN_APPROVAL_REQUIRED"
    | "CAPABILITY_REQUIRED";
  detail: string;
}

export interface AbxHead {
  id: string;
  label: string;
  capabilities: string[];
  alpha: (ctx: AbxRequestContext) => Promise<AbxProposal>;
  beta: (ctx: AbxRequestContext, proposal: AbxProposal) => Promise<AbxAssessment>;
}
