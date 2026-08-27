import { useCallback, useEffect, useRef, useState } from "react";
import {
  PRESETS,
  buildSystemPrompt,
  route,
  type Preset,
  type PresetId,
  type RoutingDecision,
} from "./crown-ui";

export interface TerminalMessage {
  id: string;
  role: "user" | "isabella" | "system";
  content: string;
  timestamp: string;
  decision?: RoutingDecision;
  streaming?: boolean;
  error?: boolean;
}

const now = () =>
  new Date().toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

const uid = () => Math.random().toString(36).slice(2, 11);

const STORAGE_KEY = "isabella.session.v1";

const BOOT: TerminalMessage = {
  id: "boot",
  role: "system",
  content:
    "Núcleo C.R.O.W.N. sincronizado · ISA · SOPHIA · ORION · ARGUS en línea · Nodo Cero, Real del Monte, Hidalgo. Presencia establecida.",
  timestamp: now(),
};

function loadSession(): TerminalMessage[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { messages?: TerminalMessage[] };
    if (!Array.isArray(parsed.messages) || parsed.messages.length === 0) return null;
    return parsed.messages.map((m) => ({ ...m, streaming: false }));
  } catch {
    return null;
  }
}

export function useIsabella() {
  const [messages, setMessages] = useState<TerminalMessage[]>([BOOT]);
  const [hydrated, setHydrated] = useState(false);
  const [presetId, setPresetId] = useState<PresetId>("prime");
  const [isProcessing, setIsProcessing] = useState(false);
  const [decision, setDecision] = useState<RoutingDecision | null>(null);
  const [tokens, setTokens] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const preset: Preset = PRESETS.find((p) => p.id === presetId) ?? (PRESETS[0] as Preset);

  // Rehidratación del historial de la sesión activa.
  useEffect(() => {
    const restored = loadSession();
    if (restored) setMessages(restored);
    setHydrated(true);
  }, []);

  // Persistencia por sesión (se purga al cerrar la pestaña).
  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ savedAt: new Date().toISOString(), presetId, messages }),
      );
    } catch {
      /* cuota agotada: la sesión sigue viva en memoria */
    }
  }, [messages, presetId, hydrated]);

  const send = useCallback(
    async (input: string) => {
      const text = input.trim();
      if (!text || isProcessing) return;

      const routing = route(text, preset);
      setDecision(routing);

      const userMsg: TerminalMessage = {
        id: uid(),
        role: "user",
        content: text,
        timestamp: now(),
      };
      const replyId = uid();

      const history = [...messages, userMsg]
        .filter((m) => m.role !== "system" && !m.error)
        .slice(-16)
        .map((m) => ({
          role: m.role === "user" ? ("user" as const) : ("assistant" as const),
          content: m.content,
        }));

      setMessages((prev) => [
        ...prev,
        userMsg,
        {
          id: replyId,
          role: "isabella",
          content: "",
          timestamp: now(),
          decision: routing,
          streaming: true,
        },
      ]);
      setIsProcessing(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/isabella", {
          method: "POST",
          headers: { "content-type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            system: buildSystemPrompt(routing, preset),
            temperature: preset.temperature,
            messages: history,
          }),
        });

        if (!res.ok || !res.body) {
          const detail = await res.json().catch(() => ({ error: "Fallo de percepción." }));
          throw new Error(detail.error ?? "Fallo de percepción.");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let acc = "";

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let nl: number;
          while ((nl = buffer.indexOf("\n")) !== -1) {
            const line = buffer.slice(0, nl).trim();
            buffer = buffer.slice(nl + 1);
            if (!line.startsWith("data:")) continue;
            const payload = line.slice(5).trim();
            if (payload === "[DONE]") continue;
            try {
              const json = JSON.parse(payload);
              const delta: string | undefined = json.choices?.[0]?.delta?.content;
              if (delta) {
                acc += delta;
                setTokens((t) => t + 1);
                setMessages((prev) =>
                  prev.map((m) => (m.id === replyId ? { ...m, content: acc } : m)),
                );
              }
            } catch {
              /* fragmento parcial */
            }
          }
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === replyId
              ? {
                  ...m,
                  streaming: false,
                  content:
                    acc || "Silencio cognitivo: el núcleo no emitió síntesis para esta percepción.",
                }
              : m,
          ),
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Interrupción del núcleo.";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === replyId
              ? { ...m, streaming: false, error: true, content: `ARGUS :: ${message}` }
              : m,
          ),
        );
      } finally {
        setIsProcessing(false);
        abortRef.current = null;
      }
    },
    [isProcessing, messages, preset],
  );

  const stop = useCallback(() => abortRef.current?.abort(), []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setMessages([
      {
        id: uid(),
        role: "system",
        content: "Sesión purgada. Memoria inmediata reiniciada · trazabilidad preservada.",
        timestamp: now(),
      },
    ]);
    setDecision(null);
    setTokens(0);
  }, []);

  /** Descarga la conversación completa en JSON auditable. */
  const downloadConversation = useCallback(() => {
    const payload = {
      artifact: "isabella.conversation",
      version: 1,
      exportedAt: new Date().toISOString(),
      node: "Nodo Cero · Real del Monte, Hidalgo",
      presetId,
      messages,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `isabella-conversacion-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [messages, presetId]);

  /** Reabre una conversación exportada previamente. */
  const openConversation = useCallback(async (file: File) => {
    const raw = await file.text();
    const parsed = JSON.parse(raw) as { messages?: TerminalMessage[]; presetId?: PresetId };
    if (!Array.isArray(parsed.messages) || parsed.messages.length === 0) {
      throw new Error("Archivo de conversación inválido.");
    }
    abortRef.current?.abort();
    if (parsed.presetId && PRESETS.some((p) => p.id === parsed.presetId)) {
      setPresetId(parsed.presetId);
    }
    setMessages([
      ...parsed.messages.map((m) => ({ ...m, streaming: false })),
      {
        id: uid(),
        role: "system" as const,
        content: `Conversación reabierta desde archivo · ${parsed.messages.length} fragmentos restaurados · trazabilidad preservada.`,
        timestamp: now(),
      },
    ]);
    setDecision(null);
  }, []);

  return {
    messages,
    send,
    stop,
    reset,
    isProcessing,
    preset,
    presetId,
    setPresetId,
    decision,
    tokens,
    downloadConversation,
    openConversation,
  };
}
