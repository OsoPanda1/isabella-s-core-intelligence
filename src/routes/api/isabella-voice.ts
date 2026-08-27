import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const bodySchema = z.object({
  text: z.string().min(1).max(4000),
  voice: z.string().min(1).max(40).default("alloy"),
});

export const Route = createFileRoute("/api/isabella-voice")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) {
          return new Response(
            JSON.stringify({ error: "El núcleo de síntesis vocal no está configurado." }),
            { status: 500, headers: { "content-type": "application/json" } },
          );
        }

        const parsed = bodySchema.safeParse(await request.json());
        if (!parsed.success) {
          return new Response(JSON.stringify({ error: "Percepción vocal inválida." }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }

        const { text, voice } = parsed.data;

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
          return new Response(JSON.stringify({ error: message }), {
            status: upstream.status,
            headers: { "content-type": "application/json" },
          });
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
