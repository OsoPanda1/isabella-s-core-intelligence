import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  createDefaultContext,
  assessIntent,
  evaluatePolicy,
  buildSystemPrompt,
  selectModules,
  resolveAllowedMemoryScopes,
  resolveAllowedTools,
  responseModeFor,
  buildAuditEvents,
  type RoutingDecision,
  type MemoryScope,
  DEFAULT_IDENTITY,
} from "@/lib/crown";
import { rateLimiter } from "@/lib/security/auth";

const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(12000),
      }),
    )
    .min(1)
    .max(40),
  locale: z.string().min(2).max(10).default("es-MX"),
});

function jsonError(error: string, status: number) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function getClientIP(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export const Route = createFileRoute("/api/isabella")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) {
          return jsonError("El núcleo de inferencia no está configurado.", 500);
        }

        // ── RATE LIMITING ──────────────────────────────────────────────
        const clientIP = getClientIP(request);
        const rateCheck = rateLimiter.check(clientIP, 30, 60 * 1000);
        if (!rateCheck.allowed) {
          return jsonError("Límite de solicitudes alcanzado. Reintenta en unos instantes.", 429);
        }

        // ── INPUT VALIDATION ───────────────────────────────────────────
        const parsed = bodySchema.safeParse(await request.json());
        if (!parsed.success) {
          return jsonError("Percepción inválida.", 400);
        }

        const { messages, locale } = parsed.data;

        // ── CROWN PIPELINE (SERVER-SIDE ENFORCEMENT) ───────────────────
        const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
        const input = lastUserMessage?.content ?? "";

        const context = createDefaultContext(input, { locale, source: "user" });

        const intent = assessIntent(input);
        const policy = evaluatePolicy(context, intent);
        const route = selectModules(intent);
        const identity = DEFAULT_IDENTITY;
        const memoryScopes = resolveAllowedMemoryScopes(intent, identity);
        const allowedTools = resolveAllowedTools(policy, intent);
        const responseMode = responseModeFor(policy);

        const decision: RoutingDecision = {
          requestId: context.requestId,
          traceId: `tr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
          crownVersion: "2.0.0",
          primary: route.primary,
          supporting: route.supporting,
          policy,
          identity,
          intent,
          evidence: {
            level: "none",
            sources: [],
            verified: false,
            limitations: [],
          },
          memoryScopes,
          allowedTools,
          responseMode,
          createdAt: new Date().toISOString(),
        };

        // ── BUILD CANONICAL SYSTEM PROMPT (NEVER FROM CLIENT) ──────────
        const canonicalSystem = buildSystemPrompt(decision);

        // ── AUDIT ──────────────────────────────────────────────────────
        const auditEvents = buildAuditEvents(context, decision);

        // ── DENY IF POLICY REQUIRES ────────────────────────────────────
        if (policy.status === "denied") {
          return new Response(
            JSON.stringify({
              error: "Solicitud denegada por política constitucional.",
              decision: {
                status: policy.status,
                risk: policy.risk,
                reasons: policy.reasons,
                traceId: decision.traceId,
              },
            }),
            { status: 403, headers: { "content-type": "application/json" } },
          );
        }

        // ── CALL UPSTREAM GATEWAY WITH CANONICAL PROMPT ────────────────
        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "Lovable-API-Key": apiKey,
            "X-Lovable-AIG-SDK": "fetch",
          },
          body: JSON.stringify({
            model: "google/gemini-3.6-flash",
            stream: true,
            temperature: 0.7,
            messages: [{ role: "system", content: canonicalSystem }, ...messages],
          }),
        });

        if (!upstream.ok || !upstream.body) {
          const detail = await upstream.text();
          console.error(`Isabella gateway error [${upstream.status}]: ${detail}`);
          const message =
            upstream.status === 429
              ? "Límite de inferencia alcanzado. Reintenta en unos instantes."
              : upstream.status === 402
                ? "Créditos de IA agotados en el espacio de trabajo."
                : `Fallo del núcleo de inferencia [${upstream.status}].`;
          return jsonError(message, upstream.status);
        }

        // ── STREAM RESPONSE WITH AUDIT HEADERS ─────────────────────────
        return new Response(upstream.body, {
          headers: {
            "content-type": "text/event-stream",
            "cache-control": "no-cache",
            connection: "keep-alive",
            "x-crown-trace-id": decision.traceId,
            "x-crown-request-id": decision.requestId,
            "x-crown-status": policy.status,
            "x-crown-risk": policy.risk,
            "x-crown-module": decision.primary,
          },
        });
      },
    },
  },
});
