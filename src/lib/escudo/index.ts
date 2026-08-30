/**
 * ESCUDO — Security Perimeter Enforcement
 *
 * Capa de seguridad centralizada para Isabella Villaseñor AI.
 * Patrón adaptado de Hermes Agent Security (MIT) con renombramiento.
 *
 * Cada acción requiere: autorización, reversibilidad, auditoría.
 * Cada operación económica: desglose completo.
 * Cada uso de IA: modo y proveedor.
 */

// ============================================================================
// TYPES
// ============================================================================

export type SecurityLevel = "public" | "internal" | "confidential" | "secret";

export type AuthMethod = "api-key" | "session" | "hmac" | "internal" | "supabase";

export interface SecurityContext {
  authenticated: boolean;
  method: AuthMethod;
  subjectId?: string | undefined;
  roles: string[];
  permissions: string[];
  level: SecurityLevel;
  sessionId?: string;
  error?: string;
}

export interface AuthorizationRequest {
  action: string;
  resource: string;
  context: SecurityContext;
  metadata?: Record<string, unknown> | undefined;
}

export interface AuthorizationResult {
  allowed: boolean;
  reason: string;
  requiresApproval: boolean;
  auditEvent?: AuditEvent;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  subjectId?: string | undefined;
  action: string;
  resource: string;
  result: "allowed" | "denied" | "approval_required";
  method: AuthMethod;
  roles: string[];
  metadata?: Record<string, unknown> | undefined;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

// ============================================================================
// RATE LIMITER
// ============================================================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private limits = new Map<string, RateLimitEntry>();

  check(key: string, max: number, windowMs: number): RateLimitResult {
    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry || now > entry.resetAt) {
      this.limits.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, remaining: max - 1, resetAt: now + windowMs };
    }

    if (entry.count >= max) {
      return { allowed: false, remaining: 0, resetAt: entry.resetAt };
    }

    entry.count++;
    return { allowed: true, remaining: max - entry.count, resetAt: entry.resetAt };
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits) {
      if (now > entry.resetAt) this.limits.delete(key);
    }
  }
}

// ============================================================================
// ESCUDO PERIMETER
// ============================================================================

export class ESCUDOPerimeter {
  private rateLimiter = new RateLimiter();
  private auditLog: AuditEvent[] = [];

  authorize(request: AuthorizationRequest): AuthorizationResult {
    const auditId = `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Check authentication
    if (!request.context.authenticated) {
      const event: AuditEvent = {
        id: auditId,
        timestamp: new Date().toISOString(),
        action: request.action,
        resource: request.resource,
        result: "denied",
        method: request.context.method,
        roles: request.context.roles,
        metadata: { reason: "Not authenticated" },
      };
      this.auditLog.push(event);
      return { allowed: false, reason: "No autenticado", requiresApproval: false, auditEvent: event };
    }

    // Check permissions
    const hasPermission = request.context.permissions.includes("*") ||
      request.context.permissions.includes(`${request.action}:${request.resource}`);

    if (!hasPermission) {
      const event: AuditEvent = {
        id: auditId,
        timestamp: new Date().toISOString(),
        subjectId: request.context.subjectId,
        action: request.action,
        resource: request.resource,
        result: "denied",
        method: request.context.method,
        roles: request.context.roles,
        metadata: { reason: "Insufficient permissions" },
      };
      this.auditLog.push(event);
      return { allowed: false, reason: "Permisos insuficientes", requiresApproval: false, auditEvent: event };
    }

    // Check rate limit
    const rateKey = `${request.context.subjectId ?? "anon"}:${request.action}`;
    const rateCheck = this.rateLimiter.check(rateKey, 60, 60000);
    if (!rateCheck.allowed) {
      const event: AuditEvent = {
        id: auditId,
        timestamp: new Date().toISOString(),
        subjectId: request.context.subjectId,
        action: request.action,
        resource: request.resource,
        result: "denied",
        method: request.context.method,
        roles: request.context.roles,
        metadata: { reason: "Rate limit exceeded" },
      };
      this.auditLog.push(event);
      return { allowed: false, reason: "Límite de solicitudes alcanzado", requiresApproval: false, auditEvent: event };
    }

    // Determine if approval required
    const highImpact = ["delete", "transfer", "publish", "administer"].includes(request.action);
    const requiresApproval = highImpact && !request.context.roles.includes("admin");

    const event: AuditEvent = {
      id: auditId,
      timestamp: new Date().toISOString(),
      subjectId: request.context.subjectId,
      action: request.action,
      resource: request.resource,
      result: requiresApproval ? "approval_required" : "allowed",
      method: request.context.method,
      roles: request.context.roles,
      metadata: request.metadata,
    };
    this.auditLog.push(event);

    return {
      allowed: true,
      reason: "Autorizado",
      requiresApproval,
      auditEvent: event,
    };
  }

  getAuditLog(limit: number = 100): AuditEvent[] {
    return this.auditLog.slice(-limit);
  }

  cleanup(): void {
    this.rateLimiter.cleanup();
  }
}

export const escudoPerimeter = new ESCUDOPerimeter();
