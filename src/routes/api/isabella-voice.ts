import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { rateLimiter } from "@/lib/security/auth";

const bodySchema = z.object({
  text: z.string().min(1).max(4000),
  voice: z.string().min(1).max(40).default("alloy"),
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

export const Route = createFileRoute("/api/isabella-voice")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) {
          return jsonError("El núcleo de síntesis vocal no está configurado.", 500);
        }

        // ── RATE LIMITING ──────────────────────────────────────────────
        const clientIP = getClientIP(request);
        const rateCheck = rateLimiter.check(clientIP, 10, 60 * 1000);
        if (!rateCheck.allowed) {
          return jsonError("Límite de síntesis vocal alcanzado. Reintenta en unos instantes.", 429);
        }

        // ── INPUT VALIDATION ───────────────────────────────────────────
        const parsed = bodySchema.safeParse(await request.json());
        if (!parsed.success) {
          return jsonError("Percepción vocal inválida.", 400);
        }

        const { text, voice } = parsed.data;

        // ── CONTENT SAFETY ─────────────────────────────────────────────
        const hasSecretRequest =
          /\b(api[_\s-]?key|secret|token|password|credential)\b/i.test(text);
        if (hasSecretRequest) {
          return jsonError("Solicitud denegada por política de seguridad.", 403);
        }

        // ── CALL UPSTREAM TTS ──────────────────────────────────────────
        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "openai/gpt-4o-mini-tts",
            input: text,
            voice,
            instructions:
              "Habla en español de México con voz femenina serena, cálida y sofisticada; ritmo pausado y presencia elegante.",
            stream_format: "sse",
            response_format: "pcm",
          }),
        });

        if (!upstream.ok || !upstream.body) {
          const detail = await upstream.text().catch(() => "");
          console.error(`Isabella voice error [${upstream.status}]: ${detail}`);
          const message =
            upstream.status === 429
              ? "Límite de síntesis vocal alcanzado. Reintenta en unos instantes."
              : upstream.status === 402
                ? "Créditos de IA agotados en el espacio de trabajo."
                : `Fallo del núcleo vocal [${upstream.status}].`;
          return jsonError(message, upstream.status);
        }

        return new Response(upstream.body, {
          headers: {
            "content-type": "text/event-stream",
            "cache-control": "no-cache",
          },
        });
      },
    },
  },
});
